import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Result of a code execution
 */
export interface ExecutionResult {
    output: string;
    error?: string;
    exitCode: number;
    executionTime: number;
}

/**
 * Handles execution of PHP code
 */
export class CodeExecutor {
    private tempDir: string;
    private outputChannel: vscode.OutputChannel;
    private diagnosticCollection: vscode.DiagnosticCollection;
    
    constructor(outputChannel: vscode.OutputChannel, diagnosticCollection: vscode.DiagnosticCollection) {
        this.outputChannel = outputChannel;
        this.diagnosticCollection = diagnosticCollection;
        
        // Create temporary directory for code execution
        this.tempDir = path.join(os.tmpdir(), 'tinker-notebook');
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }
    
    /**
     * Execute PHP code and return the result
     * @param code The PHP code to execute
     * @returns The execution result
     */
    public async executeCode(code: string): Promise<ExecutionResult> {
        // Record start time for performance tracking
        const startTime = Date.now();
        
        try {
            // Create a temporary file for the code
            const tempFile = await this.createTempCodeFile(code);
            
            // Execute the code with PHP
            const result = await this.executePhp(tempFile);
            
            // Clean up the temporary file
            fs.unlinkSync(tempFile);
            
            // Calculate execution time
            const executionTime = Date.now() - startTime;
            
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
        const tempFile = path.join(this.tempDir, `code-${Date.now()}.php`);
        
        // Add PHP opening tag if not present
        if (!code.trim().startsWith('<?php')) {
            code = `<?php\n${code}`;
        }
        
        // Write code to temporary file
        fs.writeFileSync(tempFile, code);
        
        return tempFile;
    }
    
    /**
     * Execute a PHP file and return the result
     * @param filePath The path to the PHP file
     * @returns The execution result
     */
    private executePhp(filePath: string): Promise<{ output: string, error?: string, exitCode: number }> {
        return new Promise((resolve) => {
            // Execute PHP with the file
            const process = cp.spawn('php', [filePath]);
            
            let stdout = '';
            let stderr = '';
            
            // Collect stdout
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            // Collect stderr
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            // Handle process completion
            process.on('close', (code) => {
                resolve({
                    output: stdout,
                    error: stderr || undefined,
                    exitCode: code || 0
                });
            });
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
        this.outputChannel.appendLine('=== PHP Code Execution Result ===');
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
