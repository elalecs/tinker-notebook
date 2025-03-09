import * as vscode from 'vscode';
import { CodeBlock } from './detector';
import { BlockState, BlockStateEntry, IBlockStateManager } from '../interfaces/blockState.interface';

/**
 * Manages decorations for code blocks in the editor
 */
export class CodeBlockDecorator {
    private notExecutedDecorationType: vscode.TextEditorDecorationType;
    private executingDecorationType: vscode.TextEditorDecorationType;
    private successDecorationType: vscode.TextEditorDecorationType;
    private errorDecorationType: vscode.TextEditorDecorationType;
    
    // Maps to track block status
    private blockStatusMap: Map<string, BlockState> = new Map();
    
    constructor(private stateManager?: IBlockStateManager) {
        // Create decoration type for "Not Executed" state with run button
        this.notExecutedDecorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: '▶️ Run Code',
                backgroundColor: new vscode.ThemeColor('button.background'),
                color: new vscode.ThemeColor('button.foreground'),
                margin: '0 0 0 10px',
                width: 'max-content',
                height: '22px'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
        
        // Create decoration type for executing status with stop button
        this.executingDecorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: '⏹️ Executing...',
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
                contentText: '🟢 Success',
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
                contentText: '❌ Error',
                backgroundColor: new vscode.ThemeColor('statusBarItem.errorBackground'),
                color: new vscode.ThemeColor('statusBarItem.errorForeground'),
                margin: '0 0 0 10px',
                width: 'max-content',
                height: '22px'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
        
        // If a state manager is provided, load block states from it
        if (this.stateManager) {
            const states = this.stateManager.getAllStates();
            states.forEach((stateEntry, blockId) => {
                this.blockStatusMap.set(blockId, stateEntry.state);
            });
        }
    }
    
    /**
     * Update decorations for code blocks in the editor
     * @param editor The text editor to update
     * @param codeBlocks The code blocks to decorate
     */
    public updateDecorations(editor: vscode.TextEditor, codeBlocks: CodeBlock[]): void {
        const notExecutedDecorations: vscode.DecorationOptions[] = [];
        const executingDecorations: vscode.DecorationOptions[] = [];
        const successDecorations: vscode.DecorationOptions[] = [];
        const errorDecorations: vscode.DecorationOptions[] = [];
        
        for (const block of codeBlocks) {
            const state = this.getBlockState(block.id);
            const decorationRange = new vscode.Range(block.range.start, block.range.start);
            
            // Build hover message
            let lastExecutionInfo = '';
            if (this.stateManager) {
                const stateEntry = this.stateManager.getBlockState(block.id);
                if (stateEntry?.lastExecutionTime) {
                    lastExecutionInfo = `\n**Last executed**: ${stateEntry.lastExecutionTime.toLocaleString()}`;
                    
                    if (stateEntry.lastResult) {
                        const executionTimeMs = stateEntry.lastResult.executionTime;
                        if (executionTimeMs !== undefined) {
                            lastExecutionInfo += `\n**Execution time**: ${executionTimeMs}ms`;
                        }
                    }
                }
            }
            
            // Create the decoration with appropriate hover details
            const decoration: vscode.DecorationOptions = {
                range: decorationRange,
                hoverMessage: new vscode.MarkdownString(
                    `**Language**: ${block.language}\n` +
                    `**ID**: ${block.customId || block.id}\n` +
                    `**Status**: ${state}${lastExecutionInfo}\n\n` +
                    `Click to execute this code block`
                )
            };
            
            // Enable trusted content in hover message if applicable
            if (decoration.hoverMessage instanceof vscode.MarkdownString) {
                decoration.hoverMessage.isTrusted = true;
            }
            
            // Add to appropriate decoration array based on state
            switch (state) {
                case BlockState.Executing:
                    executingDecorations.push(decoration);
                    break;
                case BlockState.Success:
                    successDecorations.push(decoration);
                    break;
                case BlockState.Error:
                    errorDecorations.push(decoration);
                    break;
                default:
                    notExecutedDecorations.push(decoration);
                    break;
            }
        }
        
        // Apply decorations
        editor.setDecorations(this.notExecutedDecorationType, notExecutedDecorations);
        editor.setDecorations(this.executingDecorationType, executingDecorations);
        editor.setDecorations(this.successDecorationType, successDecorations);
        editor.setDecorations(this.errorDecorationType, errorDecorations);
    }
    
    /**
     * Get the state of a code block
     * @param blockId The ID of the code block
     * @returns The state of the block
     */
    public getBlockState(blockId: string): BlockState {
        // First check the local map
        if (this.blockStatusMap.has(blockId)) {
            return this.blockStatusMap.get(blockId)!;
        }
        
        // Then check the state manager if available
        if (this.stateManager) {
            const stateEntry = this.stateManager.getBlockState(blockId);
            if (stateEntry) {
                return stateEntry.state;
            }
        }
        
        // Default to not executed
        return BlockState.NotExecuted;
    }
    
    /**
     * Set the state of a code block
     * @param blockId The ID of the code block
     * @param state The new state
     * @param result Optional execution result
     */
    public setBlockState(blockId: string, state: BlockState, result?: any): void {
        this.blockStatusMap.set(blockId, state);
        
        // Update state manager if available
        if (this.stateManager) {
            this.stateManager.setBlockState(blockId, state, result);
        }
    }
    
    /**
     * Reset the state of all code blocks to 'not executed'
     */
    public resetAllBlockStates(): void {
        this.blockStatusMap.clear();
    }
    
    /**
     * Dispose of all decoration types
     */
    public dispose(): void {
        this.notExecutedDecorationType.dispose();
        this.executingDecorationType.dispose();
        this.successDecorationType.dispose();
        this.errorDecorationType.dispose();
    }
}
