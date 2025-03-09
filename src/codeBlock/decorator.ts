import * as vscode from 'vscode';
import { CodeBlock } from './detector';

/**
 * Manages decorations for code blocks in the editor
 */
export class CodeBlockDecorator {
    private runCodeDecorationType: vscode.TextEditorDecorationType;
    private executingDecorationType: vscode.TextEditorDecorationType;
    private successDecorationType: vscode.TextEditorDecorationType;
    private errorDecorationType: vscode.TextEditorDecorationType;
    
    // Maps to track block status
    private blockStatusMap: Map<string, 'ready' | 'executing' | 'success' | 'error'> = new Map();
    
    constructor() {
        // Create decoration type for "Run Code" button
        this.runCodeDecorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: 'Run Code',
                backgroundColor: new vscode.ThemeColor('button.background'),
                color: new vscode.ThemeColor('button.foreground'),
                margin: '0 0 0 10px',
                width: 'max-content',
                height: '22px'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
        
        // Create decoration type for executing status
        this.executingDecorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: 'Executing...',
                backgroundColor: new vscode.ThemeColor('statusBarItem.warningBackground'),
                color: new vscode.ThemeColor('statusBarItem.warningForeground'),
                margin: '0 0 0 10px',
                width: 'max-content',
                height: '22px'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
        
        // Create decoration type for success status
        this.successDecorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: '✓ Success',
                backgroundColor: new vscode.ThemeColor('statusBarItem.remoteBackground'),
                color: new vscode.ThemeColor('statusBarItem.remoteForeground'),
                margin: '0 0 0 10px',
                width: 'max-content',
                height: '22px'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
        
        // Create decoration type for error status
        this.errorDecorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: '✗ Error',
                backgroundColor: new vscode.ThemeColor('statusBarItem.errorBackground'),
                color: new vscode.ThemeColor('statusBarItem.errorForeground'),
                margin: '0 0 0 10px',
                width: 'max-content',
                height: '22px'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
    }
    
    /**
     * Update decorations for code blocks in the editor
     * @param editor The text editor to update
     * @param codeBlocks The code blocks to decorate
     */
    public updateDecorations(editor: vscode.TextEditor, codeBlocks: CodeBlock[]): void {
        const readyDecorations: vscode.DecorationOptions[] = [];
        const executingDecorations: vscode.DecorationOptions[] = [];
        const successDecorations: vscode.DecorationOptions[] = [];
        const errorDecorations: vscode.DecorationOptions[] = [];
        
        for (const block of codeBlocks) {
            const status = this.blockStatusMap.get(block.id) || 'ready';
            const decorationRange = new vscode.Range(block.range.start, block.range.start);
            
            const decoration: vscode.DecorationOptions = {
                range: decorationRange,
                hoverMessage: new vscode.MarkdownString(
                    `**Language**: ${block.language}\n` +
                    `**Status**: ${status}\n\n` +
                    `Click to execute this code block`
                )
            };
            
            switch (status) {
                case 'executing':
                    executingDecorations.push(decoration);
                    break;
                case 'success':
                    successDecorations.push(decoration);
                    break;
                case 'error':
                    errorDecorations.push(decoration);
                    break;
                default:
                    readyDecorations.push(decoration);
                    break;
            }
        }
        
        editor.setDecorations(this.runCodeDecorationType, readyDecorations);
        editor.setDecorations(this.executingDecorationType, executingDecorations);
        editor.setDecorations(this.successDecorationType, successDecorations);
        editor.setDecorations(this.errorDecorationType, errorDecorations);
    }
    
    /**
     * Set the status of a code block
     * @param blockId The ID of the code block
     * @param status The new status
     */
    public setBlockStatus(blockId: string, status: 'ready' | 'executing' | 'success' | 'error'): void {
        this.blockStatusMap.set(blockId, status);
    }
    
    /**
     * Reset the status of all code blocks to 'ready'
     */
    public resetAllBlockStatus(): void {
        this.blockStatusMap.clear();
    }
    
    /**
     * Dispose of all decoration types
     */
    public dispose(): void {
        this.runCodeDecorationType.dispose();
        this.executingDecorationType.dispose();
        this.successDecorationType.dispose();
        this.errorDecorationType.dispose();
    }
}
