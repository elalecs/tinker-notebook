import { ExecutionResult } from '../../execution/executor';
import { FormattingOptions } from '../interfaces/outputFormatter.interface';
import { BaseFormatter } from './baseFormatter';

/**
 * Formatter for JSON outputs
 */
export class JsonFormatter extends BaseFormatter {
    /**
     * Check if this formatter can handle the given output
     * @param output The output to check
     */
    public canFormat(output: string): boolean {
        try {
            const trimmedOutput = output.trim();
            // Must start with { or [ and be valid JSON
            if ((trimmedOutput.startsWith('{') || trimmedOutput.startsWith('[')) && 
                (trimmedOutput.endsWith('}') || trimmedOutput.endsWith(']'))) {
                
                JSON.parse(trimmedOutput);
                this.rawOutput = trimmedOutput;
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Format the output for display in the output channel
     * @param result The execution result
     * @param options Formatting options
     */
    public format(result: ExecutionResult, options?: FormattingOptions): string {
        // Parse the JSON
        try {
            this.data = JSON.parse(this.rawOutput || result.output.trim());
            
            // Format options
            const maxDepth = options?.maxDepth || 3;
            const shouldHighlight = options?.highlightSyntax !== false;
            const shouldAddLineNumbers = options?.showLineNumbers === true;
            const shouldCollapse = options?.collapsible === true;
            
            // Format the JSON
            let formatted = this.formatObject(this.data, 0, maxDepth);
            
            // Add syntax highlighting if requested
            if (shouldHighlight) {
                formatted = this.highlightSyntax(formatted, 'json');
            }
            
            // Add line numbers if requested
            if (shouldAddLineNumbers) {
                formatted = this.addLineNumbers(formatted);
            }
            
            // Create collapsible section if requested
            if (shouldCollapse) {
                formatted = this.createCollapsibleSection('JSON Output', formatted);
            }
            
            return formatted;
        } catch (error) {
            // Return the raw output if parsing fails
            return `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}\n\n${result.output}`;
        }
    }
}