import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { FileUtils } from '../../../utils/fileUtils';

suite('FileUtils Tests', () => {
    const testTempDirName = 'tinker-notebook-test';
    
    teardown(() => {
        // Clean up test directory after each test
        const testTempDir = path.join(os.tmpdir(), testTempDirName);
        if (fs.existsSync(testTempDir)) {
            const files = fs.readdirSync(testTempDir);
            for (const file of files) {
                fs.unlinkSync(path.join(testTempDir, file));
            }
            fs.rmdirSync(testTempDir);
        }
    });
    
    test('createTempDir should create a directory if it does not exist', () => {
        const tempDir = FileUtils.createTempDir(testTempDirName);
        
        assert.strictEqual(fs.existsSync(tempDir), true);
        assert.strictEqual(tempDir, path.join(os.tmpdir(), testTempDirName));
    });
    
    test('createTempFile should create a file with the given content', () => {
        const content = 'Test content';
        const extension = '.php';
        
        const tempFile = FileUtils.createTempFile(content, extension, testTempDirName);
        
        assert.strictEqual(fs.existsSync(tempFile), true);
        assert.strictEqual(fs.readFileSync(tempFile, 'utf8'), content);
        assert.strictEqual(path.extname(tempFile), extension);
    });
    
    test('deleteFile should delete a file if it exists', () => {
        // Create a test file
        const content = 'Test content';
        const tempFile = FileUtils.createTempFile(content, '.tmp', testTempDirName);
        
        // Verify file exists
        assert.strictEqual(fs.existsSync(tempFile), true);
        
        // Delete the file
        const result = FileUtils.deleteFile(tempFile);
        
        // Verify file was deleted
        assert.strictEqual(result, true);
        assert.strictEqual(fs.existsSync(tempFile), false);
    });
    
    test('deleteFile should return false if file does not exist', () => {
        const nonExistentFile = path.join(os.tmpdir(), 'non-existent-file.txt');
        
        // Make sure file doesn't exist
        if (fs.existsSync(nonExistentFile)) {
            fs.unlinkSync(nonExistentFile);
        }
        
        // Try to delete non-existent file
        const result = FileUtils.deleteFile(nonExistentFile);
        
        // Verify result is false
        assert.strictEqual(result, false);
    });
    
    test('cleanupTempFiles should delete files older than maxAgeMs', async () => {
        // Create test directory
        const testTempDir = FileUtils.createTempDir(testTempDirName);
        
        // Create some test files
        const oldFile = path.join(testTempDir, 'old-file.tmp');
        const newFile = path.join(testTempDir, 'new-file.tmp');
        
        fs.writeFileSync(oldFile, 'Old file content');
        fs.writeFileSync(newFile, 'New file content');
        
        // Set the modification time of the old file to be older than maxAgeMs
        const oldTime = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
        fs.utimesSync(oldFile, oldTime / 1000, oldTime / 1000);
        
        // Clean up files older than 1 hour
        const deletedCount = FileUtils.cleanupTempFiles(testTempDirName, 60 * 60 * 1000);
        
        // Verify old file was deleted but new file remains
        assert.strictEqual(deletedCount, 1);
        assert.strictEqual(fs.existsSync(oldFile), false);
        assert.strictEqual(fs.existsSync(newFile), true);
    });
});
