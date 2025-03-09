import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import { CodeExecutor, ExecutionResult } from '../../../execution/executor';

suite('CodeExecutor Tests', () => {
    let executor: CodeExecutor;
    let outputChannel: vscode.OutputChannel;
    let diagnosticCollection: vscode.DiagnosticCollection;
    
    setup(() => {
        // Create mock output channel
        outputChannel = {
            name: 'Test Output Channel',
            append: sinon.stub(),
            appendLine: sinon.stub(),
            clear: sinon.stub(),
            show: sinon.stub(),
            hide: sinon.stub(),
            dispose: sinon.stub()
        } as unknown as vscode.OutputChannel;
        
        // Create mock diagnostic collection
        diagnosticCollection = {
            name: 'Test Diagnostic Collection',
            set: sinon.stub(),
            delete: sinon.stub(),
            clear: sinon.stub(),
            forEach: sinon.stub(),
            get: sinon.stub(),
            has: sinon.stub(),
            dispose: sinon.stub()
        } as unknown as vscode.DiagnosticCollection;
        
        // Create executor with mock dependencies
        executor = new CodeExecutor(outputChannel, diagnosticCollection);
    });
    
    test('executeCode should add PHP opening tag if not present', async () => {
        // Create a spy on the private method using any
        const createTempCodeFileSpy = sinon.spy((executor as any), 'createTempCodeFile');
        
        // Mock the executePhp method to avoid actual execution
        const executePhpStub = sinon.stub((executor as any), 'executePhp').resolves({
            output: 'Test output',
            exitCode: 0
        });
        
        // Execute code without PHP opening tag
        const code = 'echo "Hello, World!";';
        await executor.executeCode(code);
        
        // Verify that createTempCodeFile was called with the original code
        // The method itself will add the PHP tag internally
        assert.strictEqual(createTempCodeFileSpy.calledOnce, true);
        assert.strictEqual(createTempCodeFileSpy.firstCall.args[0], code);
        
        // Restore stubs
        createTempCodeFileSpy.restore();
        executePhpStub.restore();
    });
    
    test('executeCode should not add PHP opening tag if already present', async () => {
        // Create a spy on the private method using any
        const createTempCodeFileSpy = sinon.spy((executor as any), 'createTempCodeFile');
        
        // Mock the executePhp method to avoid actual execution
        const executePhpStub = sinon.stub((executor as any), 'executePhp').resolves({
            output: 'Test output',
            exitCode: 0
        });
        
        // Execute code with PHP opening tag
        const code = '<?php\necho "Hello, World!";';
        await executor.executeCode(code);
        
        // Verify that PHP opening tag was not added again
        assert.strictEqual(createTempCodeFileSpy.calledOnce, true);
        assert.strictEqual(createTempCodeFileSpy.firstCall.args[0], '<?php\necho "Hello, World!";');
        
        // Restore stubs
        createTempCodeFileSpy.restore();
        executePhpStub.restore();
    });
    
    test('showResult should display output in the output channel', () => {
        // Create mock result
        const result: ExecutionResult = {
            output: 'Test output',
            exitCode: 0,
            executionTime: 100
        };
        
        // Create mock document and range
        const document = {
            uri: vscode.Uri.parse('file:///test.md')
        } as vscode.TextDocument;
        
        const range = new vscode.Range(0, 0, 1, 0);
        
        // Show result
        executor.showResult(result, document, range);
        
        // Verify output channel was used correctly
        assert.strictEqual((outputChannel.clear as sinon.SinonStub).calledOnce, true);
        assert.strictEqual((outputChannel.appendLine as sinon.SinonStub).called, true);
        assert.strictEqual((outputChannel.show as sinon.SinonStub).calledOnce, true);
        
        // Verify diagnostics were cleared (no error)
        assert.strictEqual((diagnosticCollection.delete as sinon.SinonStub).calledOnce, true);
    });
    
    test('showResult should add diagnostic for error', () => {
        // Create mock result with error
        const result: ExecutionResult = {
            output: '',
            error: 'Test error message',
            exitCode: 1,
            executionTime: 100
        };
        
        // Create mock document and range
        const document = {
            uri: vscode.Uri.parse('file:///test.md')
        } as vscode.TextDocument;
        
        const range = new vscode.Range(0, 0, 1, 0);
        
        // Show result
        executor.showResult(result, document, range);
        
        // Verify output channel was used correctly
        assert.strictEqual((outputChannel.clear as sinon.SinonStub).calledOnce, true);
        assert.strictEqual((outputChannel.appendLine as sinon.SinonStub).called, true);
        assert.strictEqual((outputChannel.show as sinon.SinonStub).calledOnce, true);
        
        // Verify diagnostic was set for error
        assert.strictEqual((diagnosticCollection.set as sinon.SinonStub).calledOnce, true);
        
        // Verify diagnostic was created with correct severity
        const diagnostic = (diagnosticCollection.set as sinon.SinonStub).firstCall.args[1][0];
        assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
        assert.strictEqual(diagnostic.message, 'Test error message');
    });
});
