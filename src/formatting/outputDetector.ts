import { IOutputFormatter } from './interfaces/outputFormatter.interface';

/**
 * Enum for different types of output
 */
export enum OutputType {
    JSON,
    Array,
    Object,
    PHPArray,
    PHPObject,
    String,
    Number,
    Boolean,
    Null,
    Undefined
}

/**
 * Detects the type of output and finds appropriate formatter
 */
export class OutputDetector {
    /**
     * Detect the type of output
     * @param output The output to detect
     */
    public static detectType(output: string): OutputType {
        const trimmedOutput = output.trim();
        
        // Check if output is empty
        if (!trimmedOutput) {
            return OutputType.String;
        }
        
        // Try parsing as JSON
        try {
            const parsed = JSON.parse(trimmedOutput);
            
            if (parsed === null) {
                return OutputType.Null;
            }
            if (typeof parsed === 'boolean') {
                return OutputType.Boolean;
            }
            if (typeof parsed === 'number') {
                return OutputType.Number;
            }
            if (Array.isArray(parsed)) {
                return OutputType.Array;
            }
            if (typeof parsed === 'object') {
                return OutputType.Object;
            }
            
            return OutputType.JSON;
        } catch (e) {
            // Check for PHP array format
            if (trimmedOutput.startsWith('array(') || 
                trimmedOutput.match(/^\[\s*.*\s*\]$/m)) {
                return OutputType.PHPArray;
            }
            
            // Check for PHP object format
            if (trimmedOutput.startsWith('object(') || 
                trimmedOutput.match(/^[A-Za-z0-9_\\]+::__set_state\(/)) {
                return OutputType.PHPObject;
            }
            
            // Default to string
            return OutputType.String;
        }
    }
    
    /**
     * Find the appropriate formatter for the given output
     * @param output The output to format
     * @param formatters Available formatters
     */
    public static findFormatter(output: string, formatters: IOutputFormatter[]): IOutputFormatter | undefined {
        return formatters.find(formatter => formatter.canFormat(output));
    }
}