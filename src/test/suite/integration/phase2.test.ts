import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import { LaravelDetector } from '../../../laravel/detector';
import { LaravelManager } from '../../../laravel/manager';
import { TinkerExecutor } from '../../../execution/tinkerExecutor';
import { CodeBlockDetector } from '../../../codeBlock/detector';

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

suite('Phase 2 Integration Tests', () => {
    let sandbox: sinon.SinonSandbox;
    let outputChannel: vscode.OutputChannel;
    let diagnosticCollection: vscode.DiagnosticCollection;
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
        
        // Stub workspace folders
        sandbox.stub(vscode.workspace, 'workspaceFolders').value([
            { uri: { fsPath: '/workspace/project' } }
        ]);
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
    
    test('End-to-end flow for PHP code block execution', async () => {
        // Create a markdown document with a PHP code block
        const content = '# Test Markdown\n\n```php\necho "Hello, World!";\n```';
        const uri = vscode.Uri.parse('untitled:test.md');
        const document = await vscode.workspace.openTextDocument({ language: 'markdown', content });
        
        // Detect code blocks
        const detector = new CodeBlockDetector();
        const blocks = detector.findCodeBlocks(document);
        
        // Verify block detection
        assert.strictEqual(blocks.length, 1);
        assert.strictEqual(blocks[0].language, 'php');
        assert.strictEqual(blocks[0].content, 'echo "Hello, World!";\n');
        assert.strictEqual(blocks[0].type, 'php');
        
        // Skip actual execution as this is just a test
    });
    
    test('End-to-end flow for Tinker code block execution', async () => {
        // Create a markdown document with a Tinker code block
        const content = '# Test Markdown\n\n```tinker\n$users = User::all();\n```';
        const uri = vscode.Uri.parse('untitled:test.md');
        const document = await vscode.workspace.openTextDocument({ language: 'markdown', content });
        
        // Detect code blocks
        const detector = new CodeBlockDetector();
        const blocks = detector.findCodeBlocks(document);
        
        // Verify block detection
        assert.strictEqual(blocks.length, 1);
        assert.strictEqual(blocks[0].language, 'tinker');
        assert.strictEqual(blocks[0].content, '$users = User::all();\n');
        assert.strictEqual(blocks[0].type, 'tinker');
        
        // Stub LaravelDetector.isLaravelProject
        sandbox.stub(LaravelDetector, 'isLaravelProject').returns(true);
        
        // Stub LaravelDetector.getNearestLaravelProject
        sandbox.stub(LaravelDetector, 'getNearestLaravelProject').returns('/workspace/laravel');
        
        // Stub fsWrapper methods
        sandbox.stub(fsWrapper, 'existsSync').returns(true);
        sandbox.stub(fsWrapper, 'mkdirSync');
        sandbox.stub(fsWrapper, 'writeFileSync');
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
        
        // Stub cpWrapper.spawn
        const spawnStub = sandbox.stub(cpWrapper, 'spawn').returns({, callback: (data: Buffer) => void) => {
                    // No stderr output
                }
            },
            on: (event: string, callback: (code: number | null) => void) => {
                if (event === 'close') {
                    callback(0);
                }
            }
        } as unknown as cp.ChildProcess);
        
        // Create TinkerExecutor
        const executor = new TinkerExecutor(outputChannel, diagnosticCollection);
        
        // Execute the Tinker code
        const result = await executor.executeCode(blocks[0].content, document);
        
        // Verify result
        assert.strictEqual(result.exitCode, 0);
        assert.strictEqual(result.output, 'Tinker output');
        
        // Verify Tinker was executed
        assert.strictEqual(spawnStub.calledOnce, true);
        assert.strictEqual(spawnStub.firstCall.args[0] === 'php', true);
        assert.deepStrictEqual(spawnStub.firstCall.args[1], ['artisan', 'tinker', sinon.match(/tinker-\d+\.php$/)]);
    });
    
    test('Integration between LaravelDetector and LaravelManager', async () => {
        // Stub LaravelDetector.getNearestLaravelProject
        sandbox.stub(LaravelDetector, 'getNearestLaravelProject')
            .withArgs('/workspace/project/file.php')
            .returns('/workspace/laravel');
        
        // Create LaravelManager
        const manager = new LaravelManager(outputChannel);
        
        // Get Laravel project
        const project = await manager.getLaravelProject('/workspace/project/file.php');
        
        // Verify correct project was returned
        assert.strictEqual(project, '/workspace/laravel');
    });
    
    test('Integration between LaravelManager and TinkerExecutor', async () => {
        // Create mock document
        const document = {
            uri: { fsPath: '/workspace/project/file.php' },
            languageId: 'php',
            version: 1,
            getText: () => '<?php echo "test";',
            lineAt: () => ({ text: '', range: new vscode.Range(0, 0, 0, 0) }),
            lineCount: 1,
            fileName: '/workspace/project/file.php',
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
        
        // Stub LaravelDetector.getNearestLaravelProject
        sandbox.stub(LaravelDetector, 'getNearestLaravelProject')
            .withArgs('/workspace/project/file.php')
            .returns('/workspace/laravel');
        
        // Stub fsWrapper methods
        sandbox.stub(fsWrapper, 'existsSync').returns(true);
        sandbox.stub(fsWrapper, 'mkdirSync');
        sandbox.stub(fsWrapper, 'writeFileSync');
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
        
        // Stub cpWrapper.spawn
        const spawnStub = sandbox.stub(cpWrapper, 'spawn').returns({, callback: (data: Buffer) => void) => {
                    // No stderr output
                }
            },
            on: (event: string, callback: (code: number | null) => void) => {
                if (event === 'close') {
                    callback(0);
                }
            }
        } as unknown as cp.ChildProcess);
        
        // Create TinkerExecutor
        const executor = new TinkerExecutor(outputChannel, diagnosticCollection);
        
        // Execute code
        const result = await executor.executeCode('$users = User::all();', document);
        
        // Verify result
        assert.strictEqual(result.exitCode, 0);
        assert.strictEqual(result.output, 'Tinker output');
        
        // Verify Tinker was executed with correct Laravel project
        assert.strictEqual(spawnStub.calledOnce, true);
        assert.deepStrictEqual(spawnStub.firstCall.args[2], { cwd: '/workspace/laravel' });
    });
    
    test('Fallback to temporary Laravel project when no project found', async () => {
        // Create mock document
        const document = {
            uri: { fsPath: '/workspace/project/file.php' },
            languageId: 'php',
            version: 1,
            getText: () => '<?php echo "test";',
            lineAt: () => ({ text: '', range: new vscode.Range(0, 0, 0, 0) }),
            lineCount: 1,
            fileName: '/workspace/project/file.php',
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
        
        // Stub LaravelDetector.getNearestLaravelProject to return null
        sandbox.stub(LaravelDetector, 'getNearestLaravelProject').returns(null);
        
        // Stub fs.existsSync to return true for temp project artisan
        const existsSyncStub = sandbox.stub(fs, 'existsSync');
        existsSyncStub.withArgs(sinon.match(/laravel\/artisan$/)).returns(true);
        existsSyncStub.returns(true);
        
        // Stub fs.mkdirSync
        sandbox.stub(fs, 'mkdirSync');
        
        // Stub fs.writeFileSync
        sandbox.stub(fs, 'writeFileSync');
        
        // Stub fs.unlinkSync
        sandbox.stub(fs, 'unlinkSync');
        
        // Stub cp.spawn
        const spawnStub = sandbox.stub(cp, 'spawn').returns({
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
        
        // Create TinkerExecutor
        const executor = new TinkerExecutor(outputChannel, diagnosticCollection);
        
        // Execute code
        const result = await executor.executeCode('$users = User::all();', document);
        
        // Verify result
        assert.strictEqual(result.exitCode, 0);
        assert.strictEqual(result.output, 'Tinker output');
        
        // Verify Tinker was executed with temp Laravel project
        assert.strictEqual(spawnStub.calledOnce, true);
        assert.deepStrictEqual(spawnStub.firstCall.args[2], { cwd: sinon.match(/\.tinker-notebook\/laravel$/) });
    });
});
