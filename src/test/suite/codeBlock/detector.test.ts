import * as assert from 'assert';
import * as vscode from 'vscode';
import { CodeBlockDetector } from '../../../codeBlock/detector';

suite('CodeBlockDetector Tests', () => {
    let detector: CodeBlockDetector;
    
    setup(() => {
        detector = new CodeBlockDetector();
    });
    
    test('findCodeBlocks should return empty array for non-markdown documents', async () => {
        // Create a mock document with JavaScript content
        const content = 'const test = "This is not markdown";';
        const uri = vscode.Uri.parse('untitled:test.js');
        const document = await vscode.workspace.openTextDocument({ language: 'javascript', content });
        
        const blocks = detector.findCodeBlocks(document);
        assert.strictEqual(blocks.length, 0);
    });
    
    test('findCodeBlocks should detect PHP code blocks in markdown', async () => {
        // Create a markdown document with a PHP code block
        const content = '# Test Markdown\n\n```php\necho "Hello, World!";\n```';
        const uri = vscode.Uri.parse('untitled:test.md');
        const document = await vscode.workspace.openTextDocument({ language: 'markdown', content });
        
        const blocks = detector.findCodeBlocks(document);
        assert.strictEqual(blocks.length, 1);
        assert.strictEqual(blocks[0].language, 'php');
        assert.strictEqual(blocks[0].content, 'echo "Hello, World!";\n');
    });
    
    test('findCodeBlocks should detect Tinker code blocks in markdown', async () => {
        // Create a markdown document with a Tinker code block
        const content = '# Test Markdown\n\n```tinker\n$users = User::all();\n```';
        const uri = vscode.Uri.parse('untitled:test.md');
        const document = await vscode.workspace.openTextDocument({ language: 'markdown', content });
        
        const blocks = detector.findCodeBlocks(document);
        assert.strictEqual(blocks.length, 1);
        assert.strictEqual(blocks[0].language, 'tinker');
        assert.strictEqual(blocks[0].content, '$users = User::all();\n');
    });
    
    test('findCodeBlocks should detect multiple code blocks in markdown', async () => {
        // Create a markdown document with multiple code blocks
        const content = '# Test Markdown\n\n```php\necho "PHP block";\n```\n\nSome text\n\n```tinker\n$users = User::all();\n```';
        const uri = vscode.Uri.parse('untitled:test.md');
        const document = await vscode.workspace.openTextDocument({ language: 'markdown', content });
        
        const blocks = detector.findCodeBlocks(document);
        assert.strictEqual(blocks.length, 2);
        assert.strictEqual(blocks[0].language, 'php');
        assert.strictEqual(blocks[1].language, 'tinker');
    });
    
    test('findCodeBlockAtPosition should return the correct block', async () => {
        // Create a markdown document with multiple code blocks
        const content = '# Test Markdown\n\n```php\necho "PHP block";\n```\n\nSome text\n\n```tinker\n$users = User::all();\n```';
        const uri = vscode.Uri.parse('untitled:test.md');
        const document = await vscode.workspace.openTextDocument({ language: 'markdown', content });
        
        // Position inside the PHP block
        const phpPosition = new vscode.Position(3, 5);
        const phpBlock = detector.findCodeBlockAtPosition(document, phpPosition);
        assert.ok(phpBlock);
        assert.strictEqual(phpBlock?.language, 'php');
        
        // Position inside the Tinker block
        const tinkerPosition = new vscode.Position(9, 5);
        const tinkerBlock = detector.findCodeBlockAtPosition(document, tinkerPosition);
        assert.ok(tinkerBlock);
        assert.strictEqual(tinkerBlock?.language, 'tinker');
        
        // Position outside any block
        const outsidePosition = new vscode.Position(6, 5);
        const outsideBlock = detector.findCodeBlockAtPosition(document, outsidePosition);
        assert.strictEqual(outsideBlock, undefined);
    });
});
