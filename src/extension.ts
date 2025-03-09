import * as vscode from 'vscode';
import * as path from 'path';
import { CodeBlockDetector, CodeBlock } from './codeBlock/detector';
import { CodeBlockDecorator } from './codeBlock/decorator';
import { CodeExecutor } from './execution/executor';
import { TinkerExecutor } from './execution/tinkerExecutor';
import { LaravelDetector } from './laravel/detector';
import { FileUtils } from './utils/fileUtils';

// Output channel for execution results
let outputChannel: vscode.OutputChannel;

// Diagnostic collection for problems panel
let diagnosticCollection: vscode.DiagnosticCollection;

// Status bar item
let statusBarItem: vscode.StatusBarItem;

// Extension activation function
export function activate(context: vscode.ExtensionContext) {
    console.log('Tinker Notebook extension is now active');
    
    // Initialize output channel
    outputChannel = vscode.window.createOutputChannel('Tinker Notebook');
    context.subscriptions.push(outputChannel);
    
    // Initialize diagnostic collection for Problems panel
    diagnosticCollection = vscode.languages.createDiagnosticCollection('Tinker Notebook');
    context.subscriptions.push(diagnosticCollection);
    
    // Initialize status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(code) Tinker Notebook";
    statusBarItem.tooltip = "Tinker Notebook is ready";
    statusBarItem.command = 'tinker-notebook.showOutputChannel';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    
    // Initialize core services
    const codeBlockDetector = new CodeBlockDetector();
    const codeBlockDecorator = new CodeBlockDecorator();
    const codeExecutor = new CodeExecutor(outputChannel, diagnosticCollection);
    const tinkerExecutor = new TinkerExecutor(outputChannel, diagnosticCollection);
    
    // Clean up temporary files on startup
    FileUtils.cleanupTempFiles();
    
    // Update decorations when the active editor changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                updateDecorations(editor);
            }
        })
    );
    
    // Update decorations when the document changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (editor && event.document === editor.document) {
                updateDecorations(editor);
            }
        })
    );
    
    // Register command to execute code block
    const executeCodeBlockCommand = vscode.commands.registerCommand(
        'tinker-notebook.executeCodeBlock',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            
            const document = editor.document;
            if (document.languageId !== 'markdown') {
                vscode.window.showInformationMessage('Tinker Notebook only works with Markdown files');
                return;
            }
            
            const position = editor.selection.active;
            const codeBlock = codeBlockDetector.findCodeBlockAtPosition(document, position);
            
            if (codeBlock) {
                await executeCodeBlock(codeBlock, document, editor);
            } else {
                vscode.window.showInformationMessage('No PHP or Tinker code block found at cursor position');
            }
        }
    );
    
    // Register command to execute code block from decorator
    const executeFromDecoratorCommand = vscode.commands.registerCommand(
        'tinker-notebook.executeFromDecorator',
        async (blockId: string) => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            
            const document = editor.document;
            const codeBlocks = codeBlockDetector.findCodeBlocks(document);
            const codeBlock = codeBlocks.find(block => block.id === blockId);
            
            if (codeBlock) {
                await executeCodeBlock(codeBlock, document, editor);
            }
        }
    );
    
    // Function to execute a code block
    async function executeCodeBlock(codeBlock: CodeBlock, document: vscode.TextDocument, editor: vscode.TextEditor) {
        try {
            // Set block status to executing
            codeBlockDecorator.setBlockStatus(codeBlock.id, 'executing');
            updateDecorations(editor);
            
            // Update status bar to show executing
            statusBarItem.text = "$(sync~spin) Executing code...";
            statusBarItem.tooltip = "Tinker Notebook is executing code";
            
            // Execute the code based on the type of code block
            let result;
            if (codeBlock.type === 'tinker') {
                statusBarItem.text = "$(sync~spin) Executing Tinker code...";
                result = await tinkerExecutor.executeCode(codeBlock.content, document);
                tinkerExecutor.showResult(result, document, codeBlock.range);
            } else {
                // Default to PHP execution for 'php' or any other type
                statusBarItem.text = "$(sync~spin) Executing PHP code...";
                result = await codeExecutor.executeCode(codeBlock.content);
                codeExecutor.showResult(result, document, codeBlock.range);
            }
            
            // Update block status based on result
            if (result.error) {
                codeBlockDecorator.setBlockStatus(codeBlock.id, 'error');
                statusBarItem.text = "$(error) Execution failed";
                statusBarItem.tooltip = `Error: ${String(result.error)}`;
            } else {
                codeBlockDecorator.setBlockStatus(codeBlock.id, 'success');
                statusBarItem.text = "$(check) Execution successful";
                statusBarItem.tooltip = "Code executed successfully";
            }
            
            // Reset status bar after 3 seconds
            setTimeout(() => {
                statusBarItem.text = "$(code) Tinker Notebook";
                statusBarItem.tooltip = "Tinker Notebook is ready";
            }, 3000);
            
            // Update decorations
            updateDecorations(editor);
            
        } catch (error) {
            // Set block status to error
            codeBlockDecorator.setBlockStatus(codeBlock.id, 'error');
            updateDecorations(editor);
            
            // Update status bar to show error
            statusBarItem.text = "$(error) Execution failed";
            statusBarItem.tooltip = `Error executing code: ${error instanceof Error ? error.message : String(error)}`;
            
            // Reset status bar after 3 seconds
            setTimeout(() => {
                statusBarItem.text = "$(code) Tinker Notebook";
                statusBarItem.tooltip = "Tinker Notebook is ready";
            }, 3000);
            
            // Show error message
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Error executing code: ${errorMessage}`);
            
            // Add error to output channel
            outputChannel.appendLine(`Error: ${errorMessage}`);
            outputChannel.show();
        }
    }
    
    // Function to update decorations in the editor
    function updateDecorations(editor: vscode.TextEditor) {
        if (editor.document.languageId !== 'markdown') {
            return;
        }
        
        const codeBlocks = codeBlockDetector.findCodeBlocks(editor.document);
        codeBlockDecorator.updateDecorations(editor, codeBlocks);
    }
    
    // Initialize decorations for the active editor
    if (vscode.window.activeTextEditor) {
        updateDecorations(vscode.window.activeTextEditor);
    }
    
    // Register command to show output channel
    const showOutputChannelCommand = vscode.commands.registerCommand(
        'tinker-notebook.showOutputChannel',
        () => {
            outputChannel.show();
        }
    );
    
    // Add commands to subscriptions
    context.subscriptions.push(executeCodeBlockCommand);
    context.subscriptions.push(executeFromDecoratorCommand);
    context.subscriptions.push(showOutputChannelCommand);
    context.subscriptions.push(codeBlockDecorator);
}

// Extension deactivation function
export function deactivate() {
    // Clean up temporary files
    FileUtils.cleanupTempFiles();
    
    // Dispose of status bar item if it exists
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
