import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import * as cp from 'child_process';
import { TinkerExecutor } from '../../../execution/tinkerExecutor';
import { LaravelManager } from '../../../laravel/manager';
import { ExecutionResult } from '../../../execution/executor';

// Create a wrapper for fs to allow stubbing
const fsWrapper = {
    existsSync: fs.existsSync,
    mkdirSync: fs.mkdirSync,
    writeFileSync: fs.writeFileSync,
    unlinkSync: fs.unlinkSync
};

// Create a wrapper for child_process to allow stubbing
const cpWrapper = {
    spawn: cp.spawn
};

suite('TinkerExecutor Tests', () => {
    let executor: TinkerExecutor;
    let outputChannel: vscode.OutputChannel;
    let diagnosticCollection: vscode.DiagnosticCollection;
    let sandbox: sinon.SinonSandbox;
    let originalFs: PropertyDescriptor | undefined;
    let originalCp: PropertyDescriptor | undefined;
    
    setup(() => {
        // Create sandbox for managing stubs
        sandbox = sinon.createSandbox();
        
        // Save original fs descriptor
        originalFs = Object.getOwnPropertyDescriptor(global, 'fs');
        
        // Save original cp descriptor
        originalCp = Object.getOwnPropertyDescriptor(global, 'cp');
        
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
        
        // Create mock diagnostic collection
        diagnosticCollection = {
            name: 'Test Diagnostic Collection',
            set: sinon.stub(),
            delete: sinon.stub(),
            clear: sinon.stub(),
            forEach: sinon.stub(),
            get: sinon.stub(),
            has: sinon.stub(),
            dispose: sinon.stub()
        } as unknown as vscode.DiagnosticCollection;
        
        // Create executor with mock dependencies
        executor = new TinkerExecutor(outputChannel, diagnosticCollection);
    });
    
    teardown(() => {
        // Restore all stubs
        sandbox.restore();
        
        // Restore original fs
        if (originalFs) {
            Object.defineProperty(global, 'fs', originalFs);
        }
        
        // Restore original cp
        if (originalCp) {
            Object.defineProperty(global, 'cp', originalCp);
        }
    });
    
    test('executeCode should throw error if no Laravel project found', async () => {
        // Create mock document
        const document = {
            uri: { fsPath: '/workspace/file.php' },
            languageId: 'php',
            version: 1,
            getText: () => '<?php echo "test";',
            lineAt: () => ({ text: '', range: new vscode.Range(0, 0, 0, 0) }),
            lineCount: 1,
            fileName: '/workspace/file.php',
            isDirty: false,
            isUntitled: false,
            isClosed: false,
            eol: vscode.EndOfLine.LF,
            save: () => Promise.resolve(true),
            getWordRangeAtPosition: () => undefined,
            offsetAt: () => 0,
            positionAt: () => new vscode.Position(0, 0),
            validateRange: (range: vscode.Range) => range,
            validatePosition: (position: vscode.Position) => position
        } as unknown as vscode.TextDocument;
        
        // Stub LaravelManager.getLaravelProject to return null
        sandbox.stub(LaravelManager.prototype, 'getLaravelProject').resolves(null);
        
        // Execute code
        const result = await executor.executeCode('<?php echo "test";', document);
        
        // Verify error
        assert.strictEqual(result.exitCode, 1);
        assert.strictEqual(result.error!.includes('No Laravel project found'), true);
    });
    
    test('executeCode should create temp file and execute Tinker', async () => {
        // Create mock document
        const document = {
            uri: { fsPath: '/workspace/file.php' },
            languageId: 'php',
            version: 1,
            getText: () => '<?php echo "test";',
            lineAt: () => ({ text: '', range: new vscode.Range(0, 0, 0, 0) }),
            lineCount: 1,
            fileName: '/workspace/file.php',
            isDirty: false,
            isUntitled: false,
            isClosed: false,
            eol: vscode.EndOfLine.LF,
            save: () => Promise.resolve(true),
            getWordRangeAtPosition: () => undefined,
            offsetAt: () => 0,
            positionAt: () => new vscode.Position(0, 0),
            validateRange: (range: vscode.Range) => range,
            validatePosition: (position: vscode.Position) => position
        } as unknown as vscode.TextDocument;
        
        // Stub LaravelManager.getLaravelProject to return a project path
        sandbox.stub(LaravelManager.prototype, 'getLaravelProject').resolves('/workspace/laravel');
        
        // Stub workspace folders
        sandbox.stub(vscode.workspace, 'workspaceFolders').value([
            { uri: { fsPath: '/workspace' } }
        ]);
        
        // Stub fsWrapper methods
        const existsSyncStub = sandbox.stub(fsWrapper, 'existsSync');
        existsSyncStub.returns(true);
        
        // Stub fsWrapper.mkdirSync
        sandbox.stub(fsWrapper, 'mkdirSync');
        
        // Stub fsWrapper.writeFileSync
        const writeFileSyncStub = sandbox.stub(fsWrapper, 'writeFileSync');
        
        // Stub fsWrapper.unlinkSync
        const unlinkSyncStub = sandbox.stub(fsWrapper, 'unlinkSync');
        
        // Replace fs with our wrapper
        Object.defineProperty(global, 'fs', {
            value: fsWrapper,
            writable: true,
            configurable: true
        });
        
        // Replace cp with our wrapper
        Object.defineProperty(global, 'cp', {
            value: cpWrapper,
            writable: true,
            configurable: true
        });
        
        // Stub cpWrapper.spawn to simulate successful execution
        const spawnStub = sandbox.stub(cpWrapper, 'spawn').returns({
            stdout: {
                on: (event: string, callback: (data: Buffer) => void) => {
                    if (event === 'data') {
                        callback(Buffer.from('Tinker output'));
                    }
                }
            },
            stderr: {
                on: (event: string, callback: (data: Buffer) => void) => {
                    // No stderr output
                }
            },
            on: (event: string, callback: (code: number | null) => void) => {
                if (event === 'close') {
                    callback(0);
                }
            }
        } as unknown as cp.ChildProcess);
        
        // Execute code
        const result = await executor.executeCode('<?php echo "test";', document);
        
        // Verify temp file creation
        assert.strictEqual(writeFileSyncStub.calledOnce, true);
        assert.strictEqual(
            (writeFileSyncStub.firstCall.args[1] as string).includes('echo "test"'),
            true
        );
        
        // Verify Tinker execution
        assert.strictEqual(spawnStub.calledOnce, true);
        assert.strictEqual(spawnStub.firstCall.args[0] === 'php', true);
        assert.deepStrictEqual(spawnStub.firstCall.args[1], ['artisan', 'tinker', sinon.match(/tinker-\d+\.php$/)]);
        assert.deepStrictEqual(spawnStub.firstCall.args[2], { cwd: '/workspace/laravel' });
        
        // Verify temp file cleanup
        assert.strictEqual(unlinkSyncStub.calledOnce, true);
        
        // Verify result
        assert.strictEqual(result.output, 'Tinker output');
        assert.strictEqual(result.exitCode, 0);
        assert.strictEqual(result.error, undefined);
    });
    
    test('executeCode should handle Tinker execution error', async () => {
        // Create mock document
        const document = {
            uri: { fsPath: '/workspace/file.php' },
            languageId: 'php',
            version: 1,
            getText: () => '<?php echo "test";',
            lineAt: () => ({ text: '', range: new vscode.Range(0, 0, 0, 0) }),
            lineCount: 1,
            fileName: '/workspace/file.php',
            isDirty: false,
            isUntitled: false,
            isClosed: false,
            eol: vscode.EndOfLine.LF,
            save: () => Promise.resolve(true),
            getWordRangeAtPosition: () => undefined,
            offsetAt: () => 0,
            positionAt: () => new vscode.Position(0, 0),
            validateRange: (range: vscode.Range) => range,
            validatePosition: (position: vscode.Position) => position
        } as unknown as vscode.TextDocument;
        
        // Stub LaravelManager.getLaravelProject to return a project path
        sandbox.stub(LaravelManager.prototype, 'getLaravelProject').resolves('/workspace/laravel');
        
        // Stub workspace folders
        sandbox.stub(vscode.workspace, 'workspaceFolders').value([
            { uri: { fsPath: '/workspace' } }
        ]);
        
        // Stub fsWrapper methods
        sandbox.stub(fsWrapper, 'existsSync').returns(true);
        
        // Stub fsWrapper.mkdirSync
        sandbox.stub(fsWrapper, 'mkdirSync');
        
        // Stub fsWrapper.writeFileSync
        sandbox.stub(fsWrapper, 'writeFileSync');
        
        // Stub fsWrapper.unlinkSync
        sandbox.stub(fsWrapper, 'unlinkSync');
        
        // Replace fs with our wrapper
        Object.defineProperty(global, 'fs', {
            value: fsWrapper,
            writable: true,
            configurable: true
        });
        
        // Replace cp with our wrapper
        Object.defineProperty(global, 'cp', {
            value: cpWrapper,
            writable: true,
            configurable: true
        });
        
        // Stub cpWrapper.spawn to simulate execution error
        const spawnStub = sandbox.stub(cpWrapper, 'spawn').returns({
            stdout: {
                on: (event: string, callback: (data: Buffer) => void) => {
                    // No stdout output
                }
            },
            stderr: {
                on: (event: string, callback: (data: Buffer) => void) => {
                    if (event === 'data') {
                        callback(Buffer.from('Tinker error'));
                    }
                }
            },
            on: (event: string, callback: (code: number | null) => void) => {
                if (event === 'close') {
                    callback(1);
                }
            }
        } as unknown as cp.ChildProcess);
        
        // Execute code
        const result = await executor.executeCode('<?php echo "test";', document);
        
        // Verify result
        assert.strictEqual(result.output, '');
        assert.strictEqual(result.exitCode, 1);
        assert.strictEqual(result.error, 'Tinker error');
    });
    
    test('executeCode should handle spawn error', async () => {
        // Create mock document
        const document = {
            uri: { fsPath: '/workspace/file.php' },
            languageId: 'php',
            version: 1,
            getText: () => '<?php echo "test";',
            lineAt: () => ({ text: '', range: new vscode.Range(0, 0, 0, 0) }),
            lineCount: 1,
            fileName: '/workspace/file.php',
            isDirty: false,
            isUntitled: false,
            isClosed: false,
            eol: vscode.EndOfLine.LF,
            save: () => Promise.resolve(true),
            getWordRangeAtPosition: () => undefined,
            offsetAt: () => 0,
            positionAt: () => new vscode.Position(0, 0),
            validateRange: (range: vscode.Range) => range,
            validatePosition: (position: vscode.Position) => position
        } as unknown as vscode.TextDocument;
        
        // Stub LaravelManager.getLaravelProject to return a project path
        sandbox.stub(LaravelManager.prototype, 'getLaravelProject').resolves('/workspace/laravel');
        
        // Stub workspace folders
        sandbox.stub(vscode.workspace, 'workspaceFolders').value([
            { uri: { fsPath: '/workspace' } }
        ]);
        
        // Stub fsWrapper methods
        sandbox.stub(fsWrapper, 'existsSync').returns(true);
        
        // Stub fsWrapper.mkdirSync
        sandbox.stub(fsWrapper, 'mkdirSync');
        
        // Stub fsWrapper.writeFileSync
        sandbox.stub(fsWrapper, 'writeFileSync');
        
        // Stub fsWrapper.unlinkSync
        sandbox.stub(fsWrapper, 'unlinkSync');
        
        // Replace fs with our wrapper
        Object.defineProperty(global, 'fs', {
            value: fsWrapper,
            writable: true,
            configurable: true
        });
        
        // Replace cp with our wrapper
        Object.defineProperty(global, 'cp', {
            value: cpWrapper,
            writable: true,
            configurable: true
        });
        
        // Stub cpWrapper.spawn to simulate spawn error
        const spawnStub = sandbox.stub(cpWrapper, 'spawn').returns({
            stdout: {
                on: (event: string, callback: (data: Buffer) => void) => {
                    // No stdout output
                }
            },
            stderr: {
                on: (event: string, callback: (data: Buffer) => void) => {
                    // No stderr output
                }
            },
            on: (event: string, callback: any) => {
                if (event === 'error') {
                    callback(new Error('Spawn error'));
                }
            }
        } as unknown as cp.ChildProcess);
        
        // Execute code
        const result = await executor.executeCode('<?php echo "test";', document);
        
        // Verify result
        assert.strictEqual(result.output, '');
        assert.strictEqual(result.exitCode, 1);
        assert.strictEqual(result.error, 'Failed to start Tinker process: Spawn error');
    });
    
    test('createTempCodeFile should remove PHP tags', async () => {
        // Stub workspace folders
        sandbox.stub(vscode.workspace, 'workspaceFolders').value([
            { uri: { fsPath: '/workspace' } }
        ]);
        
        // Stub fsWrapper methods
        sandbox.stub(fsWrapper, 'existsSync').returns(true);
        
        // Stub fsWrapper.mkdirSync
        sandbox.stub(fsWrapper, 'mkdirSync');
        
        // Stub fsWrapper.writeFileSync
        const writeFileSyncStub = sandbox.stub(fsWrapper, 'writeFileSync');
        
        // Replace fs with our wrapper
        Object.defineProperty(global, 'fs', {
            value: fsWrapper,
            writable: true,
            configurable: true
        });
        
        // Call createTempCodeFile with PHP tags
        await (executor as any).createTempCodeFile('<?php echo "test"; ?>');
        
        // Verify PHP tags were removed
        assert.strictEqual(writeFileSyncStub.calledOnce, true);
        assert.strictEqual(writeFileSyncStub.firstCall.args[1], ' echo "test"; ');
    });
    
    test('executeTinker should throw error if artisan file does not exist', async () => {
        // Stub fsWrapper.existsSync to return false for artisan file
        const existsSyncStub = sandbox.stub(fsWrapper, 'existsSync');
        existsSyncStub.withArgs(sinon.match(/artisan$/)).returns(false);
        
        // Call executeTinker
        const result = await (executor as any).executeTinker('/temp/file.php', '/workspace/laravel');
        
        // Verify error
        assert.strictEqual(result.exitCode, 1);
        assert.strictEqual(result.error!.includes('Artisan file not found'), true);
    });
    
    test('showResult should display output and clear diagnostics if no error', () => {
        // Create mock document and range
        const document = {
            uri: { fsPath: '/workspace/file.php' }
        } as unknown as vscode.TextDocument;
        
        const range = new vscode.Range(0, 0, 1, 0);
        
        // Create result with output and no error
        const result: ExecutionResult = {
            output: 'Test output',
            exitCode: 0,
            executionTime: 100
        };
        
        // Call showResult
        executor.showResult(result, document, range);
        
        // Verify output channel was used
        const clearStub = outputChannel.clear as sinon.SinonStub;
        assert.strictEqual(clearStub.calledOnce, true);
        
        const appendLineStub = outputChannel.appendLine as sinon.SinonStub;
        assert.strictEqual(
            appendLineStub.calledWith('=== Laravel Tinker Execution Result ==='),
            true
        );
        assert.strictEqual(
            appendLineStub.calledWith('=== Output ==='),
            true
        );
        assert.strictEqual(
            appendLineStub.calledWith('Test output'),
            true
        );
        
        const showStub = outputChannel.show as sinon.SinonStub;
        assert.strictEqual(showStub.calledOnce, true);
        
        // Verify diagnostics were cleared
        const deleteStub = diagnosticCollection.delete as sinon.SinonStub;
        assert.strictEqual(deleteStub.calledOnce, true);
        assert.strictEqual(
            deleteStub.calledWith(document.uri),
            true
        );
    });
    
    test('showResult should display error and add diagnostic if error present', () => {
        // Create mock document and range
        const document = {
            uri: { fsPath: '/workspace/file.php' }
        } as unknown as vscode.TextDocument;
        
        const range = new vscode.Range(0, 0, 1, 0);
        
        // Create result with error
        const result: ExecutionResult = {
            output: '',
            error: 'Test error',
            exitCode: 1,
            executionTime: 100
        };
        
        // Call showResult
        executor.showResult(result, document, range);
        
        // Verify output channel was used
        const clearStub = outputChannel.clear as sinon.SinonStub;
        assert.strictEqual(clearStub.calledOnce, true);
        
        const appendLineStub = outputChannel.appendLine as sinon.SinonStub;
        assert.strictEqual(
            appendLineStub.calledWith('=== Laravel Tinker Execution Result ==='),
            true
        );
        assert.strictEqual(
            appendLineStub.calledWith('=== Error ==='),
            true
        );
        assert.strictEqual(
            appendLineStub.calledWith('Test error'),
            true
        );
        
        const showStub = outputChannel.show as sinon.SinonStub;
        assert.strictEqual(showStub.calledOnce, true);
        
        // Verify diagnostic was added
        const setStub = diagnosticCollection.set as sinon.SinonStub;
        assert.strictEqual(setStub.calledOnce, true);
        assert.strictEqual(
            setStub.calledWith(document.uri, sinon.match.array),
            true
        );
    });
});
