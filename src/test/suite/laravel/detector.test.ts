import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import { LaravelDetector } from '../../../laravel/detector';

suite('LaravelDetector Tests', () => {
    let sandbox: sinon.SinonSandbox;
    
    setup(() => {
        // Create a sandbox for managing stubs
        sandbox = sinon.createSandbox();
    });
    
    teardown(() => {
        // Restore all stubs
        sandbox.restore();
    });
    
    test('isLaravelProject should return false if artisan file does not exist', () => {
        // Stub fs.existsSync to return false for artisan
        const existsSyncStub = sandbox.stub(fs, 'existsSync');
        existsSyncStub.withArgs(sinon.match(/artisan$/)).returns(false);
        
        const result = LaravelDetector.isLaravelProject('/fake/path');
        assert.strictEqual(result, false);
    });
    
    test('isLaravelProject should return false if composer.json does not exist', () => {
        // Stub fs.existsSync to return true for artisan but false for composer.json
        const existsSyncStub = sandbox.stub(fs, 'existsSync');
        existsSyncStub.withArgs(sinon.match(/artisan$/)).returns(true);
        existsSyncStub.withArgs(sinon.match(/composer\.json$/)).returns(false);
        
        const result = LaravelDetector.isLaravelProject('/fake/path');
        assert.strictEqual(result, false);
    });
    
    test('isLaravelProject should return true if composer.json contains laravel/framework', () => {
        // Stub fs.existsSync to return true for both files
        const existsSyncStub = sandbox.stub(fs, 'existsSync').returns(true);
        
        // Stub fs.readFileSync to return a valid composer.json
        const readFileSyncStub = sandbox.stub(fs, 'readFileSync').returns(JSON.stringify({
            require: {
                'laravel/framework': '^8.0'
            }
        }));
        
        const result = LaravelDetector.isLaravelProject('/fake/path');
        assert.strictEqual(result, true);
    });
    
    test('isLaravelProject should return true if composer.json name is laravel/laravel', () => {
        // Stub fs.existsSync to return true for both files
        const existsSyncStub = sandbox.stub(fs, 'existsSync').returns(true);
        
        // Stub fs.readFileSync to return a valid composer.json
        const readFileSyncStub = sandbox.stub(fs, 'readFileSync').returns(JSON.stringify({
            name: 'laravel/laravel',
            require: {}
        }));
        
        const result = LaravelDetector.isLaravelProject('/fake/path');
        assert.strictEqual(result, true);
    });
    
    test('isLaravelProject should return false if composer.json does not contain Laravel', () => {
        // Stub fs.existsSync to return true for both files
        const existsSyncStub = sandbox.stub(fs, 'existsSync').returns(true);
        
        // Stub fs.readFileSync to return a non-Laravel composer.json
        const readFileSyncStub = sandbox.stub(fs, 'readFileSync').returns(JSON.stringify({
            name: 'other/project',
            require: {
                'symfony/symfony': '^5.0'
            }
        }));
        
        const result = LaravelDetector.isLaravelProject('/fake/path');
        assert.strictEqual(result, false);
    });
    
    test('isLaravelProject should handle JSON parse errors', () => {
        // Stub fs.existsSync to return true for both files
        const existsSyncStub = sandbox.stub(fs, 'existsSync').returns(true);
        
        // Stub fs.readFileSync to return invalid JSON
        const readFileSyncStub = sandbox.stub(fs, 'readFileSync').returns('invalid json');
        
        // Stub console.error to avoid test output pollution
        const consoleErrorStub = sandbox.stub(console, 'error');
        
        const result = LaravelDetector.isLaravelProject('/fake/path');
        assert.strictEqual(result, false);
        assert.strictEqual(consoleErrorStub.calledOnce, true);
    });
    
    test('findLaravelProjects should return empty array if no workspace folders', () => {
        // Stub vscode.workspace.workspaceFolders to be undefined
        sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);
        
        const result = LaravelDetector.findLaravelProjects();
        assert.deepStrictEqual(result, []);
    });
    
    test('findLaravelProjects should detect Laravel projects in workspace folders', () => {
        // Create mock workspace folders
        const mockWorkspaceFolders = [
            { uri: { fsPath: '/workspace/project1' } },
            { uri: { fsPath: '/workspace/project2' } }
        ];
        
        // Stub vscode.workspace.workspaceFolders
        sandbox.stub(vscode.workspace, 'workspaceFolders').value(mockWorkspaceFolders);
        
        // Stub isLaravelProject to return true for project1 and false for project2
        const isLaravelProjectStub = sandbox.stub(LaravelDetector, 'isLaravelProject');
        isLaravelProjectStub.withArgs('/workspace/project1').returns(true);
        isLaravelProjectStub.withArgs('/workspace/project2').returns(false);
        
        // Stub fs.readdirSync and fs.statSync for subdirectory check
        const readdirSyncStub = sandbox.stub(fs, 'readdirSync');
        // Use proper Dirent objects for directory entries
        const mockDirents = ['subdir1', 'subdir2'].map(name => {
            return {
                name,
                isDirectory: () => true,
                isFile: () => false,
                isBlockDevice: () => false,
                isCharacterDevice: () => false,
                isSymbolicLink: () => false,
                isFIFO: () => false,
                isSocket: () => false
            } as fs.Dirent;
        });
        readdirSyncStub.returns(mockDirents);
        
        const statSyncStub = sandbox.stub(fs, 'statSync');
        statSyncStub.returns({ isDirectory: () => true } as fs.Stats);
        
        // Make subdir2 in project2 a Laravel project
        isLaravelProjectStub.withArgs('/workspace/project2/subdir1').returns(false);
        isLaravelProjectStub.withArgs('/workspace/project2/subdir2').returns(true);
        
        const result = LaravelDetector.findLaravelProjects();
        assert.deepStrictEqual(result, ['/workspace/project1', '/workspace/project2/subdir2']);
    });
    
    test('getNearestLaravelProject should return null if no Laravel projects found', () => {
        // Stub findLaravelProjects to return empty array
        sandbox.stub(LaravelDetector, 'findLaravelProjects').returns([]);
        
        const result = LaravelDetector.getNearestLaravelProject('/some/file/path');
        assert.strictEqual(result, null);
    });
    
    test('getNearestLaravelProject should return project containing the file', () => {
        // Stub findLaravelProjects to return some projects
        sandbox.stub(LaravelDetector, 'findLaravelProjects').returns([
            '/workspace/project1',
            '/workspace/project2'
        ]);
        
        // Test with a file in project2
        const result = LaravelDetector.getNearestLaravelProject('/workspace/project2/app/file.php');
        assert.strictEqual(result, '/workspace/project2');
    });
    
    test('getNearestLaravelProject should prioritize more specific paths', () => {
        // Stub findLaravelProjects to return nested projects
        sandbox.stub(LaravelDetector, 'findLaravelProjects').returns([
            '/workspace/project',
            '/workspace/project/subproject'
        ]);
        
        // Test with a file in the subproject
        const result = LaravelDetector.getNearestLaravelProject('/workspace/project/subproject/app/file.php');
        assert.strictEqual(result, '/workspace/project/subproject');
    });
});
