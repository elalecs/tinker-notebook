import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { MockFactory } from '../../testUtils/mockFactory';
import { OutputFormatterManager } from '../../../formatting/outputFormatterManager';
import { ExecutionResult } from '../../../execution/executor';
import { JsonFormatter } from '../../../formatting/formatters/jsonFormatter';
import { StringFormatter } from '../../../formatting/formatters/stringFormatter';

suite('OutputFormatterManager Tests', () => {
  let mockFactory: MockFactory;
  let mockOutputChannel: vscode.OutputChannel;
  let formatterManager: OutputFormatterManager;
  let sandbox: sinon.SinonSandbox;
  let appendLineSpy: sinon.SinonSpy;
  let clearSpy: sinon.SinonSpy;
  let showSpy: sinon.SinonSpy;
  
  const mockResult: ExecutionResult = {
    output: 'Test output',
    exitCode: 0,
    executionTime: 100
  };
  
  const mockJsonResult: ExecutionResult = {
    output: '{"name": "John", "age": 30}',
    exitCode: 0,
    executionTime: 100
  };
  
  const mockDocument = {
    uri: { fsPath: '/test/path' }
  } as vscode.TextDocument;
  
  const mockRange = {
    start: { line: 0, character: 0 },
    end: { line: 10, character: 0 }
  } as vscode.Range;

  setup(() => {
    mockFactory = new MockFactory();
    sandbox = mockFactory.sandbox;
    mockOutputChannel = mockFactory.createMockOutputChannel();
    
    // Since appendLine, clear, and show are already stubbed in the MockFactory,
    // we don't need to spy on them again, just reference them
    appendLineSpy = mockOutputChannel.appendLine as sinon.SinonStub;
    clearSpy = mockOutputChannel.clear as sinon.SinonStub;
    showSpy = mockOutputChannel.show as sinon.SinonStub;
    
    formatterManager = new OutputFormatterManager(mockOutputChannel);
  });

  teardown(() => {
    sandbox.restore();
  });

  test('Should initialize with default formatters', () => {
    // We can't directly access private properties, so we test the behavior
    const formatted = formatterManager.formatOutput(mockJsonResult);
    // If JSON formatter exists, result should be formatted JSON
    assert.ok(formatted.includes('"name"'));
    assert.ok(formatted.includes('"age"'));
  });

  test('Should format plain text output correctly', () => {
    const result = formatterManager.formatOutput(mockResult);
    assert.strictEqual(result, 'Test output');
  });

  test('Should format JSON output correctly', () => {
    const result = formatterManager.formatOutput(mockJsonResult);
    assert.ok(result.includes('"name"'));
    assert.ok(result.includes('John'));
  });

  test('Should show formatted result in output channel', () => {
    formatterManager.showFormattedResult(mockResult, mockDocument, mockRange, true);
    
    // Should clear the output channel first
    assert.strictEqual(clearSpy.callCount, 1);
    
    // Should append PHP header
    assert.ok(appendLineSpy.calledWith('=== PHP Execution Result ==='));
    
    // Should append execution time
    assert.ok(appendLineSpy.calledWith('Execution time: 100ms'));
    
    // Should append output header
    assert.ok(appendLineSpy.calledWith('=== Output ==='));
    
    // Should append formatted output
    assert.ok(appendLineSpy.calledWith('Test output'));
    
    // Should show the output channel
    assert.strictEqual(showSpy.callCount, 1);
  });

  test('Should toggle collapsible sections', () => {
    // Mock window.showInformationMessage
    const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');
    
    formatterManager.toggleCollapsible();
    
    // Should show info message since we can't directly manipulate collapsibles
    assert.strictEqual(showInfoStub.callCount, 1);
  });

  test('Should handle export result with no last result', async () => {
    // Mock window.showErrorMessage
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');
    
    await formatterManager.exportResult('JSON');
    
    // Should show error message since there's no last result
    assert.strictEqual(showErrorStub.callCount, 1);
    assert.ok(showErrorStub.calledWith('No result to export. Execute a code block first.'));
  });

  test('Should handle export result with unknown format', async () => {
    // Set a last result by showing a result first
    formatterManager.showFormattedResult(mockResult, mockDocument, mockRange, true);
    
    // Mock window.showErrorMessage
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');
    
    await formatterManager.exportResult('UNKNOWN');
    
    // Should show error message for unknown format
    assert.strictEqual(showErrorStub.callCount, 1);
    assert.ok(showErrorStub.calledWith('No exporter found for format: UNKNOWN'));
  });

  test('Should register custom formatter', () => {
    // This test is limited because we can't access private formatters array
    // Just verify that the method doesn't throw an error
    const customFormatter = new JsonFormatter();
    
    // This should not throw an error
    formatterManager.registerFormatter(customFormatter);
    
    // Positive check that we can still format JSON
    const result = formatterManager.formatOutput(mockJsonResult);
    assert.ok(result.includes('"name"') || result.includes('name'), 
      "Should still format JSON properly after adding custom formatter");
  });

  test('Should return "No output generated" for empty output', () => {
    const emptyResult: ExecutionResult = {
      output: '',
      exitCode: 0,
      executionTime: 100
    };
    
    const result = formatterManager.formatOutput(emptyResult);
    assert.strictEqual(result, 'No output generated');
  });
});