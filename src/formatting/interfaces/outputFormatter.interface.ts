import * as vscode from 'vscode';
import { ExecutionResult } from '../../execution/executor';

/**
 * Options for formatting output
 */
export interface FormattingOptions {
    collapsible?: boolean;
    maxDepth?: number;
    highlightSyntax?: boolean;
    showLineNumbers?: boolean;
    showExportButton?: boolean;
}

/**
 * Interface for an output formatter
 */
export interface IOutputFormatter {
    /**
     * Check if this formatter can handle the given output
     * @param output The output to check
     */
    canFormat(output: string): boolean;
    
    /**
     * Format the output for display in the output channel
     * @param result The execution result
     * @param options Formatting options
     */
    format(result: ExecutionResult, options?: FormattingOptions): string;
    
    /**
     * Get the original output data in a structured format if possible
     */
    getData(): any;
}