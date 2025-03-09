import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CodeBlockDetector } from '../../codeBlock/detector';
import { CodeBlockDecorator } from '../../codeBlock/decorator';
import { CodeExecutor } from '../../execution/executor';
import { BlockState } from '../../interfaces/blockState.interface';

suite('Integration Tests', () => {
    let outputChannel: vscode.OutputChannel;
    let diagnosticCollection: vscode.DiagnosticCollection;
    let detector: CodeBlockDetector;
    let decorator: CodeBlockDecorator;
    let executor: CodeExecutor;
    
    setup(() => {
        // Initialize components
        outputChannel = vscode.window.createOutputChannel('Test Output');
        diagnosticCollection = vscode.languages.createDiagnosticCollection('Test Diagnostics');
        detector = new CodeBlockDetector();
        decorator = new CodeBlockDecorator();
        executor = new CodeExecutor(outputChannel, diagnosticCollection);
    });
    
    teardown(() => {
        // Clean up
        outputChannel.dispose();
        diagnosticCollection.dispose();
        decorator.dispose();
    });
    
    test('End-to-end workflow with PHP code block', async () => {
        // Create a temporary markdown file with PHP code
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tinker-notebook-test-'));
        const tempFile = path.join(tempDir, 'test.md');
        const content = '# Test Markdown\n\n```php\necho "Hello, Integration Test!";\n```';
        fs.writeFileSync(tempFile, content);
        
        try {
            // Open the file in VS Code
            const document = await vscode.workspace.openTextDocument(tempFile);
            const editor = await vscode.window.showTextDocument(document);
            
            // Detect code blocks
            const codeBlocks = detector.findCodeBlocks(document);
            
            // Verify block was detected
            assert.strictEqual(codeBlocks.length, 1);
            assert.strictEqual(codeBlocks[0].language, 'php');
            assert.strictEqual(codeBlocks[0].content, 'echo "Hello, Integration Test!";\n');
            
            // Update decorations
            decorator.updateDecorations(editor, codeBlocks);
            
            // Execute the code block
            const result = await executor.executeCode(codeBlocks[0].content);
            
            // Verify execution result
            assert.strictEqual(result.exitCode, 0);
            assert.strictEqual(result.output.includes('Hello, Integration Test!'), true);
            
            // Show the result
            executor.showResult(result, document, codeBlocks[0].range);
            
            // Update block status and decorations
            decorator.setBlockState(codeBlocks[0].id, BlockState.Success);
            decorator.updateDecorations(editor, codeBlocks);
            
        } finally {
            // Clean up
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
            if (fs.existsSync(tempDir)) {
                fs.rmdirSync(tempDir);
            }
        }
    });
    
    test('End-to-end workflow with Tinker code block', async () => {
        // Create a temporary markdown file with Tinker code
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tinker-notebook-test-'));
        const tempFile = path.join(tempDir, 'test.md');
        const content = '# Test Markdown\n\n```tinker\n$greeting = "Hello, Tinker!";\necho $greeting;\n```';
        fs.writeFileSync(tempFile, content);
        
        try {
            // Open the file in VS Code
            const document = await vscode.workspace.openTextDocument(tempFile);
            const editor = await vscode.window.showTextDocument(document);
            
            // Detect code blocks
            const codeBlocks = detector.findCodeBlocks(document);
            
            // Verify block was detected
            assert.strictEqual(codeBlocks.length, 1);
            assert.strictEqual(codeBlocks[0].language, 'tinker');
            assert.strictEqual(codeBlocks[0].content, '$greeting = "Hello, Tinker!";\necho $greeting;\n');
            
            // Update decorations
            decorator.updateDecorations(editor, codeBlocks);
            
            // For Phase 1, Tinker blocks are executed as regular PHP code
            const result = await executor.executeCode(codeBlocks[0].content);
            
            // Verify execution result
            assert.strictEqual(result.exitCode, 0);
            assert.strictEqual(result.output.includes('Hello, Tinker!'), true);
            
            // Show the result
            executor.showResult(result, document, codeBlocks[0].range);
            
            // Update block status and decorations
            decorator.setBlockState(codeBlocks[0].id, BlockState.Success);
            decorator.updateDecorations(editor, codeBlocks);
            
        } finally {
            // Clean up
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
            if (fs.existsSync(tempDir)) {
                fs.rmdirSync(tempDir);
            }
        }
    });
});
