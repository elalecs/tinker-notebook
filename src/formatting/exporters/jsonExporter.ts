import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { IExporter } from './exporter.interface';

/**
 * Exporter for JSON format
 */
export class JsonExporter implements IExporter {
    /**
     * Get the format name
     */
    public getFormat(): string {
        return 'JSON';
    }
    
    /**
     * Export data to JSON file
     * @param data The data to export
     */
    public async export(data: any): Promise<void> {
        try {
            // Ask user for file path
            const defaultUri = vscode.workspace.workspaceFolders ? 
                vscode.Uri.file(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'tinker-output.json')) :
                vscode.Uri.file(path.join(process.env.HOME || process.env.USERPROFILE || '.', 'tinker-output.json'));
            
            const fileUri = await vscode.window.showSaveDialog({
                defaultUri,
                filters: {
                    'JSON Files': ['json']
                },
                title: 'Export as JSON'
            });
            
            if (!fileUri) {
                return; // User cancelled
            }
            
            // Convert data to JSON
            const jsonData = JSON.stringify(data, null, 2);
            
            // Write to file
            await fs.promises.writeFile(fileUri.fsPath, jsonData, 'utf8');
            
            // Show success message
            vscode.window.showInformationMessage(`Successfully exported data to ${fileUri.fsPath}`);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to export as JSON: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}