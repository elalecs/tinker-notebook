import * as vscode from 'vscode';
import { CodeBlock } from './detector';
import { BlockState, IBlockStateManager } from '../interfaces/blockState.interface';

/**
 * CodeLens provider for code blocks in markdown documents
 */
export class CodeBlockCodeLensProvider implements vscode.CodeLensProvider {
    private stateManager?: IBlockStateManager;
    private detector: any; // Will be set in constructor
    
    constructor(detector: any, stateManager?: IBlockStateManager) {
        this.detector = detector;
        this.stateManager = stateManager;
    }
    
    /**
     * Provide CodeLenses for the given document
     * @param document The document to provide CodeLenses for
     * @param token A cancellation token
     * @returns An array or promise of CodeLenses
     */
    public provideCodeLenses(
        document: vscode.TextDocument, 
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CodeLens[]> {
        // Only process markdown files
        if (document.languageId !== 'markdown') {
            return [];
        }
        
        // Find code blocks in the document
        const codeBlocks = this.detector.findCodeBlocks(document);
        const codeLenses: vscode.CodeLens[] = [];
        
        // Create CodeLens for each code block
        for (const block of codeBlocks) {
            // Create a range for the CodeLens at the start of the code block
            const codeLensRange = new vscode.Range(block.range.start, block.range.start);
            
            // Create the Run CodeLens with the block ID as an argument
            const runCodeLens = new vscode.CodeLens(codeLensRange, {
                title: this.getCommandTitle(block.id),
                command: 'tinker-notebook.executeFromCodeLens',
                arguments: [block.id]
            });
            
            codeLenses.push(runCodeLens);
        }
        
        return codeLenses;
    }
    
    /**
     * Get the command title based on block state
     * @param blockId The ID of the block
     * @returns The command title
     */
    private getCommandTitle(blockId: string): string {
        const state = this.getBlockState(blockId);
        
        switch (state) {
            case BlockState.Executing:
                return '⏹️ Executing...';
            case BlockState.Success:
                return '🟢 Run Code';
            case BlockState.Error:
                return '❌ Run Code';
            default:
                return '▶️ Run Code';
        }
    }
    
    /**
     * Get the block state from the state manager
     * @param blockId The ID of the block
     * @returns The block state
     */
    private getBlockState(blockId: string): BlockState {
        if (this.stateManager) {
            const stateEntry = this.stateManager.getBlockState(blockId);
            if (stateEntry) {
                return stateEntry.state;
            }
        }
        
        return BlockState.NotExecuted;
    }
}