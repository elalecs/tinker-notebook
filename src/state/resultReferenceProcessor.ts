import { IBlockStateManager } from '../interfaces/blockState.interface';
import { ExecutionResult } from '../execution/executor';

/**
 * Processes code blocks and resolves references to previous block results
 */
export class ResultReferenceProcessor {
    private referenceRegex = /\$tinker_outputs\.([\w-]+)/g;
    
    constructor(private stateManager: IBlockStateManager) {}
    
    /**
     * Process a code block content and resolve references to previous results
     * @param content The content to process
     * @returns The processed content with references resolved
     */
    public processContent(content: string): string {
        // Replace all references with their values
        return content.replace(this.referenceRegex, (match, blockId) => {
            // Get the result for the referenced block
            const result = this.stateManager.getResult(blockId);
            if (!result) {
                // If no result is found, leave the reference unchanged
                return match;
            }
            
            // Return the output as a PHP variable
            const outputValue = this.formatOutput(result);
            return outputValue;
        });
    }
    
    /**
     * Format an execution result for inclusion in code
     * @param result The execution result to format
     * @returns The formatted output
     */
    private formatOutput(result: ExecutionResult): string {
        if (result.error) {
            // If there was an error, return null
            return 'null';
        }
        
        // Clean the output for use in PHP code
        const output = result.output.trim();
        
        // Try to determine if the output is a valid PHP value
        if (output === '') {
            return 'null';
        }
        
        // Check if it's a numeric value
        if (/^-?\d+(\.\d+)?$/.test(output)) {
            return output;
        }
        
        // For booleans
        if (output.toLowerCase() === 'true') {
            return 'true';
        }
        if (output.toLowerCase() === 'false') {
            return 'false';
        }
        
        // For arrays or objects (assuming they're in var_dump or print_r format)
        if (output.includes('=>') || (output.startsWith('array') && output.includes('(')) || output.includes('stdClass')) {
            // This will require PHP variable extraction, difficult to handle in a general way
            // Return a placeholder that may need manual adjustment
            return `'${output.replace(/'/g, "\\'")}'`;
        }
        
        // Otherwise, assume it's a string
        return `'${output.replace(/'/g, "\\'")}'`;
    }
    
    /**
     * Detect references to block outputs in code content
     * @param content The content to check
     * @returns Array of block IDs that are referenced
     */
    public detectReferences(content: string): string[] {
        const references: string[] = [];
        let match;
        
        // Reset regex state
        this.referenceRegex.lastIndex = 0;
        
        // Find all references
        while ((match = this.referenceRegex.exec(content)) !== null) {
            const blockId = match[1];
            if (!references.includes(blockId)) {
                references.push(blockId);
            }
        }
        
        return references;
    }
    
    /**
     * Check if a code block has circular references
     * @param blockId The ID of the block to check
     * @param content The content of the block
     * @returns True if circular references are detected
     */
    public hasCircularReferences(blockId: string, content: string): boolean {
        // Get references in this block
        const references = this.detectReferences(content);
        
        // Check for direct self-reference
        if (references.includes(blockId)) {
            return true;
        }
        
        // Check for indirect circular references
        const visitedBlocks = new Set<string>();
        return this.checkCircular(blockId, references, visitedBlocks);
    }
    
    /**
     * Recursive helper to check for circular references
     * @param originalBlockId The ID of the original block
     * @param referencedBlockIds The IDs of blocks referenced
     * @param visitedBlocks Set of already visited blocks
     * @returns True if circular references are detected
     */
    private checkCircular(originalBlockId: string, referencedBlockIds: string[], visitedBlocks: Set<string>): boolean {
        for (const refId of referencedBlockIds) {
            // Skip if already visited to prevent infinite recursion
            if (visitedBlocks.has(refId)) {
                continue;
            }
            
            // Mark as visited
            visitedBlocks.add(refId);
            
            // Check if this reference points back to the original block
            if (refId === originalBlockId) {
                return true;
            }
            
            // Check if any other blocks referenced by this block have circular references
            const state = this.stateManager.getBlockState(refId);
            if (state && state.lastResult) {
                const refContent = state.lastResult.output || '';
                const nestedRefs = this.detectReferences(refContent);
                if (nestedRefs.length > 0 && this.checkCircular(originalBlockId, nestedRefs, visitedBlocks)) {
                    return true;
                }
            }
        }
        
        return false;
    }
}