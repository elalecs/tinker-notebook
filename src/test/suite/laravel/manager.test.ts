import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { LaravelManager } from '../../../laravel/manager';
import { LaravelDetector } from '../../../laravel/detector';
import { FileSystemService } from '../../../utils/fileSystemService';

suite('LaravelManager Tests', () => {
    let manager: LaravelManager;
    let outputChannel: vscode.OutputChannel;
    let sandbox: sinon.SinonSandbox;
    const existsSyncStub = sinon.stub<[string], boolean>();
    const mkdirSyncStub = sinon.stub<[string, fs.MakeDirectoryOptions?], void>();
    const readFileSyncStub = sinon.stub<[string, (BufferEncoding | undefined)?], string | Buffer>()
      .callThrough()
      .withArgs(sinon.match.string).returns(Buffer.from('mock-content'))
      .withArgs(sinon.match.string, 'utf-8').returns('mock-content-utf8');
    const writeFileSyncStub = sinon.stub<[string, string], void>();

    const mockFs: FileSystemService = {
      existsSync: existsSyncStub,
      mkdirSync: mkdirSyncStub,
      readFileSync: readFileSyncStub,
      writeFileSync: writeFileSyncStub,
      unlinkSync: sinon.stub()
    };
    
    setup(() => {
        // Create sandbox for managing stubs
        sandbox = sinon.createSandbox();
        
        // Create mock output channel
        outputChannel = {
            name: 'Test Output Channel',
            append: sinon.stub(),
            appendLine: sinon.stub(),
            clear: sinon.stub(),
            show: sinon.stub(),
            hide: sinon.stub(),
            dispose: sinon.stub()
        } as unknown as vscode.OutputChannel;
        
        // Stub workspace folders
        sandbox.stub(vscode.workspace, 'workspaceFolders').value([
            { uri: { fsPath: '/workspace/project' } }
        ]);
        
        // Create manager with mock dependencies
        manager = new LaravelManager(vscode.workspace.workspaceFolders, mockFs, outputChannel);
    });
    
    teardown(() => {
        // Restore all stubs
        sandbox.restore();
    });
    
    test('constructor should create temp directory if it does not exist', () => {
        // Reset stubs for this test
        sandbox.restore();
        
        // Stub workspace folders
        sandbox.stub(vscode.workspace, 'workspaceFolders').value([
            { uri: { fsPath: '/workspace/project' } }
        ]);
        
        // Create stub for existsSync
        const existsStub = sinon.stub().returns(false);
        // Create stub for mkdirSync
        const mkdirStub = sinon.stub();
        
        // Create mock fs with fresh stubs
        const freshMockFs: FileSystemService = {
            existsSync: existsStub,
            mkdirSync: mkdirStub,
            readFileSync: sinon.stub(),
            writeFileSync: sinon.stub(),
            unlinkSync: sinon.stub()
        };
        
        // Create new manager with fresh mocks
        new LaravelManager(vscode.workspace.workspaceFolders, freshMockFs, outputChannel);
        
        // Verify mkdirSync was called
        assert.strictEqual(mkdirStub.calledOnce, true);
        assert.deepStrictEqual(mkdirStub.firstCall.args[1], { recursive: true });
    });
    
    test('constructor should use OS temp directory if no workspace folders', () => {
        // Reset stubs for this test
        sandbox.restore();
        
        // Stub workspace folders to be undefined
        sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);
        
        // Create new manager
        new LaravelManager(vscode.workspace.workspaceFolders, mockFs, outputChannel);
        
        // We can't easily test the exact path, but we can verify it doesn't throw an error
        const appendLineStub = outputChannel.appendLine as sinon.SinonStub;
        assert.strictEqual(appendLineStub.notCalled, true);
    });
    
    test('getLaravelProject should return nearest project if available', async () => {
        // Stub LaravelDetector.getNearestLaravelProject
        sandbox.stub(LaravelDetector, 'getNearestLaravelProject')
            .withArgs('/workspace/project/file.php')
            .returns('/workspace/project');
        
        const result = await manager.getLaravelProject('/workspace/project/file.php');
        assert.strictEqual(result, '/workspace/project');
    });
    
    test('getLaravelProject should return temp project if it exists', async () => {
        // Stub LaravelDetector.getNearestLaravelProject to return null
        sandbox.stub(LaravelDetector, 'getNearestLaravelProject').returns(null);
        
        // Stub fs.existsSync to return true for temp project artisan file
        existsSyncStub.withArgs(sinon.match(/laravel\/artisan$/)).returns(true);
        
        const result = await manager.getLaravelProject('/workspace/project/file.php');
        assert.match(result as string, /laravel$/);
    });
    
    test('getLaravelProject should try to create temp project if needed', async () => {
        // Stub LaravelDetector.getNearestLaravelProject to return null
        sandbox.stub(LaravelDetector, 'getNearestLaravelProject').returns(null);
        
        // Stub fs.existsSync to return false for temp project artisan file
        existsSyncStub.withArgs(sinon.match(/laravel\/artisan$/)).returns(false);
        
        // Stub private method createTemporaryLaravelProject
        const createProjectStub = sandbox.stub(manager as any, 'createTemporaryLaravelProject')
            .resolves('/workspace/project/.tinker-notebook/laravel');
        
        const result = await manager.getLaravelProject('/workspace/project/file.php');
        assert.strictEqual(createProjectStub.calledOnce, true);
        assert.strictEqual(result, '/workspace/project/.tinker-notebook/laravel');
    });
    
    test('createTemporaryLaravelProject should return null if composer is not available', async () => {
        // Stub isCommandAvailable to return false
        sandbox.stub(manager as any, 'isCommandAvailable')
            .withArgs('composer')
            .resolves(false);
        
        const result = await (manager as any).createTemporaryLaravelProject();
        assert.strictEqual(result, null);
        const appendLineStub = outputChannel.appendLine as sinon.SinonStub;
        assert.strictEqual(
            appendLineStub.calledWith(sinon.match(/Composer is not available/)),
            true
        );
    });
    
    test('createTemporaryLaravelProject should create directory if it does not exist', async () => {
        // Reset stubs for this test
        sandbox.restore();
        
        // Create fresh stubs
        const existsStub = sinon.stub();
        const mkdirStub = sinon.stub();
        
        // Configure existsStub behavior
        existsStub.returns(true); // Default return value
        existsStub.withArgs(sinon.match(/laravel$/)).returns(false); // Return false for laravel directory
        
        // Create fresh mockFs with new stubs
        const freshMockFs: FileSystemService = {
            existsSync: existsStub,
            mkdirSync: mkdirStub,
            readFileSync: sinon.stub(),
            writeFileSync: sinon.stub(),
            unlinkSync: sinon.stub()
        };
        
        // Create output channel stub
        const outputChannelStub = {
            name: 'Test Output Channel',
            append: sinon.stub(),
            appendLine: sinon.stub(),
            clear: sinon.stub(),
            show: sinon.stub(),
            hide: sinon.stub(),
            dispose: sinon.stub()
        } as unknown as vscode.OutputChannel;
        
        // Create new manager with fresh mocks
        const freshManager = new LaravelManager(
            [{ uri: { fsPath: '/workspace/project' } } as vscode.WorkspaceFolder],
            freshMockFs, 
            outputChannelStub
        );
        
        // Stub isCommandAvailable to return true
        sandbox.stub(freshManager as any, 'isCommandAvailable')
            .withArgs('composer')
            .resolves(true);
        
        // Create processExecutor stub
        const processExecutorStub = {
            executeCommand: sinon.stub().resolves({
                output: 'Laravel installed',
                exitCode: 0
            }),
            execute: sinon.stub()
        };
        
        // Replace the processExecutor
        (freshManager as any).processExecutor = processExecutorStub;
        
        // Execute the method
        await (freshManager as any).createTemporaryLaravelProject();
        
        // Verify mkdirSync was called
        assert.strictEqual(mkdirStub.called, true);
    });
    
    test('createTemporaryLaravelProject should execute composer command', async () => {
        // Stub isCommandAvailable to return true
        sandbox.stub(manager as any, 'isCommandAvailable')
            .withArgs('composer')
            .resolves(true);
        
        // Create a stub for processExecutor
        const executeCommandStub = sandbox.stub().resolves({
            output: 'Laravel installed',
            exitCode: 0
        });
        
        // Replace the processExecutor
        (manager as any).processExecutor = {
            executeCommand: executeCommandStub,
            execute: sandbox.stub()
        };
        
        const result = await (manager as any).createTemporaryLaravelProject();
        
        // Verify executeCommand was called with correct arguments
        assert.strictEqual(
            executeCommandStub.calledWith(
                'composer create-project --prefer-dist laravel/laravel .',
                sinon.match(/laravel$/)
            ),
            true
        );
        
        assert.match(result, /laravel$/);
        const appendLineStub = outputChannel.appendLine as sinon.SinonStub;
        assert.strictEqual(
            appendLineStub.calledWith(sinon.match(/created successfully/)),
            true
        );
    });
    
    test('createTemporaryLaravelProject should handle command failure', async () => {
        // Stub isCommandAvailable to return true
        sandbox.stub(manager as any, 'isCommandAvailable')
            .withArgs('composer')
            .resolves(true);
        
        // Replace the processExecutor with a stub that returns failure
        (manager as any).processExecutor = {
            executeCommand: sandbox.stub().resolves({
                output: '',
                error: 'Command failed',
                exitCode: 1
            }),
            execute: sandbox.stub()
        };
        
        const result = await (manager as any).createTemporaryLaravelProject();
        
        assert.strictEqual(result, null);
        const appendLineStub = outputChannel.appendLine as sinon.SinonStub;
        assert.strictEqual(
            appendLineStub.calledWith(sinon.match(/Failed to create Laravel project/)),
            true
        );
    });
    
    test('createTemporaryLaravelProject should handle exceptions', async () => {
        // Stub isCommandAvailable to return true
        sandbox.stub(manager as any, 'isCommandAvailable')
            .withArgs('composer')
            .resolves(true);
        
        // Replace the processExecutor with a stub that throws an error
        (manager as any).processExecutor = {
            executeCommand: sandbox.stub().throws(new Error('Test error')),
            execute: sandbox.stub()
        };
        
        const result = await (manager as any).createTemporaryLaravelProject();
        
        assert.strictEqual(result, null);
        const appendLineStub = outputChannel.appendLine as sinon.SinonStub;
        assert.strictEqual(
            appendLineStub.calledWith(sinon.match(/Error creating Laravel project/)),
            true
        );
    });
    
    test('isCommandAvailable should return true if command exists', async () => {
        // Replace the processExecutor with a stub that returns success
        (manager as any).processExecutor = {
            executeCommand: sandbox.stub().resolves({
                output: '/usr/bin/composer',
                exitCode: 0
            }),
            execute: sandbox.stub()
        };
        
        const result = await (manager as any).isCommandAvailable('composer');
        assert.strictEqual(result, true);
    });
    
    test('isCommandAvailable should return false if command does not exist', async () => {
        // Replace the processExecutor with a stub that returns failure
        (manager as any).processExecutor = {
            executeCommand: sandbox.stub().resolves({
                output: '',
                error: 'Command not found',
                exitCode: 1
            }),
            execute: sandbox.stub()
        };
        
        const result = await (manager as any).isCommandAvailable('nonexistent-command');
        assert.strictEqual(result, false);
    });
    
    test('isCommandAvailable should handle exceptions', async () => {
        // Replace the processExecutor with a stub that throws an error
        (manager as any).processExecutor = {
            executeCommand: sandbox.stub().throws(new Error('Test error')),
            execute: sandbox.stub()
        };
        
        const result = await (manager as any).isCommandAvailable('composer');
        assert.strictEqual(result, false);
    });
    
    test('processExecutor.executeCommand should be properly called', async () => {
        // Create a stub for processExecutor.executeCommand
        const executeCommandStub = sandbox.stub().resolves({
            output: 'Command output',
            error: '',
            exitCode: 0
        });
        
        // Replace the processExecutor
        (manager as any).processExecutor = {
            executeCommand: executeCommandStub,
            execute: sandbox.stub()
        };
        
        // Call a method that uses processExecutor.executeCommand
        const result = await (manager as any).isCommandAvailable('test-command');
        
        // Verify that executeCommand was called
        assert.strictEqual(executeCommandStub.called, true);
        assert.strictEqual(result, true);
    });
    
    test('processExecutor should handle command errors', async () => {
        // Create a stub for processExecutor.executeCommand that returns an error
        const executeCommandStub = sandbox.stub().resolves({
            output: '',
            error: 'Error output',
            exitCode: 2
        });
        
        // Replace the processExecutor
        (manager as any).processExecutor = {
            executeCommand: executeCommandStub,
            execute: sandbox.stub()
        };
        
        // Call a method that uses processExecutor.executeCommand
        const result = await (manager as any).isCommandAvailable('test-command');
        
        // Verify the expected behavior
        assert.strictEqual(result, false);
    });
});
