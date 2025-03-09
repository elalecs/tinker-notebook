import * as vscode from 'vscode';
import { ExecutionResult } from '../execution/executor';
import { IOutputFormatter, FormattingOptions } from './interfaces/outputFormatter.interface';
import { OutputDetector } from './outputDetector';
import { JsonFormatter } from './formatters/jsonFormatter';
import { ArrayFormatter } from './formatters/arrayFormatter';
import { ObjectFormatter } from './formatters/objectFormatter';
import { StringFormatter } from './formatters/stringFormatter';
import { IExporter } from './exporters/exporter.interface';
import { CsvExporter } from './exporters/csvExporter';
import { JsonExporter } from './exporters/jsonExporter';
import { TextExporter } from './exporters/textExporter';

/**
 * Manages output formatting and exporters
 */
export class OutputFormatterManager {
    private formatters: IOutputFormatter[] = [];
    private exporters: IExporter[] = [];
    private outputChannel: vscode.OutputChannel;
    private lastResult: ExecutionResult | undefined;
    
    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
        
        // Register formatters
        this.registerFormatter(new JsonFormatter());
        this.registerFormatter(new ArrayFormatter());
        this.registerFormatter(new ObjectFormatter());
        this.registerFormatter(new StringFormatter());
        
        // Register exporters
        this.registerExporter(new CsvExporter());
        this.registerExporter(new JsonExporter());
        this.registerExporter(new TextExporter());
    }
    
    /**
     * Register a new formatter
     * @param formatter The formatter to register
     */
    public registerFormatter(formatter: IOutputFormatter): void {
        this.formatters.push(formatter);
    }
    
    /**
     * Register a new exporter
     * @param exporter The exporter to register
     */
    public registerExporter(exporter: IExporter): void {
        this.exporters.push(exporter);
    }
    
    /**
     * Format the execution result for display
     * @param result The execution result
     * @param options Formatting options
     */
    public formatOutput(result: ExecutionResult, options?: FormattingOptions): string {
        if (!result.output.trim()) {
            return "No output generated";
        }
        
        // Find appropriate formatter
        const formatter = OutputDetector.findFormatter(result.output, this.formatters);
        
        if (formatter) {
            return formatter.format(result, options);
        }
        
        // Fallback to default string output
        return result.output;
    }
    
    /**
     * Display formatted result in the output channel
     * @param result The execution result
     * @param document The document containing the code
     * @param range The range of the code in the document
     * @param isPhp Whether the result is from PHP or Tinker
     */
    public showFormattedResult(result: ExecutionResult, document: vscode.TextDocument, range: vscode.Range, isPhp: boolean = false): void {
        this.outputChannel.clear();
        this.outputChannel.appendLine(`=== ${isPhp ? 'PHP' : 'Laravel Tinker'} Execution Result ===`);
        this.outputChannel.appendLine(`Execution time: ${result.executionTime}ms`);
        this.outputChannel.appendLine('');
        
        // Store result for potential export
        this.lastResult = result;
        
        if (result.output) {
            this.outputChannel.appendLine('=== Output ===');
            const formattedOutput = this.formatOutput(result, {
                collapsible: true,
                maxDepth: 3,
                highlightSyntax: true,
                showExportButton: true
            });
            this.outputChannel.appendLine(formattedOutput);
            
            // Add export options if available
            if (this.exporters.length > 0) {
                this.outputChannel.appendLine('');
                this.outputChannel.appendLine('=== Export Options ===');
                this.outputChannel.appendLine(`To export this result, use:
- Export as JSON: Run command "tinker-notebook.exportAsJSON"
- Export as CSV: Run command "tinker-notebook.exportAsCSV"
- Export as Text: Run command "tinker-notebook.exportAsText"`);
            }
        }
        
        if (result.error) {
            this.outputChannel.appendLine('=== Error ===');
            this.outputChannel.appendLine(result.error);
        }
        
        this.outputChannel.show(true);
    }
    
    /**
     * Toggle the visibility of collapsible sections in the output
     */
    public toggleCollapsible(): void {
        // Currently we cannot manipulate the content of the output channel directly
        // In the future, this could be implemented with a custom webview editor
        vscode.window.showInformationMessage('Collapsible sections are currently view-only. A future update will make them interactive.');
    }
    
    /**
     * Export the most recent result using the specified format
     * @param format The format to export to (JSON, CSV, Text)
     */
    public async exportResult(format: string): Promise<void> {
        if (!this.lastResult) {
            vscode.window.showErrorMessage('No result to export. Execute a code block first.');
            return;
        }
        
        const exporter = this.exporters.find(exp => exp.getFormat().toLowerCase() === format.toLowerCase());
        
        if (!exporter) {
            vscode.window.showErrorMessage(`No exporter found for format: ${format}`);
            return;
        }
        
        // Find formatter to get structured data if possible
        const formatter = OutputDetector.findFormatter(this.lastResult.output, this.formatters);
        const data = formatter ? formatter.getData() : this.lastResult.output;
        
        // Export the data
        await exporter.export(data);
    }
}