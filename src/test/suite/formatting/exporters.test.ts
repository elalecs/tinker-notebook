import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MockFactory } from '../../testUtils/mockFactory';
import { JsonExporter } from '../../../formatting/exporters/jsonExporter';
import { CsvExporter } from '../../../formatting/exporters/csvExporter';
import { TextExporter } from '../../../formatting/exporters/textExporter';

suite('Exporters Tests', () => {
  let mockFactory: MockFactory;
  let sandbox: sinon.SinonSandbox;
  
  const testData = {
    name: 'John',
    age: 30,
    roles: ['admin', 'user']
  };
  
  setup(() => {
    mockFactory = new MockFactory();
    sandbox = mockFactory.sandbox;
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('JsonExporter Tests', () => {
    let jsonExporter: JsonExporter;
    
    setup(() => {
      jsonExporter = new JsonExporter();
    });
    
    test('Should return correct format name', () => {
      assert.strictEqual(jsonExporter.getFormat(), 'JSON');
    });
    
    test('Should open save dialog with correct defaults', async () => {
      // Mock the VS Code showSaveDialog
      const showSaveDialogStub = sandbox.stub(vscode.window, 'showSaveDialog').resolves(undefined);
      
      // Mock workspace folders
      sandbox.stub(vscode.workspace, 'workspaceFolders').value([{
        uri: { fsPath: '/test/workspace' },
        name: 'test',
        index: 0
      }]);
      
      await jsonExporter.export(testData);
      
      // Verify save dialog was shown with correct parameters
      sinon.assert.calledOnce(showSaveDialogStub);
      const saveDialogOptions = showSaveDialogStub.firstCall.args[0] as vscode.SaveDialogOptions;
      
      // Should have JSON file filter
      assert.ok(saveDialogOptions.filters && 
                saveDialogOptions.filters['JSON Files'] && 
                saveDialogOptions.filters['JSON Files'].includes('json'));
      
      // Should have correct title
      assert.strictEqual(saveDialogOptions.title, 'Export as JSON');
      
      // Should have correct default URI
      assert.ok(saveDialogOptions.defaultUri!.fsPath.endsWith('tinker-output.json'));
      assert.ok(saveDialogOptions.defaultUri!.fsPath.startsWith('/test/workspace'));
    });
    
    test('Should write JSON file correctly', async () => {
      // Mock the VS Code showSaveDialog to return a file path
      const testFilePath = '/test/output.json';
      sandbox.stub(vscode.window, 'showSaveDialog').resolves({
        fsPath: testFilePath
      } as vscode.Uri);
      
      // Mock fs.promises.writeFile
      const writeFileStub = sandbox.stub(fs.promises, 'writeFile').resolves();
      
      // Mock vscode.window.showInformationMessage
      const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');
      
      await jsonExporter.export(testData);
      
      // Verify file was written
      sinon.assert.calledOnce(writeFileStub);
      sinon.assert.calledWith(writeFileStub, testFilePath, sinon.match.string, 'utf8');
      
      // Verify content is valid JSON
      const jsonContent = writeFileStub.firstCall.args[1] as string;
      const parsed = JSON.parse(jsonContent);
      assert.deepStrictEqual(parsed, testData);
      
      // Verify success message was shown
      sinon.assert.calledOnce(showInfoStub);
    });
    
    test('Should handle error during export', async () => {
      // Mock the VS Code showSaveDialog to return a file path
      sandbox.stub(vscode.window, 'showSaveDialog').resolves({
        fsPath: '/test/output.json'
      } as vscode.Uri);
      
      // Mock fs.promises.writeFile to throw error
      sandbox.stub(fs.promises, 'writeFile').rejects(new Error('Write error'));
      
      // Mock vscode.window.showErrorMessage
      const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');
      
      await jsonExporter.export(testData);
      
      // Verify error message was shown
      sinon.assert.calledOnce(showErrorStub);
      sinon.assert.calledWith(showErrorStub, sinon.match(/Failed to export/));
    });
  });

  suite('CsvExporter Tests', () => {
    let csvExporter: CsvExporter;
    
    setup(() => {
      csvExporter = new CsvExporter();
    });
    
    test('Should return correct format name', () => {
      assert.strictEqual(csvExporter.getFormat(), 'CSV');
    });
    
    test('Should convert array of objects to CSV', async () => {
      // Mock the VS Code showSaveDialog to return a file path
      const testFilePath = '/test/output.csv';
      sandbox.stub(vscode.window, 'showSaveDialog').resolves({
        fsPath: testFilePath
      } as vscode.Uri);
      
      // Mock fs.promises.writeFile
      const writeFileStub = sandbox.stub(fs.promises, 'writeFile').resolves();
      
      const arrayData = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];
      
      await csvExporter.export(arrayData);
      
      // Verify file was written
      sinon.assert.calledOnce(writeFileStub);
      
      // Verify content is valid CSV
      const csvContent = writeFileStub.firstCall.args[1] as string;
      const lines = csvContent.trim().split('\n');
      
      // Should have header and two data rows
      assert.strictEqual(lines.length, 3);
      assert.ok(lines[0].includes('name') && lines[0].includes('age'));
      assert.ok(lines[1].includes('John') && lines[1].includes('30'));
      assert.ok(lines[2].includes('Jane') && lines[2].includes('25'));
    });
    
    test('Should convert single object to CSV', async () => {
      // Mock the VS Code showSaveDialog to return a file path
      sandbox.stub(vscode.window, 'showSaveDialog').resolves({
        fsPath: '/test/output.csv'
      } as vscode.Uri);
      
      // Mock fs.promises.writeFile
      const writeFileStub = sandbox.stub(fs.promises, 'writeFile').resolves();
      
      await csvExporter.export(testData);
      
      // Verify content is valid CSV
      const csvContent = writeFileStub.firstCall.args[1] as string;
      const lines = csvContent.trim().split('\n');
      
      // Should have header and one data row
      assert.strictEqual(lines.length, 2);
      assert.ok(lines[0].includes('name') && lines[0].includes('age') && lines[0].includes('roles'));
      assert.ok(lines[1].includes('John') && lines[1].includes('30') && lines[1].includes('['));
    });
  });

  suite('TextExporter Tests', () => {
    let textExporter: TextExporter;
    
    setup(() => {
      textExporter = new TextExporter();
    });
    
    test('Should return correct format name', () => {
      assert.strictEqual(textExporter.getFormat(), 'Text');
    });
    
    test('Should handle string input', async () => {
      // Mock the VS Code showSaveDialog to return a file path
      sandbox.stub(vscode.window, 'showSaveDialog').resolves({
        fsPath: '/test/output.txt'
      } as vscode.Uri);
      
      // Mock fs.promises.writeFile
      const writeFileStub = sandbox.stub(fs.promises, 'writeFile').resolves();
      
      const stringData = 'Hello, world!';
      
      await textExporter.export(stringData);
      
      // Verify content is unchanged
      const textContent = writeFileStub.firstCall.args[1] as string;
      assert.strictEqual(textContent, stringData);
    });
    
    test('Should convert object to formatted JSON text', async () => {
      // Mock the VS Code showSaveDialog to return a file path
      sandbox.stub(vscode.window, 'showSaveDialog').resolves({
        fsPath: '/test/output.txt'
      } as vscode.Uri);
      
      // Mock fs.promises.writeFile
      const writeFileStub = sandbox.stub(fs.promises, 'writeFile').resolves();
      
      await textExporter.export(testData);
      
      // Verify content is formatted JSON
      const textContent = writeFileStub.firstCall.args[1] as string;
      
      // Should be properly indented
      assert.ok(textContent.includes('  "name": "John"'));
      assert.ok(textContent.includes('  "age": 30'));
      
      // Should be valid JSON
      const parsed = JSON.parse(textContent);
      assert.deepStrictEqual(parsed, testData);
    });
    
    test('Should handle null/undefined input', async () => {
      // Mock the VS Code showSaveDialog to return a file path
      sandbox.stub(vscode.window, 'showSaveDialog').resolves({
        fsPath: '/test/output.txt'
      } as vscode.Uri);
      
      // Mock fs.promises.writeFile
      const writeFileStub = sandbox.stub(fs.promises, 'writeFile').resolves();
      
      await textExporter.export(null);
      
      // Verify content is empty string
      const textContent = writeFileStub.firstCall.args[1] as string;
      assert.strictEqual(textContent, '');
    });
  });
});