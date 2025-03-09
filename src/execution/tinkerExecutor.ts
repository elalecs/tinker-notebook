import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ExecutionResult } from './executor';
import { LaravelManager } from '../laravel/manager';

/**
 * Handles execution of PHP code using Laravel Tinker
 */
export class TinkerExecutor {
    private outputChannel: vscode.OutputChannel;
    private diagnosticCollection: vscode.DiagnosticCollection;
    private laravelManager: LaravelManager;
    
    constructor(outputChannel: vscode.OutputChannel, diagnosticCollection: vscode.DiagnosticCollection) {
        this.outputChannel = outputChannel;
        this.diagnosticCollection = diagnosticCollection;
        this.laravelManager = new LaravelManager(outputChannel);
    }
    
    /**
     * Execute PHP code with Tinker and return the result
     * @param code The PHP code to execute
     * @param document The document containing the code
     * @returns The execution result
     */
    public async executeCode(code: string, document: vscode.TextDocument): Promise<ExecutionResult> {
        // Record start time for performance tracking
        const startTime = Date.now();
        this.outputChannel.appendLine('🔄 Preparing to execute Tinker code...');
        
        try {
            // Get Laravel project for the file
            this.outputChannel.appendLine('🔍 Detecting Laravel project...');
            const laravelProject = await this.laravelManager.getLaravelProject(document.uri.fsPath);
            
            if (!laravelProject) {
                this.outputChannel.appendLine('❌ No Laravel project found!');
                throw new Error('No Laravel project found. Cannot execute Tinker code. Please ensure you are in a Laravel project or that Laravel is installed.');
            }
            
            this.outputChannel.appendLine(`✅ Laravel project found at: ${laravelProject}`);
            
            // Create a temporary file for the code
            this.outputChannel.appendLine('📝 Creating temporary file for Tinker execution...');
            const tempFile = await this.createTempCodeFile(code);
            
            // Execute the code with Tinker
            this.outputChannel.appendLine('▶️ Executing code with Tinker...');
            const result = await this.executeTinker(tempFile, laravelProject);
            
            // Clean up the temporary file
            this.outputChannel.appendLine('🧹 Cleaning up temporary files...');
            fs.unlinkSync(tempFile);
            
            // Calculate execution time
            const executionTime = Date.now() - startTime;
            this.outputChannel.appendLine(`⏱️ Execution completed in ${executionTime}ms`);
            
            if (result.error) {
                this.outputChannel.appendLine('❌ Execution completed with errors');
            } else {
                this.outputChannel.appendLine('✅ Execution completed successfully');
            }
            
            return {
                ...result,
                executionTime
            };
        } catch (error) {
            return {
                output: '',
                error: error instanceof Error ? error.message : String(error),
                exitCode: 1,
                executionTime: Date.now() - startTime
            };
        }
    }
    
    /**
     * Create a temporary file with the given code
     * @param code The code to write to the file
     * @returns The path to the temporary file
     */
    private async createTempCodeFile(code: string): Promise<string> {
        // Determine the base directory for temporary files
        let baseDir: string;
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            // Use workspace folder if available
            baseDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
        } else {
            // Fallback to OS temp directory if no workspace is open
            baseDir = path.join(os.tmpdir());
        }
        
        // Create temp directory if it doesn't exist
        const tempDir = path.join(baseDir, '.tinker-notebook', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempFile = path.join(tempDir, `tinker-${Date.now()}.php`);
        
        // Format code for Tinker
        // Remove PHP tags as Tinker doesn't need them
        code = code.replace(/^<\?php/, '').replace(/<\?/, '').replace(/\?>/, '');
        
        // Write code to temporary file
        fs.writeFileSync(tempFile, code);
        
        return tempFile;
    }
    
    /**
     * Execute a PHP file with Tinker and return the result
     * @param filePath The path to the PHP file
     * @param laravelProjectPath The path to the Laravel project
     * @returns The execution result
     */
    private executeTinker(filePath: string, laravelProjectPath: string): Promise<{ output: string, error?: string, exitCode: number }> {
        return new Promise((resolve) => {
            try {
                // Check if artisan file exists in the Laravel project
                const artisanPath = path.join(laravelProjectPath, 'artisan');
                if (!fs.existsSync(artisanPath)) {
                    throw new Error(`Artisan file not found at ${artisanPath}. Cannot execute Tinker.`);
                }
                
                // Execute Tinker with the file
                this.outputChannel.appendLine(`📋 Executing: php artisan tinker ${filePath}`);
                const process = cp.spawn('php', ['artisan', 'tinker', filePath], {
                    cwd: laravelProjectPath
                });
                
                let stdout = '';
                let stderr = '';
                
                // Collect stdout
                process.stdout.on('data', (data) => {
                    const output = data.toString();
                    stdout += output;
                    this.outputChannel.append(output);
                });
                
                // Collect stderr
                process.stderr.on('data', (data) => {
                    const output = data.toString();
                    stderr += output;
                    this.outputChannel.append(`ERROR: ${output}`);
                });
                
                // Handle process completion
                process.on('close', (code) => {
                    if (code === 0) {
                        this.outputChannel.appendLine('✅ Tinker process completed successfully');
                    } else {
                        this.outputChannel.appendLine(`❌ Tinker process exited with code ${code}`);
                    }
                    
                    resolve({
                        output: stdout,
                        error: stderr || undefined,
                        exitCode: code || 0
                    });
                });
                
                // Handle process error
                process.on('error', (err) => {
                    this.outputChannel.appendLine(`❌ Failed to start Tinker process: ${err.message}`);
                    resolve({
                        output: '',
                        error: `Failed to start Tinker process: ${err.message}`,
                        exitCode: 1
                    });
                });
            } catch (error) {
                this.outputChannel.appendLine(`❌ Error executing Tinker: ${error instanceof Error ? error.message : String(error)}`);
                resolve({
                    output: '',
                    error: error instanceof Error ? error.message : String(error),
                    exitCode: 1
                });
            }
        });
    }
    
    /**
     * Show execution result in the output channel
     * @param result The execution result
     * @param document The document containing the code
     * @param range The range of the code in the document
     */
    public showResult(result: ExecutionResult, document: vscode.TextDocument, range: vscode.Range): void {
        this.outputChannel.clear();
        this.outputChannel.appendLine('=== Laravel Tinker Execution Result ===');
        this.outputChannel.appendLine(`Execution time: ${result.executionTime}ms`);
        this.outputChannel.appendLine('');
        
        if (result.output) {
            this.outputChannel.appendLine('=== Output ===');
            this.outputChannel.appendLine(result.output);
        }
        
        if (result.error) {
            this.outputChannel.appendLine('=== Error ===');
            this.outputChannel.appendLine(result.error);
            
            // Add diagnostic for error
            this.addErrorDiagnostic(document, range, result.error);
        } else {
            // Clear diagnostics if no error
            this.diagnosticCollection.delete(document.uri);
        }
        
        this.outputChannel.show(true);
    }
    
    /**
     * Add error diagnostic to the problems panel
     * @param document The document containing the code
     * @param range The range of the code in the document
     * @param errorMessage The error message
     */
    private addErrorDiagnostic(document: vscode.TextDocument, range: vscode.Range, errorMessage: string): void {
        const diagnostic = new vscode.Diagnostic(
            range,
            errorMessage,
            vscode.DiagnosticSeverity.Error
        );
        
        this.diagnosticCollection.set(document.uri, [diagnostic]);
    }
}
