import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { LaravelDetector } from './detector';
import { FileSystemService, NodeFileSystemService } from '../utils/fileSystemService';
import { ILaravelManager } from '../interfaces/laravelManager.interface';
import { IProcessExecutor } from '../interfaces/processExecutor.interface';
import { NodeProcessExecutor } from '../services/nodeProcessExecutor.service';

/**
 * Class to manage Laravel projects for Tinker execution
 */
export class LaravelManager implements ILaravelManager {
    private tempProjectDir: string;
    private outputChannel: vscode.OutputChannel;
    private processExecutor: IProcessExecutor;

    constructor(
        private workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined,
        private fs: FileSystemService = new NodeFileSystemService() as FileSystemService,
        outputChannel?: vscode.OutputChannel,
        processExecutor?: IProcessExecutor
    ) {
        this.tempProjectDir = path.join(this.getWorkspaceRoot(), '.tinker-notebook');
        this.outputChannel = outputChannel || vscode.window.createOutputChannel('Laravel Manager');
        this.processExecutor = processExecutor || new NodeProcessExecutor();
        
        if (!this.fs.existsSync(this.tempProjectDir)) {
            this.fs.mkdirSync(this.tempProjectDir, { recursive: true });
        }
    }

    private getWorkspaceRoot(): string {
        return this.workspaceFolders?.[0]?.uri.fsPath || os.tmpdir();
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
        if (this.fs.existsSync(path.join(tempProjectPath, 'artisan'))) {
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
        if (!this.fs.existsSync(tempProjectPath)) {
            this.fs.mkdirSync(tempProjectPath, { recursive: true });
        }

        try {
            this.outputChannel.appendLine('Creating temporary Laravel project...');
            this.outputChannel.show();

            // Create Laravel project using composer
            const result = await this.processExecutor.executeCommand(
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
            
            const result = await this.processExecutor.executeCommand(checkCommand);
            return result.exitCode === 0;
        } catch (error) {
            return false;
        }
    }
}
