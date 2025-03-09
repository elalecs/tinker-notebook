import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { IFileSystem } from '../interfaces/fileSystem.interface';
import { NodeFileSystem } from '../services/nodeFileSystem.service';

/**
 * Class to detect Laravel projects in the workspace
 */
export class LaravelDetector {
    // Static instance of file system that can be replaced in tests
    private static fileSystem: IFileSystem = new NodeFileSystem();
    
    /**
     * Set the file system to use for detection
     * @param fs File system implementation
     */
    public static setFileSystem(fs: IFileSystem): void {
        LaravelDetector.fileSystem = fs;
    }
    
    /**
     * Get the current file system implementation
     * @returns File system implementation
     */
    public static getFileSystem(): IFileSystem {
        return LaravelDetector.fileSystem;
    }
    /**
     * Check if a directory is a Laravel project
     * @param directoryPath Path to the directory to check
     * @returns True if the directory is a Laravel project, false otherwise
     */
    public static isLaravelProject(directoryPath: string): boolean {
        // Check if artisan file exists
        const artisanPath = path.join(directoryPath, 'artisan');
        if (!this.fileSystem.existsSync(artisanPath)) {
            return false;
        }

        // Check if composer.json exists and contains laravel/framework
        const composerJsonPath = path.join(directoryPath, 'composer.json');
        if (!this.fileSystem.existsSync(composerJsonPath)) {
            return false;
        }

        try {
            const composerJson = JSON.parse(this.fileSystem.readFileSync(composerJsonPath, 'utf8').toString());
            const hasLaravelDependency = 
                (composerJson.require && composerJson.require['laravel/framework']) ||
                (composerJson.name === 'laravel/laravel');
            
            return hasLaravelDependency;
        } catch (error) {
            console.error('Error parsing composer.json:', error);
            return false;
        }
    }

    /**
     * Find Laravel projects in the workspace
     * @returns Array of paths to Laravel projects
     */
    public static findLaravelProjects(): string[] {
        const laravelProjects: string[] = [];
        
        if (!vscode.workspace.workspaceFolders) {
            return laravelProjects;
        }

        for (const folder of vscode.workspace.workspaceFolders) {
            const folderPath = folder.uri.fsPath;
            
            // Check if the folder itself is a Laravel project
            if (this.isLaravelProject(folderPath)) {
                laravelProjects.push(folderPath);
                continue;
            }

            // Check immediate subdirectories (common for multi-project workspaces)
            try {
                // Note: we have to use native fs here because our IFileSystem interface 
                // doesn't include directory listing methods like readdirSync
                const items = fs.readdirSync(folderPath);
                for (const item of items) {
                    const itemPath = path.join(folderPath, item);
                    const stats = fs.statSync(itemPath);
                    
                    if (stats.isDirectory() && this.isLaravelProject(itemPath)) {
                        laravelProjects.push(itemPath);
                    }
                }
            } catch (error) {
                console.error(`Error scanning directory ${folderPath}:`, error);
            }
        }

        return laravelProjects;
    }

    /**
     * Get the nearest Laravel project for a file
     * @param filePath Path to the file
     * @returns Path to the nearest Laravel project or null if not found
     */
    public static getNearestLaravelProject(filePath: string): string | null {
        const laravelProjects = this.findLaravelProjects();
        if (laravelProjects.length === 0) {
            return null;
        }

        // Sort projects by how close they are to the file path
        // (more specific paths should come first)
        laravelProjects.sort((a, b) => {
            // If the file is within the project, prioritize that project
            const fileInA = filePath.startsWith(a);
            const fileInB = filePath.startsWith(b);
            
            if (fileInA && !fileInB) {
                return -1;
            }
            if (!fileInA && fileInB) {
                return 1;
            }
            
            // If both or neither contain the file, prefer the longer path (more specific)
            return b.length - a.length;
        });

        // Return the closest Laravel project
        return laravelProjects[0];
    }
}
