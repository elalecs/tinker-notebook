import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import * as child_process from 'child_process';
import { LaravelManager } from '../../../laravel/manager';
import { LaravelDetector } from '../../../laravel/detector';

suite('LaravelManager Tests', () => {
    let manager: LaravelManager;
    let outputChannel: vscode.OutputChannel;
    let sandbox: sinon.SinonSandbox;
    
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
        
        // Stub fs.existsSync and fs.mkdirSync
        sandbox.stub(fs, 'existsSync').returns(true);
        sandbox.stub(fs, 'mkdirSync');
        
        // Create manager with mock dependencies
        manager = new LaravelManager(outputChannel);
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
        
        // Stub fs.existsSync to return false for temp directory
        const existsSyncStub = sandbox.stub(fs, 'existsSync').returns(false);
        
        // Stub fs.mkdirSync
        const mkdirSyncStub = sandbox.stub(fs, 'mkdirSync');
        
        // Create new manager
        const newManager = new LaravelManager(outputChannel);
        
        // Verify mkdirSync was called
        assert.strictEqual(mkdirSyncStub.calledOnce, true);
        assert.strictEqual(
            mkdirSyncStub.calledWith(
                sinon.match(/\.tinker-notebook$/),
                sinon.match({ recursive: true })
            ),
            true
        );
    });
    
    test('constructor should use OS temp directory if no workspace folders', () => {
        // Reset stubs for this test
        sandbox.restore();
        
        // Stub workspace folders to be undefined
        sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);
        
        // Stub fs.existsSync and fs.mkdirSync
        sandbox.stub(fs, 'existsSync').returns(true);
        sandbox.stub(fs, 'mkdirSync');
        
        // Create new manager
        const newManager = new LaravelManager(outputChannel);
        
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
        const existsSyncStub = sandbox.stub(fs, 'existsSync');
        existsSyncStub.withArgs(sinon.match(/laravel\/artisan$/)).returns(true);
        
        const result = await manager.getLaravelProject('/workspace/project/file.php');
        assert.strictEqual(result, sinon.match(/laravel$/));
    });
    
    test('getLaravelProject should try to create temp project if needed', async () => {
        // Stub LaravelDetector.getNearestLaravelProject to return null
        sandbox.stub(LaravelDetector, 'getNearestLaravelProject').returns(null);
        
        // Stub fs.existsSync to return false for temp project artisan file
        const existsSyncStub = sandbox.stub(fs, 'existsSync');
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
        // Stub isCommandAvailable to return true
        sandbox.stub(manager as any, 'isCommandAvailable')
            .withArgs('composer')
            .resolves(true);
        
        // Stub fs.existsSync to return false for temp project directory
        const existsSyncStub = sandbox.stub(fs, 'existsSync');
        existsSyncStub.withArgs(sinon.match(/laravel$/)).returns(false);
        
        // Stub fs.mkdirSync
        const mkdirSyncStub = sandbox.stub(fs, 'mkdirSync');
        
        // Stub executeCommand to return success
        sandbox.stub(manager as any, 'executeCommand').resolves({
            output: 'Laravel installed',
            exitCode: 0
        });
        
        await (manager as any).createTemporaryLaravelProject();
        
        // Verify mkdirSync was called
        assert.strictEqual(mkdirSyncStub.calledOnce, true);
        assert.strictEqual(
            mkdirSyncStub.calledWith(
                sinon.match(/laravel$/),
                sinon.match({ recursive: true })
            ),
            true
        );
    });
    
    test('createTemporaryLaravelProject should execute composer command', async () => {
        // Stub isCommandAvailable to return true
        sandbox.stub(manager as any, 'isCommandAvailable')
            .withArgs('composer')
            .resolves(true);
        
        // Stub executeCommand
        const executeCommandStub = sandbox.stub(manager as any, 'executeCommand').resolves({
            output: 'Laravel installed',
            exitCode: 0
        });
        
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
        
        // Stub executeCommand to return failure
        sandbox.stub(manager as any, 'executeCommand').resolves({
            output: '',
            error: 'Command failed',
            exitCode: 1
        });
        
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
        
        // Stub executeCommand to throw error
        sandbox.stub(manager as any, 'executeCommand').throws(new Error('Test error'));
        
        const result = await (manager as any).createTemporaryLaravelProject();
        
        assert.strictEqual(result, null);
        const appendLineStub = outputChannel.appendLine as sinon.SinonStub;
        assert.strictEqual(
            appendLineStub.calledWith(sinon.match(/Error creating Laravel project/)),
            true
        );
    });
    
    test('isCommandAvailable should return true if command exists', async () => {
        // Stub executeCommand to return success
        sandbox.stub(manager as any, 'executeCommand').resolves({
            output: '/usr/bin/composer',
            exitCode: 0
        });
        
        const result = await (manager as any).isCommandAvailable('composer');
        assert.strictEqual(result, true);
    });
    
    test('isCommandAvailable should return false if command does not exist', async () => {
        // Stub executeCommand to return failure
        sandbox.stub(manager as any, 'executeCommand').resolves({
            output: '',
            error: 'Command not found',
            exitCode: 1
        });
        
        const result = await (manager as any).isCommandAvailable('nonexistent-command');
        assert.strictEqual(result, false);
    });
    
    test('isCommandAvailable should handle exceptions', async () => {
        // Stub executeCommand to throw error
        sandbox.stub(manager as any, 'executeCommand').throws(new Error('Test error'));
        
        const result = await (manager as any).isCommandAvailable('composer');
        assert.strictEqual(result, false);
    });
    
    test('executeCommand should resolve with command output', async () => {
        // Stub child_process.exec
        const execStub = sandbox.stub(child_process, 'exec');
        
        // Mock the callback
        execStub.callsFake((command, options, callback) => {
            callback!(null, 'Command output', '');
            return {} as any;
        });
        
        const result = await (manager as any).executeCommand('test-command');
        
        assert.deepStrictEqual(result, {
            output: 'Command output',
            error: '',
            exitCode: 0
        });
    });
    
    test('executeCommand should handle command errors', async () => {
        // Stub child_process.exec
        const execStub = sandbox.stub(child_process, 'exec');
        
        // Mock the callback with error
        execStub.callsFake((command, options, callback) => {
            const error = new Error('Command failed') as any;
            error.code = 2;
            callback!(error, '', 'Error output');
            return {} as any;
        });
        
        const result = await (manager as any).executeCommand('test-command');
        
        assert.deepStrictEqual(result, {
            output: '',
            error: 'Error output',
            exitCode: 2
        });
    });
});
