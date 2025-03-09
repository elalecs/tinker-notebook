import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { TinkerExecutor } from '../../../execution/tinkerExecutor';
import { MockFactory } from '../../testUtils/mockFactory';
import { FsTestHelper } from '../../testUtils/fsTestHelper';

suite('TinkerExecutor Unit Tests', () => {
  let mockFactory: MockFactory;
  let mockFileSystem: any;
  let mockProcessExecutor: any;
  let mockLaravelManager: any;
  let mockOutputChannel: vscode.OutputChannel;
  let mockDiagnosticCollection: vscode.DiagnosticCollection;
  let executor: TinkerExecutor;
  
  setup(() => {
    // Create mock factory and mocks
    mockFactory = new MockFactory();
    mockFileSystem = mockFactory.createMockFileSystem();
    mockProcessExecutor = mockFactory.createMockProcessExecutor();
    mockLaravelManager = mockFactory.createMockLaravelManager();
    mockOutputChannel = mockFactory.createMockOutputChannel();
    mockDiagnosticCollection = mockFactory.createMockDiagnosticCollection();
    
    // Configure the mock Laravel manager
    (mockLaravelManager.getLaravelProject as sinon.SinonStub).resolves('/mock/laravel/path');
    
    // Configure the mock file system
    (mockFileSystem.existsSync as sinon.SinonStub).returns(true);
    
    // Create executor with mocks
    executor = new TinkerExecutor(
      mockOutputChannel,
      mockDiagnosticCollection,
      mockLaravelManager,
      mockFileSystem,
      mockProcessExecutor
    );
  });
  
  teardown(() => {
    mockFactory.restore();
  });
  
  test('executeCode should create temp file and execute tinker when Laravel project found', async () => {
    // Create a mock document
    const document = {
      uri: { fsPath: '/workspace/test/file.md' },
      getText: () => '```tinker\n$users = User::all();\n```',
      lineAt: () => ({ text: '', range: new vscode.Range(0, 0, 0, 0) })
    } as unknown as vscode.TextDocument;
    
    // Execute code
    const result = await executor.executeCode('$users = User::all();', document);
    
    // Verify that the file was created
    assert.strictEqual((mockFileSystem.writeFileSync as sinon.SinonStub).calledOnce, true);
    
    // Verify that the process executor was called with expected args
    assert.strictEqual((mockProcessExecutor.execute as sinon.SinonStub).calledOnce, true);
    const executeArgs = (mockProcessExecutor.execute as sinon.SinonStub).firstCall.args;
    assert.strictEqual(executeArgs[0], 'php');
    assert.deepStrictEqual(executeArgs[1][0], 'artisan');
    assert.deepStrictEqual(executeArgs[1][1], 'tinker');
    
    // Verify that the temp file was cleaned up
    assert.strictEqual((mockFileSystem.unlinkSync as sinon.SinonStub).calledOnce, true);
    
    // Verify the result
    assert.strictEqual(result.output, 'Mock execution output');
    assert.strictEqual(result.error, undefined);
    assert.strictEqual(result.exitCode, 0);
  });
  
  test('executeCode should handle errors when Laravel project is not found', async () => {
    // Override the mock to return null
    (mockLaravelManager.getLaravelProject as sinon.SinonStub).resolves(null);
    
    // Create a mock document
    const document = {
      uri: { fsPath: '/workspace/test/file.md' },
      getText: () => '```tinker\n$users = User::all();\n```',
      lineAt: () => ({ text: '', range: new vscode.Range(0, 0, 0, 0) })
    } as unknown as vscode.TextDocument;
    
    // Execute code
    const result = await executor.executeCode('$users = User::all();', document);
    
    // Verify that no file was created
    assert.strictEqual((mockFileSystem.writeFileSync as sinon.SinonStub).called, false);
    
    // Verify that the process executor was not called
    assert.strictEqual((mockProcessExecutor.execute as sinon.SinonStub).called, false);
    
    // Verify the error result
    assert.strictEqual(result.output, '');
    assert.ok(result.error?.includes('No Laravel project found'));
    assert.strictEqual(result.exitCode, 1);
  });
  
  test('executeCode should handle process execution errors', async () => {
    // Configure the process executor to simulate an error
    (mockProcessExecutor.execute as sinon.SinonStub).resolves({
      output: '',
      error: 'Command failed',
      exitCode: 1,
      executionTime: 100
    });
    
    // Create a mock document
    const document = {
      uri: { fsPath: '/workspace/test/file.md' },
      getText: () => '```tinker\n$users = User::all();\n```',
      lineAt: () => ({ text: '', range: new vscode.Range(0, 0, 0, 0) })
    } as unknown as vscode.TextDocument;
    
    // Execute code
    const result = await executor.executeCode('$users = User::all();', document);
    
    // Verify that the file was created
    assert.strictEqual((mockFileSystem.writeFileSync as sinon.SinonStub).calledOnce, true);
    
    // Verify that the process executor was called
    assert.strictEqual((mockProcessExecutor.execute as sinon.SinonStub).calledOnce, true);
    
    // Verify that the temp file was cleaned up
    assert.strictEqual((mockFileSystem.unlinkSync as sinon.SinonStub).calledOnce, true);
    
    // Verify the error result
    assert.strictEqual(result.output, '');
    assert.strictEqual(result.error, 'Command failed');
    assert.strictEqual(result.exitCode, 1);
  });
});