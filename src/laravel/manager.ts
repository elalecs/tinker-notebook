import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import { LaravelDetector } from './detector';
import { FileUtils } from '../utils/fileUtils';

/**
 * Class to manage Laravel projects for Tinker execution
 */
export class LaravelManager {
    private tempProjectDir: string;
    private outputChannel: vscode.OutputChannel;

    /**
     * Constructor
     * @param outputChannel Output channel for displaying messages
     */
    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
        
        // Create temp directory for Laravel projects
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
            this.tempProjectDir = path.join(workspaceRoot, '.tinker-notebook');
        } else {
            // Fallback to OS temp directory if no workspace is open
            this.tempProjectDir = path.join(os.tmpdir(), 'tinker-notebook');
        }
        
        // Ensure temp directory exists
        if (!fs.existsSync(this.tempProjectDir)) {
            fs.mkdirSync(this.tempProjectDir, { recursive: true });
        }
    }

    /**
     * Get Laravel project for a file
     * @param filePath Path to the file
     * @returns Path to Laravel project or null if not available
     */
    public async getLaravelProject(filePath: string): Promise<string | null> {
        // First, try to find an existing Laravel project
        const nearestProject = LaravelDetector.getNearestLaravelProject(filePath);
        if (nearestProject) {
            return nearestProject;
        }

        // If no existing project, check if we have a temporary project
        const tempProjectPath = path.join(this.tempProjectDir, 'laravel');
        if (fs.existsSync(path.join(tempProjectPath, 'artisan'))) {
            return tempProjectPath;
        }

        // If no temporary project, try to create one
        return this.createTemporaryLaravelProject();
    }

    /**
     * Create a temporary Laravel project
     * @returns Path to the created project or null if failed
     */
    private async createTemporaryLaravelProject(): Promise<string | null> {
        const tempProjectPath = path.join(this.tempProjectDir, 'laravel');
        
        // Check if composer is available
        if (!await this.isCommandAvailable('composer')) {
            this.outputChannel.appendLine('❌ Composer is not available. Cannot create temporary Laravel project.');
            return null;
        }

        // Create directory if it doesn't exist
        if (!fs.existsSync(tempProjectPath)) {
            fs.mkdirSync(tempProjectPath, { recursive: true });
        }

        try {
            this.outputChannel.appendLine('Creating temporary Laravel project...');
            this.outputChannel.show();

            // Create Laravel project using composer
            const result = await this.executeCommand(
                'composer create-project --prefer-dist laravel/laravel .',
                tempProjectPath
            );

            if (result.exitCode !== 0) {
                this.outputChannel.appendLine(`❌ Failed to create Laravel project: ${result.error || result.output}`);
                return null;
            }

            this.outputChannel.appendLine('✅ Temporary Laravel project created successfully.');
            return tempProjectPath;
        } catch (error) {
            this.outputChannel.appendLine(`❌ Error creating Laravel project: ${error}`);
            return null;
        }
    }

    /**
     * Check if a command is available in the system
     * @param command Command to check
     * @returns True if the command is available, false otherwise
     */
    private async isCommandAvailable(command: string): Promise<boolean> {
        try {
            const checkCommand = process.platform === 'win32' 
                ? `where ${command}`
                : `which ${command}`;
            
            const result = await this.executeCommand(checkCommand);
            return result.exitCode === 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Execute a command and return the result
     * @param command Command to execute
     * @param cwd Working directory
     * @returns Result of the command execution
     */
    private executeCommand(command: string, cwd?: string): Promise<{ output: string, error?: string, exitCode: number }> {
        return new Promise((resolve) => {
            const process = child_process.exec(
                command,
                { cwd },
                (error, stdout, stderr) => {
                    resolve({
                        output: stdout,
                        error: stderr,
                        exitCode: error ? error.code || 1 : 0
                    });
                }
            );
        });
    }
}
