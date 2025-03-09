import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { MockFactory } from '../../testUtils/mockFactory';
import { OutputFormatterManager } from '../../../formatting/outputFormatterManager';
import { ExecutionResult } from '../../../execution/executor';
import { CodeExecutor } from '../../../execution/executor';
import { TinkerExecutor } from '../../../execution/tinkerExecutor';

suite('Enhanced Output Formatting Integration Tests', () => {
  let mockFactory: MockFactory;
  let sandbox: sinon.SinonSandbox;
  let mockOutputChannel: vscode.OutputChannel;
  let mockDiagnosticCollection: vscode.DiagnosticCollection;
  let formatterManager: OutputFormatterManager;
  let codeExecutor: CodeExecutor;
  let tinkerExecutor: TinkerExecutor;
  
  const mockDocument = {
    uri: { fsPath: '/test/path' },
    languageId: 'markdown'
  } as vscode.TextDocument;
  
  const mockRange = {
    start: { line: 0, character: 0 },
    end: { line: 10, character: 0 }
  } as vscode.Range;

  setup(() => {
    mockFactory = new MockFactory();
    sandbox = mockFactory.sandbox;
    mockOutputChannel = mockFactory.createMockOutputChannel();
    mockDiagnosticCollection = mockFactory.createMockDiagnosticCollection();
    
    formatterManager = new OutputFormatterManager(mockOutputChannel);
    codeExecutor = new CodeExecutor(mockOutputChannel, mockDiagnosticCollection);
    tinkerExecutor = new TinkerExecutor(mockOutputChannel, mockDiagnosticCollection);
  });

  teardown(() => {
    sandbox.restore();
  });

  test('PHP Executor and OutputFormatterManager integration', async () => {
    // Stub the executePhp method to return a test result
    sandbox.stub(CodeExecutor.prototype as any, 'executePhp').resolves({
      output: '{"name": "John", "age": 30}',
      error: undefined,
      exitCode: 0
    });
    
    // Stub the createTempCodeFile method to avoid actual file operations
    sandbox.stub(CodeExecutor.prototype as any, 'createTempCodeFile').resolves('/temp/test.php');
    
    // Spy on formatterManager.showFormattedResult
    const showFormattedResultSpy = sandbox.spy(formatterManager, 'showFormattedResult');
    
    // Execute code
    const result = await codeExecutor.executeCode('echo json_encode(["name" => "John", "age" => 30]);');
    
    // Call formatter manually (in real code, this would be called by extension.ts)
    formatterManager.showFormattedResult(result, mockDocument, mockRange, true);
    
    // Verify formatterManager.showFormattedResult was called
    sinon.assert.calledOnce(showFormattedResultSpy);
    
    // Verify output contains formatted JSON
    sinon.assert.calledWith(mockOutputChannel.appendLine, sinon.match(/=== Output ===/));
    
    // Output should be in JSON format
    assert.ok(result.output.includes('John'));
    assert.ok(result.output.includes('30'));
  });

  test('Tinker Executor and OutputFormatterManager integration', async () => {
    // Create mock LaravelManager
    const mockLaravelManager = mockFactory.createMockLaravelManager();
    
    // Create a new TinkerExecutor with the mock LaravelManager
    const tinkerExecutor = new TinkerExecutor(
      mockOutputChannel, 
      mockDiagnosticCollection,
      mockLaravelManager,
      mockFactory.createMockFileSystem(),
      mockFactory.createMockProcessExecutor()
    );
    
    // Stub the executeTinker method to return a test result with PHP array output
    sandbox.stub(TinkerExecutor.prototype as any, 'executeTinker').resolves({
      output: 'array(3) {\n  [0]=>  int(1)\n  [1]=>  int(2)\n  [2]=>  int(3)\n}',
      error: undefined,
      exitCode: 0,
      executionTime: 100
    });
    
    // Spy on formatterManager.showFormattedResult
    const showFormattedResultSpy = sandbox.spy(formatterManager, 'showFormattedResult');
    
    // Execute tinker code
    const result = await tinkerExecutor.executeCode('[1, 2, 3]', mockDocument);
    
    // Call formatter manually (in real code, this would be called by extension.ts)
    formatterManager.showFormattedResult(result, mockDocument, mockRange, false);
    
    // Verify formatterManager.showFormattedResult was called
    sinon.assert.calledOnce(showFormattedResultSpy);
    
    // Verify output contains Laravel Tinker header
    sinon.assert.calledWith(mockOutputChannel.appendLine, '=== Laravel Tinker Execution Result ===');
    
    // Output should be a PHP array
    assert.ok(result.output.includes('array(3)'));
  });

  test('Error handling in integration', async () => {
    // Stub the executePhp method to return an error result
    sandbox.stub(CodeExecutor.prototype as any, 'executePhp').resolves({
      output: '',
      error: 'Parse error: syntax error, unexpected token "echo"',
      exitCode: 1
    });
    
    // Execute code with syntax error
    const result = await codeExecutor.executeCode('echo echo "Syntax error";');
    
    // Call formatter manually
    formatterManager.showFormattedResult(result, mockDocument, mockRange, true);
    
    // Verify error output is shown
    sinon.assert.calledWith(mockOutputChannel.appendLine, '=== Error ===');
    sinon.assert.calledWith(mockOutputChannel.appendLine, 'Parse error: syntax error, unexpected token "echo"');
  });

  test('Export functionality integration', async () => {
    // Stub window.showSaveDialog to simulate cancelling
    sandbox.stub(vscode.window, 'showSaveDialog').resolves(undefined);
    
    // Stub window.showErrorMessage to check for error handling
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');
    
    // Execute JSON export without a previous result
    await formatterManager.exportResult('JSON');
    
    // Verify error message was shown
    sinon.assert.calledOnce(showErrorStub);
    sinon.assert.calledWith(showErrorStub, 'No result to export. Execute a code block first.');
  });
});