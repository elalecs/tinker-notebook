import * as vscode from 'vscode';

/**
 * Represents a code block found in a markdown document
 */
export interface CodeBlock {
    id: string;
    language: string;
    type: string;  // 'php' or 'tinker'
    content: string;
    range: vscode.Range;
    startLine: number;
    endLine: number;
}

/**
 * Detects PHP and Tinker code blocks in markdown documents
 */
export class CodeBlockDetector {
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
        
        // Regular expression to match ```php or ```tinker code blocks
        const codeBlockRegex = /```(php|tinker)\s*\n([\s\S]*?)```/g;
        
        let match;
        while ((match = codeBlockRegex.exec(text)) !== null) {
            const language = match[1];
            const content = match[2];
            
            // Calculate the range of the code block
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);
            
            // Calculate the range of just the code content (excluding the backticks and language identifier)
            const contentStartPos = document.positionAt(match.index + match[0].indexOf(content));
            const contentEndPos = document.positionAt(match.index + match[0].indexOf(content) + content.length);
            const contentRange = new vscode.Range(contentStartPos, contentEndPos);
            
            blocks.push({
                id: `block-${blocks.length}-${Date.now()}`,
                language,
                type: language,  // Use the language as the type ('php' or 'tinker')
                content,
                range,
                startLine: contentStartPos.line,
                endLine: contentEndPos.line
            });
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
}
