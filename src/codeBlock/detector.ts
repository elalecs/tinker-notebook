import * as vscode from 'vscode';
import { BlockIdGenerator } from './idGenerator';

/**
 * Represents a code block found in a markdown document
 */
export interface CodeBlock {
    id: string;               // Unique identifier for the block
    language: string;         // 'php' or 'tinker'
    type: string;             // 'php' or 'tinker'
    content: string;          // The code content
    range: vscode.Range;      // The range of the entire block (including backticks)
    contentRange?: vscode.Range; // The range of just the code content
    startLine: number;        // Start line of the code content
    endLine: number;          // End line of the code content
    customId?: string;        // Optional custom ID from syntax like ```php:id
}

/**
 * Detects PHP and Tinker code blocks in markdown documents
 */
export class CodeBlockDetector {
    private idGenerator: BlockIdGenerator;
    
    constructor() {
        this.idGenerator = new BlockIdGenerator();
    }
    
    /**
     * Find all PHP and Tinker code blocks in a document
     * @param document The document to search
     * @returns Array of code blocks
     */
    public findCodeBlocks(document: vscode.TextDocument): CodeBlock[] {
        // Only process markdown files
        if (document.languageId !== 'markdown') {
            return [];
        }

        const text = document.getText();
        const blocks: CodeBlock[] = [];
        
        // Reset ID generator for a new document
        this.idGenerator.clearUsedIds();
        
        // Regular expression to match ```php or ```tinker code blocks with optional :id suffix
        const codeBlockRegex = /```(php|tinker)(?::([a-zA-Z0-9_-]+))?\s*\n([\s\S]*?)```/g;
        
        let match;
        while ((match = codeBlockRegex.exec(text)) !== null) {
            const language = match[1];
            const customId = match[2]; // This may be undefined
            const content = match[3];
            
            // Calculate the range of the code block
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);
            
            // Calculate the range of just the code content (excluding the backticks and language identifier)
            const contentStartPos = document.positionAt(match.index + match[0].indexOf(content));
            const contentEndPos = document.positionAt(match.index + match[0].indexOf(content) + content.length);
            const contentRange = new vscode.Range(contentStartPos, contentEndPos);
            
            // Create the block with a generated or custom ID
            const block: CodeBlock = {
                id: '', // Temporary, will be set below
                language,
                type: language,  // Use the language as the type ('php' or 'tinker')
                content,
                range,
                contentRange,
                startLine: contentStartPos.line,
                endLine: contentEndPos.line
            };
            
            // Set custom ID if provided
            if (customId) {
                block.customId = customId;
            }
            
            // Generate a unique ID for the block
            block.id = this.idGenerator.generateId(block, customId);
            
            blocks.push(block);
        }
        
        return blocks;
    }
    
    /**
     * Find the code block at a specific position in the document
     * @param document The document to search
     * @param position The position to check
     * @returns The code block at the position, or undefined if none
     */
    public findCodeBlockAtPosition(document: vscode.TextDocument, position: vscode.Position): CodeBlock | undefined {
        const blocks = this.findCodeBlocks(document);
        return blocks.find(block => block.range.contains(position));
    }
    
    /**
     * Find a code block by its ID
     * @param document The document to search
     * @param id The ID to look for
     * @returns The code block with the given ID, or undefined if none
     */
    public findCodeBlockById(document: vscode.TextDocument, id: string): CodeBlock | undefined {
        const blocks = this.findCodeBlocks(document);
        return blocks.find(block => block.id === id || block.customId === id);
    }
}
