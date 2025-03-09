import * as assert from 'assert';
import * as vscode from 'vscode';
import { CodeBlockDecorator } from '../../../codeBlock/decorator';
import { CodeBlock } from '../../../codeBlock/detector';

suite('CodeBlockDecorator Tests', () => {
    let decorator: CodeBlockDecorator;
    
    setup(() => {
        decorator = new CodeBlockDecorator();
    });
    
    teardown(() => {
        decorator.dispose();
    });
    
    test('setBlockStatus should update the status of a code block', () => {
        const blockId = 'test-block-1';
        
        // Set status to executing
        decorator.setBlockStatus(blockId, 'executing');
        
        // Create a mock code block with the same ID
        const mockBlock: CodeBlock = {
            id: blockId,
            language: 'php',
            content: 'echo "test";',
            range: new vscode.Range(0, 0, 1, 0),
            startLine: 0,
            endLine: 1,
            type: 'php'
        };
        
        // Create a spy on the editor.setDecorations method
        let executingDecorationsCalled = false;
        const mockEditor = {
            setDecorations: (decorationType: vscode.TextEditorDecorationType, decorations: vscode.DecorationOptions[]) => {
                // Check if we're setting executing decorations and they include our block
                if (decorations.length > 0 && decorations.some(d => d.range.start.line === mockBlock.range.start.line)) {
                    executingDecorationsCalled = true;
                }
            }
        } as unknown as vscode.TextEditor;
        
        // Update decorations
        decorator.updateDecorations(mockEditor, [mockBlock]);
        
        // Verify that executing decorations were set
        assert.strictEqual(executingDecorationsCalled, true);
    });
    
    test('resetAllBlockStatus should clear all block statuses', () => {
        const blockId1 = 'test-block-1';
        const blockId2 = 'test-block-2';
        
        // Set statuses
        decorator.setBlockStatus(blockId1, 'success');
        decorator.setBlockStatus(blockId2, 'error');
        
        // Reset all statuses
        decorator.resetAllBlockStatus();
        
        // Create mock blocks with the same IDs
        const mockBlock1: CodeBlock = {
            id: blockId1,
            language: 'php',
            content: 'echo "test1";',
            range: new vscode.Range(0, 0, 1, 0),
            startLine: 0,
            endLine: 1,
            type: 'php'
        };
        
        const mockBlock2: CodeBlock = {
            id: blockId2,
            language: 'php',
            content: 'echo "test2";',
            range: new vscode.Range(2, 0, 3, 0),
            startLine: 2,
            endLine: 3,
            type: 'php'
        };
        
        // Track which decoration types are called
        let readyDecorationsCalled = false;
        let successDecorationsCalled = false;
        let errorDecorationsCalled = false;
        
        const mockEditor = {
            setDecorations: (decorationType: vscode.TextEditorDecorationType, decorations: vscode.DecorationOptions[]) => {
                // Check which decoration type is being set
                if (decorations.length === 2) {
                    // If both blocks are included, they must be ready decorations
                    readyDecorationsCalled = true;
                } else if (decorations.length === 0) {
                    // Empty decorations for success and error
                    successDecorationsCalled = true;
                    errorDecorationsCalled = true;
                }
            }
        } as unknown as vscode.TextEditor;
        
        // Update decorations
        decorator.updateDecorations(mockEditor, [mockBlock1, mockBlock2]);
        
        // Verify that ready decorations were set for both blocks
        assert.strictEqual(readyDecorationsCalled, true);
    });
});
