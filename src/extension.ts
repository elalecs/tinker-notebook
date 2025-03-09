import * as vscode from 'vscode';
import * as path from 'path';
import { CodeBlockDetector, CodeBlock } from './codeBlock/detector';
import { CodeBlockDecorator } from './codeBlock/decorator';
import { CodeExecutor } from './execution/executor';
import { TinkerExecutor } from './execution/tinkerExecutor';
import { LaravelDetector } from './laravel/detector';
import { FileUtils } from './utils/fileUtils';
import { ServiceFactory } from './services/serviceFactory';
import { BlockStateManager } from './state/blockStateManager';
import { ResultReferenceProcessor } from './state/resultReferenceProcessor';
import { BlockState } from './interfaces/blockState.interface';
import { OutputFormatterManager } from './formatting/outputFormatterManager';

// Global services
let outputChannel: vscode.OutputChannel;
let diagnosticCollection: vscode.DiagnosticCollection;
let statusBarItem: vscode.StatusBarItem;
let blockStateManager: BlockStateManager;
let resultReferenceProcessor: ResultReferenceProcessor;
let outputFormatterManager: OutputFormatterManager;

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
    
    // Initialize state manager and result reference processor
    blockStateManager = new BlockStateManager(context);
    blockStateManager.loadState().catch(err => {
        console.error('Failed to load block state:', err);
    });
    resultReferenceProcessor = new ResultReferenceProcessor(blockStateManager);
    
    // Initialize output formatter manager
    outputFormatterManager = new OutputFormatterManager(outputChannel);
    
    // Initialize dependencies
    const fileSystem = ServiceFactory.createFileSystem();
    const processExecutor = ServiceFactory.createProcessExecutor();
    const laravelManager = ServiceFactory.createLaravelManager(
        vscode.workspace.workspaceFolders,
        fileSystem,
        outputChannel
    );
    
    // Initialize core services
    const codeBlockDetector = new CodeBlockDetector();
    const codeBlockDecorator = new CodeBlockDecorator(blockStateManager);
    const codeExecutor = new CodeExecutor(outputChannel, diagnosticCollection);
    const tinkerExecutor = new TinkerExecutor(
        outputChannel, 
        diagnosticCollection,
        laravelManager,
        fileSystem,
        processExecutor
    );
    
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
            codeBlockDecorator.setBlockState(codeBlock.id, BlockState.Executing);
            updateDecorations(editor);
            
            // Update status bar to show executing
            statusBarItem.text = "$(sync~spin) Executing code...";
            statusBarItem.tooltip = "Tinker Notebook is executing code";
            
            // Check for circular references
            if (resultReferenceProcessor.hasCircularReferences(codeBlock.id, codeBlock.content)) {
                throw new Error('Circular reference detected in $tinker_outputs references');
            }
            
            // Process content to resolve result references
            let processedContent = codeBlock.content;
            if (codeBlock.content.includes('$tinker_outputs.')) {
                processedContent = resultReferenceProcessor.processContent(codeBlock.content);
                
                // Log processed content for debugging
                outputChannel.appendLine('=== Processed Code with References ===');
                outputChannel.appendLine(processedContent);
            }
            
            // Execute the code based on the type of code block
            let result;
            if (codeBlock.type === 'tinker') {
                statusBarItem.text = "$(sync~spin) Executing Tinker code...";
                result = await tinkerExecutor.executeCode(processedContent, document);
                outputFormatterManager.showFormattedResult(result, document, codeBlock.range, false);
            } else {
                // Default to PHP execution for 'php' or any other type
                statusBarItem.text = "$(sync~spin) Executing PHP code...";
                result = await codeExecutor.executeCode(processedContent);
                outputFormatterManager.showFormattedResult(result, document, codeBlock.range, true);
            }
            
            // Store the result and update block state
            if (result.error) {
                codeBlockDecorator.setBlockState(codeBlock.id, BlockState.Error, result);
                statusBarItem.text = "$(error) Execution failed";
                statusBarItem.tooltip = `Error: ${String(result.error)}`;
            } else {
                codeBlockDecorator.setBlockState(codeBlock.id, BlockState.Success, result);
                statusBarItem.text = "$(check) Execution successful";
                statusBarItem.tooltip = "Code executed successfully";
                
                // Add block ID info to output if it has a custom ID (useful for referencing)
                if (codeBlock.customId) {
                    outputChannel.appendLine(`Block ID: ${codeBlock.customId} (can be referenced with $tinker_outputs.${codeBlock.customId})`);
                }
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
            codeBlockDecorator.setBlockState(codeBlock.id, BlockState.Error);
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
    
    // Register command to clear all block states
    const clearBlockStatesCommand = vscode.commands.registerCommand(
        'tinker-notebook.clearBlockStates',
        () => {
            codeBlockDecorator.resetAllBlockStates();
            
            // Update decorations for active editor
            if (vscode.window.activeTextEditor) {
                updateDecorations(vscode.window.activeTextEditor);
            }
            
            vscode.window.showInformationMessage('All code block states have been reset');
        }
    );
    
    // Register export commands
    const exportAsJsonCommand = vscode.commands.registerCommand(
        'tinker-notebook.exportAsJSON',
        async () => {
            await outputFormatterManager.exportResult('JSON');
        }
    );
    
    const exportAsCsvCommand = vscode.commands.registerCommand(
        'tinker-notebook.exportAsCSV',
        async () => {
            await outputFormatterManager.exportResult('CSV');
        }
    );
    
    const exportAsTextCommand = vscode.commands.registerCommand(
        'tinker-notebook.exportAsText',
        async () => {
            await outputFormatterManager.exportResult('Text');
        }
    );
    
    const toggleCollapsibleCommand = vscode.commands.registerCommand(
        'tinker-notebook.toggleCollapsible',
        () => {
            outputFormatterManager.toggleCollapsible();
        }
    );
    
    // Add commands to subscriptions
    context.subscriptions.push(executeCodeBlockCommand);
    context.subscriptions.push(executeFromDecoratorCommand);
    context.subscriptions.push(showOutputChannelCommand);
    context.subscriptions.push(clearBlockStatesCommand);
    context.subscriptions.push(exportAsJsonCommand);
    context.subscriptions.push(exportAsCsvCommand);
    context.subscriptions.push(exportAsTextCommand);
    context.subscriptions.push(toggleCollapsibleCommand);
    context.subscriptions.push(codeBlockDecorator);
}

// Extension deactivation function
export function deactivate() {
    // Clean up temporary files
    FileUtils.cleanupTempFiles();
    
    // Save block state
    if (blockStateManager) {
        blockStateManager.saveState().catch(err => {
            console.error('Failed to save block state during deactivation:', err);
        });
    }
    
    // Dispose of status bar item if it exists
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
