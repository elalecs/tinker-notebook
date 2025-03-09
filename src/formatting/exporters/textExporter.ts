import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { IExporter } from './exporter.interface';

/**
 * Exporter for plain text format
 */
export class TextExporter implements IExporter {
    /**
     * Get the format name
     */
    public getFormat(): string {
        return 'Text';
    }
    
    /**
     * Export data to text file
     * @param data The data to export
     */
    public async export(data: any): Promise<void> {
        try {
            // Ask user for file path
            const defaultUri = vscode.workspace.workspaceFolders ? 
                vscode.Uri.file(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'tinker-output.txt')) :
                vscode.Uri.file(path.join(process.env.HOME || process.env.USERPROFILE || '.', 'tinker-output.txt'));
            
            const fileUri = await vscode.window.showSaveDialog({
                defaultUri,
                filters: {
                    'Text Files': ['txt']
                },
                title: 'Export as Text'
            });
            
            if (!fileUri) {
                return; // User cancelled
            }
            
            // Convert data to text
            const textData = this.convertToText(data);
            
            // Write to file
            await fs.promises.writeFile(fileUri.fsPath, textData, 'utf8');
            
            // Show success message
            vscode.window.showInformationMessage(`Successfully exported data to ${fileUri.fsPath}`);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to export as text: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    /**
     * Convert data to text string
     * @param data The data to convert
     */
    private convertToText(data: any): string {
        // If it's already a string, return it
        if (typeof data === 'string') {
            return data;
        }
        
        // If it's null or undefined, return empty string
        if (data === null || data === undefined) {
            return '';
        }
        
        // If it's an object or array, convert to formatted JSON
        if (typeof data === 'object') {
            try {
                return JSON.stringify(data, null, 2);
            } catch (e) {
                return String(data);
            }
        }
        
        // Otherwise, convert to string
        return String(data);
    }
}