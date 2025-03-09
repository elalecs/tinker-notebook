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
    sinon.assert.calledOnce(mockOutputChannel.clear);
    
    // Should append PHP header
    sinon.assert.calledWith(mockOutputChannel.appendLine, '=== PHP Execution Result ===');
    
    // Should append execution time
    sinon.assert.calledWith(mockOutputChannel.appendLine, 'Execution time: 100ms');
    
    // Should append output header
    sinon.assert.calledWith(mockOutputChannel.appendLine, '=== Output ===');
    
    // Should append formatted output
    sinon.assert.calledWith(mockOutputChannel.appendLine, 'Test output');
    
    // Should show the output channel
    sinon.assert.calledOnce(mockOutputChannel.show);
  });

  test('Should toggle collapsible sections', () => {
    // Mock window.showInformationMessage
    const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');
    
    formatterManager.toggleCollapsible();
    
    // Should show info message since we can't directly manipulate collapsibles
    sinon.assert.calledOnce(showInfoStub);
  });

  test('Should handle export result with no last result', async () => {
    // Mock window.showErrorMessage
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');
    
    await formatterManager.exportResult('JSON');
    
    // Should show error message since there's no last result
    sinon.assert.calledOnce(showErrorStub);
  });

  test('Should handle export result with unknown format', async () => {
    // Set a last result by showing a result first
    formatterManager.showFormattedResult(mockResult, mockDocument, mockRange, true);
    
    // Mock window.showErrorMessage
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');
    
    await formatterManager.exportResult('UNKNOWN');
    
    // Should show error message for unknown format
    sinon.assert.calledOnce(showErrorStub);
  });

  test('Should register custom formatter', () => {
    const customFormatter = new JsonFormatter();
    const canFormatSpy = sinon.spy(customFormatter, 'canFormat');
    
    formatterManager.registerFormatter(customFormatter);
    
    // Format a JSON output
    formatterManager.formatOutput(mockJsonResult);
    
    // Custom formatter's canFormat should have been called
    sinon.assert.called(canFormatSpy);
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