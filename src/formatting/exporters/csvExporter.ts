import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { IExporter } from './exporter.interface';

/**
 * Exporter for CSV format
 */
export class CsvExporter implements IExporter {
    /**
     * Get the format name
     */
    public getFormat(): string {
        return 'CSV';
    }
    
    /**
     * Export data to CSV file
     * @param data The data to export
     */
    public async export(data: any): Promise<void> {
        try {
            // Ask user for file path
            const defaultUri = vscode.workspace.workspaceFolders ? 
                vscode.Uri.file(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'tinker-output.csv')) :
                vscode.Uri.file(path.join(process.env.HOME || process.env.USERPROFILE || '.', 'tinker-output.csv'));
            
            const fileUri = await vscode.window.showSaveDialog({
                defaultUri,
                filters: {
                    'CSV Files': ['csv']
                },
                title: 'Export as CSV'
            });
            
            if (!fileUri) {
                return; // User cancelled
            }
            
            // Convert data to CSV
            const csvData = this.convertToCSV(data);
            
            // Write to file
            await fs.promises.writeFile(fileUri.fsPath, csvData, 'utf8');
            
            // Show success message
            vscode.window.showInformationMessage(`Successfully exported data to ${fileUri.fsPath}`);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to export as CSV: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    /**
     * Convert data to CSV string
     * @param data The data to convert
     */
    private convertToCSV(data: any): string {
        // If it's a string, try to parse it first
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                // If it can't be parsed as JSON, just return it as a string
                return data;
            }
        }
        
        // If it's null or undefined, return empty string
        if (data === null || data === undefined) {
            return '';
        }
        
        // Handle arrays of objects (most common case for CSV)
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
            // Get all unique headers from all objects
            const headers = new Set<string>();
            data.forEach(item => {
                if (item && typeof item === 'object') {
                    Object.keys(item).forEach(key => headers.add(key));
                }
            });
            
            // Convert headers to array
            const headerArray = Array.from(headers);
            
            // Create CSV header row
            let csv = headerArray.map(header => this.escapeCSV(header)).join(',') + '\n';
            
            // Add data rows
            data.forEach(item => {
                const row = headerArray.map(header => {
                    if (item && typeof item === 'object' && header in item) {
                        const value = item[header];
                        return this.escapeCSV(this.formatValue(value));
                    }
                    return '';
                }).join(',');
                
                csv += row + '\n';
            });
            
            return csv;
        }
        
        // Handle simple object (convert to single-row CSV)
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            const headers = Object.keys(data);
            const headerRow = headers.map(header => this.escapeCSV(header)).join(',');
            const dataRow = headers.map(header => this.escapeCSV(this.formatValue(data[header]))).join(',');
            
            return headerRow + '\n' + dataRow + '\n';
        }
        
        // Handle array of primitive values
        if (Array.isArray(data)) {
            return data.map(item => this.escapeCSV(this.formatValue(item))).join('\n') + '\n';
        }
        
        // Handle primitive value
        return this.formatValue(data) + '\n';
    }
    
    /**
     * Format a value for CSV inclusion
     * @param value The value to format
     */
    private formatValue(value: any): string {
        if (value === null || value === undefined) {
            return '';
        }
        
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        
        return String(value);
    }
    
    /**
     * Escape a value for CSV inclusion
     * @param value The value to escape
     */
    private escapeCSV(value: string): string {
        // If the value contains commas, quotes, or newlines, wrap it in quotes
        if (/[",\n\r]/.test(value)) {
            // Escape quotes by doubling them
            value = value.replace(/"/g, '""');
            return `"${value}"`;
        }
        return value;
    }
}