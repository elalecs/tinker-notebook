import { ExecutionResult } from '../../execution/executor';
import { FormattingOptions } from '../interfaces/outputFormatter.interface';
import { BaseFormatter } from './baseFormatter';

/**
 * Formatter for string outputs
 */
export class StringFormatter extends BaseFormatter {
    /**
     * Check if this formatter can handle the given output
     * @param output The output to check
     */
    public canFormat(output: string): boolean {
        // This is the fallback formatter, it can handle any output
        this.rawOutput = output;
        this.data = output;
        return true;
    }
    
    /**
     * Format the output for display in the output channel
     * @param result The execution result
     * @param options Formatting options
     */
    public format(result: ExecutionResult, options?: FormattingOptions): string {
        const rawOutput = this.rawOutput || result.output;
        
        // Format options
        const shouldHighlight = options?.highlightSyntax !== false;
        const shouldAddLineNumbers = options?.showLineNumbers === true;
        const shouldCollapse = options?.collapsible === true;
        
        // Start with the raw output
        let formatted = rawOutput;
        
        // If it's multiline and has more than 3 lines, we'll add line numbers
        const lines = formatted.split('\n');
        const isMultiline = lines.length > 1;
        
        // Detect code blocks in the output
        const isPhpCode = this.looksLikePHPCode(formatted);
        
        // Add syntax highlighting if it looks like code
        if (shouldHighlight && isPhpCode) {
            formatted = this.highlightSyntax(formatted);
        }
        
        // Add line numbers if requested or if it's a large multiline output
        if (shouldAddLineNumbers || (isMultiline && lines.length > 3)) {
            formatted = this.addLineNumbers(formatted);
        }
        
        // Create collapsible section if requested and it's a large output
        if (shouldCollapse && (formatted.length > 500 || lines.length > 10)) {
            formatted = this.createCollapsibleSection(
                isPhpCode ? 'PHP Code Output' : 'String Output', 
                formatted
            );
        }
        
        return formatted;
    }
    
    /**
     * Check if the string looks like PHP code
     * @param str The string to check
     */
    private looksLikePHPCode(str: string): boolean {
        // This is a simple heuristic to detect PHP code
        // A more accurate approach would use a proper tokenizer
        
        const phpKeywords = [
            'function', 'class', 'public', 'private', 'protected', 
            'if', 'else', 'elseif', 'for', 'foreach', 'while', 
            'return', 'new', 'echo', 'print', 'extends', 'implements'
        ];
        
        // Count how many PHP keywords are in the string
        let keywordCount = 0;
        phpKeywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = str.match(regex);
            if (matches) {
                keywordCount += matches.length;
            }
        });
        
        // Check for special PHP syntax
        const hasBraces = str.includes('{') && str.includes('}');
        const hasSemicolons = str.includes(';');
        const hasArrows = str.includes('->') || str.includes('=>');
        
        // If it has several PHP keywords and PHP syntax, it probably is PHP code
        return (keywordCount > 2 || str.includes('<?php')) && 
               (hasBraces || hasSemicolons || hasArrows);
    }
}