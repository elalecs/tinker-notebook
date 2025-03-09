import { IOutputFormatter, FormattingOptions } from '../interfaces/outputFormatter.interface';
import { ExecutionResult } from '../../execution/executor';

/**
 * Base class for output formatters
 */
export abstract class BaseFormatter implements IOutputFormatter {
    protected data: any;
    protected rawOutput: string = '';
    
    /**
     * Check if this formatter can handle the given output
     * @param output The output to check
     */
    public abstract canFormat(output: string): boolean;
    
    /**
     * Format the output for display in the output channel
     * @param result The execution result
     * @param options Formatting options
     */
    public abstract format(result: ExecutionResult, options?: FormattingOptions): string;
    
    /**
     * Get the original output data in a structured format if possible
     */
    public getData(): any {
        return this.data;
    }
    
    /**
     * Create a collapsible section
     * @param title Section title
     * @param content Section content
     */
    protected createCollapsibleSection(title: string, content: string): string {
        return `▼ ${title}\n${content}\n▲ End of ${title}`;
    }
    
    /**
     * Format an object with proper indentation
     * @param obj The object to format
     * @param indent The current indentation level
     * @param maxDepth Maximum depth to traverse
     * @param currDepth Current depth
     */
    protected formatObject(obj: any, indent: number = 0, maxDepth: number = 3, currDepth: number = 0): string {
        if (currDepth > maxDepth) {
            return ' '.repeat(indent) + '...';
        }
        
        if (obj === null) {
            return ' '.repeat(indent) + 'null';
        }
        
        if (typeof obj !== 'object') {
            if (typeof obj === 'string') {
                return ' '.repeat(indent) + `"${obj}"`;
            }
            return ' '.repeat(indent) + String(obj);
        }
        
        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return ' '.repeat(indent) + '[]';
            }
            
            let result = ' '.repeat(indent) + '[\n';
            
            for (let i = 0; i < obj.length; i++) {
                result += ' '.repeat(indent + 2) + i + ': ' + 
                    this.formatObject(obj[i], 0, maxDepth, currDepth + 1).trimStart() + 
                    (i < obj.length - 1 ? ',' : '') + '\n';
            }
            
            result += ' '.repeat(indent) + ']';
            return result;
        }
        
        const keys = Object.keys(obj);
        if (keys.length === 0) {
            return ' '.repeat(indent) + '{}';
        }
        
        let result = ' '.repeat(indent) + '{\n';
        
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            result += ' '.repeat(indent + 2) + `"${key}": ` + 
                this.formatObject(obj[key], 0, maxDepth, currDepth + 1).trimStart() + 
                (i < keys.length - 1 ? ',' : '') + '\n';
        }
        
        result += ' '.repeat(indent) + '}';
        return result;
    }
    
    /**
     * Add syntax highlighting to code
     * @param code The code to highlight
     * @param language The language of the code
     */
    protected highlightSyntax(code: string, language: string = 'php'): string {
        // In an output channel we can't do real syntax highlighting,
        // but we can add some basic formatting
        
        // Highlight strings
        code = code.replace(/('.*?'|".*?")/g, '\x1b[32m$1\x1b[0m');
        
        // Highlight numbers
        code = code.replace(/\b(\d+)\b/g, '\x1b[33m$1\x1b[0m');
        
        // Highlight keywords (PHP)
        if (language === 'php') {
            const keywords = [
                'array', 'object', 'string', 'int', 'float', 'bool', 'null', 'true', 'false',
                'function', 'class', 'public', 'private', 'protected', 'static', 'const',
                'return', 'if', 'else', 'foreach', 'for', 'while', 'do', 'switch', 'case'
            ];
            
            keywords.forEach(keyword => {
                const re = new RegExp(`\\b(${keyword})\\b`, 'g');
                code = code.replace(re, '\x1b[34m$1\x1b[0m');
            });
        }
        
        return code;
    }
    
    /**
     * Add line numbers to a multi-line string
     * @param text The text to add line numbers to
     */
    protected addLineNumbers(text: string): string {
        const lines = text.split('\n');
        const maxLineNum = lines.length.toString().length;
        
        return lines.map((line, index) => {
            const lineNum = (index + 1).toString().padStart(maxLineNum, ' ');
            return `${lineNum} | ${line}`;
        }).join('\n');
    }
}