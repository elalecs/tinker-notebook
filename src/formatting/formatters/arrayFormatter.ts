import { ExecutionResult } from '../../execution/executor';
import { FormattingOptions } from '../interfaces/outputFormatter.interface';
import { BaseFormatter } from './baseFormatter';

/**
 * Formatter for array outputs (including PHP arrays)
 */
export class ArrayFormatter extends BaseFormatter {
    private arrayRegex = /^array\s*\((.*)\)$/s;
    
    /**
     * Check if this formatter can handle the given output
     * @param output The output to check
     */
    public canFormat(output: string): boolean {
        const trimmedOutput = output.trim();
        
        // Check if it's a PHP array
        if (trimmedOutput.startsWith('array(') && trimmedOutput.endsWith(')')) {
            this.rawOutput = trimmedOutput;
            return true;
        }
        
        // Check if it's a JSON array but not a valid JSON
        if (trimmedOutput.startsWith('[') && trimmedOutput.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmedOutput);
                if (Array.isArray(parsed)) {
                    // Don't handle valid JSON arrays here, the JSON formatter will handle them
                    return false;
                }
            } catch (e) {
                // If it's not valid JSON but looks like an array, we'll handle it
                this.rawOutput = trimmedOutput;
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Format the output for display in the output channel
     * @param result The execution result
     * @param options Formatting options
     */
    public format(result: ExecutionResult, options?: FormattingOptions): string {
        const rawOutput = this.rawOutput || result.output.trim();
        
        // Format options
        const maxDepth = options?.maxDepth || 3;
        const shouldHighlight = options?.highlightSyntax !== false;
        const shouldAddLineNumbers = options?.showLineNumbers === true;
        const shouldCollapse = options?.collapsible === true;
        
        try {
            // Parse the PHP array and convert to JavaScript array for formatting
            let jsArray: any[] = [];
            
            // Try to extract data from PHP array format
            const match = rawOutput.match(this.arrayRegex);
            if (match) {
                // This is a simplified parsing of PHP arrays
                // For a complete solution, a proper parser would be needed
                jsArray = this.parsePhpArray(match[1]);
                this.data = jsArray;
            } else {
                // This might be a malformed JSON array
                // We'll just display it as a string with nice formatting
                this.data = rawOutput;
            }
            
            // Format the array with proper indentation
            let formatted = '';
            
            if (Array.isArray(jsArray)) {
                formatted = this.formatObject(jsArray, 0, maxDepth);
            } else {
                // If we couldn't parse it as an array, format it as a string
                formatted = rawOutput;
            }
            
            // Add syntax highlighting
            if (shouldHighlight) {
                formatted = this.highlightSyntax(formatted);
            }
            
            // Add line numbers if requested
            if (shouldAddLineNumbers) {
                formatted = this.addLineNumbers(formatted);
            }
            
            // Create collapsible section if requested
            if (shouldCollapse) {
                formatted = this.createCollapsibleSection('Array Output', formatted);
            }
            
            return formatted;
            
        } catch (error) {
            // Return the raw output if parsing fails
            return `Failed to parse array: ${error instanceof Error ? error.message : String(error)}\n\n${rawOutput}`;
        }
    }
    
    /**
     * Simple parser for PHP array syntax
     * @param arrayContent The content of the array
     * @returns An array of values
     */
    private parsePhpArray(arrayContent: string): any[] {
        // This is a simplified parser for PHP arrays
        // For a more complete solution, a proper tokenizer would be needed
        
        const result: any[] = [];
        const pairs = arrayContent.split(',');
        
        for (const pair of pairs) {
            const trimmedPair = pair.trim();
            if (!trimmedPair) {
                continue;
            }
            
            // Check if it's a key => value pair
            const keyValueMatch = trimmedPair.match(/^(.*?)=>(.*?)$/);
            
            if (keyValueMatch) {
                const key = keyValueMatch[1].trim();
                const value = keyValueMatch[2].trim();
                result.push({ [key]: this.parsePhpValue(value) });
            } else {
                // It's just a value
                result.push(this.parsePhpValue(trimmedPair));
            }
        }
        
        return result;
    }
    
    /**
     * Parse a PHP value (string, number, bool, null, array, object)
     * @param value The PHP value string
     * @returns The JavaScript equivalent
     */
    private parsePhpValue(value: string): any {
        // String
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.slice(1, -1);
        }
        if (value.startsWith("'") && value.endsWith("'")) {
            return value.slice(1, -1);
        }
        
        // Number
        if (/^-?\d+(\.\d+)?$/.test(value)) {
            return parseFloat(value);
        }
        
        // Boolean
        if (value === 'true') {
            return true;
        }
        if (value === 'false') {
            return false;
        }
        
        // Null
        if (value === 'null' || value === 'NULL') {
            return null;
        }
        
        // Array
        if (value.startsWith('array(') && value.endsWith(')')) {
            const match = value.match(this.arrayRegex);
            if (match) {
                return this.parsePhpArray(match[1]);
            }
        }
        
        // If we can't determine the type, return as string
        return value;
    }
}