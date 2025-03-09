import { ExecutionResult } from '../../execution/executor';
import { FormattingOptions } from '../interfaces/outputFormatter.interface';
import { BaseFormatter } from './baseFormatter';

/**
 * Formatter for PHP object outputs
 */
export class ObjectFormatter extends BaseFormatter {
    private phpObjectRegex = /^object\(([^)]+)\)#(\d+)\s+\(([^)]*)\)$/s;
    private phpStaticObjectRegex = /^([A-Za-z0-9_\\]+)::__set_state\(array\((.*)\)\)$/s;
    
    /**
     * Check if this formatter can handle the given output
     * @param output The output to check
     */
    public canFormat(output: string): boolean {
        const trimmedOutput = output.trim();
        
        // Check if it's a PHP object
        if (trimmedOutput.startsWith('object(') && 
            (trimmedOutput.match(this.phpObjectRegex) || 
             trimmedOutput.match(this.phpStaticObjectRegex))) {
            this.rawOutput = trimmedOutput;
            return true;
        }
        
        // Check for alternative PHP object format
        if (trimmedOutput.match(/^[A-Za-z0-9_\\]+::__set_state\(/)) {
            this.rawOutput = trimmedOutput;
            return true;
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
            // Parse the PHP object into a JavaScript object for better formatting
            let jsObject: any = {};
            let className = 'Unknown';
            let objectId = '0';
            
            // Try to match standard PHP object format
            const match = rawOutput.match(this.phpObjectRegex);
            if (match) {
                className = match[1];
                objectId = match[2];
                const properties = match[3];
                
                jsObject = {
                    __class: className,
                    __id: objectId,
                    ...this.parsePhpObjectProperties(properties)
                };
                
                this.data = jsObject;
            } else {
                // Try to match static PHP object format
                const staticMatch = rawOutput.match(this.phpStaticObjectRegex);
                if (staticMatch) {
                    className = staticMatch[1];
                    const properties = staticMatch[2];
                    
                    jsObject = {
                        __class: className,
                        __static: true,
                        ...this.parsePhpObjectProperties(properties)
                    };
                    
                    this.data = jsObject;
                } else {
                    // Could not parse as a structured object
                    this.data = rawOutput;
                }
            }
            
            // Format the object with proper indentation
            let formatted = '';
            
            if (typeof jsObject === 'object' && jsObject !== null) {
                formatted = `Object: ${className}${objectId ? ` #${objectId}` : ''}\n`;
                formatted += this.formatObject(jsObject, 0, maxDepth);
            } else {
                // If we couldn't parse it as an object, format as-is
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
                formatted = this.createCollapsibleSection(`PHP Object: ${className}`, formatted);
            }
            
            return formatted;
            
        } catch (error) {
            // Return the raw output if parsing fails
            return `Failed to parse PHP object: ${error instanceof Error ? error.message : String(error)}\n\n${rawOutput}`;
        }
    }
    
    /**
     * Parse PHP object properties string into a JavaScript object
     * @param properties The properties string from the PHP object
     * @returns A JavaScript object representation
     */
    private parsePhpObjectProperties(properties: string): any {
        const result: any = {};
        
        if (!properties.trim()) {
            return result; // Empty properties
        }
        
        // Split by property entries but handle nested structures
        let currentProp = '';
        let depth = 0;
        let isInString = false;
        let stringDelimiter = '';
        
        // Add a last character to ensure the last property is processed
        const propertiesWithSentinel = properties + ',';
        
        for (let i = 0; i < propertiesWithSentinel.length; i++) {
            const char = propertiesWithSentinel[i];
            
            // Handle string delimiters
            if ((char === '"' || char === "'") && (i === 0 || propertiesWithSentinel[i-1] !== '\\')) {
                if (!isInString) {
                    isInString = true;
                    stringDelimiter = char;
                } else if (char === stringDelimiter) {
                    isInString = false;
                }
            }
            
            // Handle nested structures but only if not in a string
            if (!isInString) {
                if (char === '(' || char === '[' || char === '{') {
                    depth++;
                } else if (char === ')' || char === ']' || char === '}') {
                    depth--;
                }
            }
            
            // If we hit a property separator at depth 0, process the property
            if (char === ',' && depth === 0 && !isInString) {
                this.processPropertyEntry(currentProp.trim(), result);
                currentProp = '';
            } else {
                currentProp += char;
            }
        }
        
        return result;
    }
    
    /**
     * Process a single PHP object property entry
     * @param entry The property entry string
     * @param result The result object to add the property to
     */
    private processPropertyEntry(entry: string, result: any): void {
        if (!entry) return;
        
        // Match different styles of PHP property notation
        // 1. ["property"]=>value
        // 2. ["property":protected]=>value
        // 3. ["property":private]=>value
        // 4. ["class":"property":private]=>value
        // 5. property=>value (for public)
        
        let propertyName = '';
        let propertyValue = '';
        let visibility = 'public';
        
        const arrowIndex = entry.indexOf('=>');
        if (arrowIndex !== -1) {
            const left = entry.substring(0, arrowIndex).trim();
            propertyValue = entry.substring(arrowIndex + 2).trim();
            
            // Check for quoted property notation
            const quotedMatch = left.match(/^\["([^"]+)"(?::([a-z]+))?\]$/);
            if (quotedMatch) {
                propertyName = quotedMatch[1];
                if (quotedMatch[2]) {
                    visibility = quotedMatch[2]; // protected or private
                }
            } else {
                // Check for class-specific private property
                const classSpecificMatch = left.match(/^\["([^"]+)":"([^"]+)":[a-z]+\]$/);
                if (classSpecificMatch) {
                    const className = classSpecificMatch[1];
                    propertyName = classSpecificMatch[2];
                    visibility = 'private';
                    
                    // Format as Class::property
                    propertyName = `${className}::${propertyName}`;
                } else {
                    // Regular property
                    propertyName = left;
                }
            }
        }
        
        if (propertyName && propertyValue) {
            // Format the property name based on visibility
            let formattedName = propertyName;
            if (visibility === 'protected') {
                formattedName = `#${propertyName}`;
            } else if (visibility === 'private') {
                formattedName = `_${propertyName}`;
            }
            
            // Set the property with the parsed value
            result[formattedName] = this.parsePhpValue(propertyValue);
        }
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
        if (value === 'true' || value === 'TRUE') return true;
        if (value === 'false' || value === 'FALSE') return false;
        
        // Null
        if (value === 'null' || value === 'NULL') return null;
        
        // Array (simplified)
        if (value.startsWith('array(') && value.endsWith(')')) {
            return value; // Just return as string, full parsing would be complex
        }
        
        // Object (simplified)
        if (value.startsWith('object(') || value.match(/^[A-Za-z0-9_\\]+::__set_state\(/)) {
            return value; // Just return as string, full parsing would be complex
        }
        
        // If we can't determine the type, return as string
        return value;
    }
}