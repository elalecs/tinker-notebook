import * as crypto from 'crypto';
import { CodeBlock } from './detector';

/**
 * Handles generation and management of code block identifiers
 */
export class BlockIdGenerator {
    private usedIds: Set<string> = new Set();
    
    constructor() {}
    
    /**
     * Parses a custom ID from the code block syntax (e.g., ```php:myid)
     * @param markdown The markdown text with the code block
     * @param codeBlock The code block to parse ID from
     * @returns The parsed ID or undefined if none found
     */
    public parseCustomId(markdown: string, codeBlock: CodeBlock): string | undefined {
        // Check if the code block has a custom ID
        const blockStartIndex = markdown.indexOf('```' + codeBlock.language, codeBlock.range.start.character);
        if (blockStartIndex === -1) {
            return undefined;
        }
        
        // Look for the pattern ```language:id
        const blockStartLine = markdown.substring(blockStartIndex, markdown.indexOf('\n', blockStartIndex));
        const idMatch = blockStartLine.match(/```(?:php|tinker):([a-zA-Z0-9_-]+)/);
        
        if (idMatch && idMatch[1]) {
            return idMatch[1];
        }
        
        return undefined;
    }
    
    /**
     * Generates a unique ID for a code block
     * @param codeBlock The code block to generate ID for
     * @param customId Optional custom ID to use
     * @returns A unique ID for the code block
     */
    public generateId(codeBlock: CodeBlock, customId?: string): string {
        // If a custom ID is provided and not already used, use it
        if (customId && !this.usedIds.has(customId)) {
            this.usedIds.add(customId);
            return customId;
        }
        
        // Otherwise, generate a short hash based on content and position
        const contentDigest = crypto
            .createHash('md5')
            .update(codeBlock.content + codeBlock.startLine.toString())
            .digest('hex')
            .substring(0, 8);
        
        const autoId = `${codeBlock.language}-${contentDigest}`;
        
        // Ensure ID is unique by adding a counter if needed
        let uniqueId = autoId;
        let counter = 1;
        while (this.usedIds.has(uniqueId)) {
            uniqueId = `${autoId}-${counter}`;
            counter++;
        }
        
        this.usedIds.add(uniqueId);
        return uniqueId;
    }
    
    /**
     * Checks if an ID is already used
     * @param id The ID to check
     * @returns True if the ID is already used
     */
    public isIdUsed(id: string): boolean {
        return this.usedIds.has(id);
    }
    
    /**
     * Clears all used IDs
     */
    public clearUsedIds(): void {
        this.usedIds.clear();
    }
    
    /**
     * Registers an ID as used
     * @param id The ID to register
     */
    public registerUsedId(id: string): void {
        this.usedIds.add(id);
    }
}