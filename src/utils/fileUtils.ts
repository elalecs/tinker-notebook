import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Utility functions for file operations
 */
export class FileUtils {
    /**
     * Create a temporary directory if it doesn't exist
     * @param dirName The name of the directory to create
     * @returns The path to the temporary directory
     */
    public static createTempDir(dirName: string): string {
        const tempDir = path.join(os.tmpdir(), dirName);
        
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        return tempDir;
    }
    
    /**
     * Create a temporary file with the given content
     * @param content The content to write to the file
     * @param extension The file extension (default: '.tmp')
     * @param tempDirName The name of the temporary directory (default: 'tinker-notebook')
     * @returns The path to the temporary file
     */
    public static createTempFile(content: string, extension: string = '.tmp', tempDirName: string = 'tinker-notebook'): string {
        const tempDir = this.createTempDir(tempDirName);
        const tempFile = path.join(tempDir, `file-${Date.now()}${extension}`);
        
        fs.writeFileSync(tempFile, content);
        
        return tempFile;
    }
    
    /**
     * Delete a file if it exists
     * @param filePath The path to the file to delete
     * @returns True if the file was deleted, false otherwise
     */
    public static deleteFile(filePath: string): boolean {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        
        return false;
    }
    
    /**
     * Clean up temporary files older than the specified age
     * @param tempDirName The name of the temporary directory
     * @param maxAgeMs Maximum age in milliseconds (default: 1 hour)
     * @returns Number of files deleted
     */
    public static cleanupTempFiles(tempDirName: string = 'tinker-notebook', maxAgeMs: number = 60 * 60 * 1000): number {
        const tempDir = path.join(os.tmpdir(), tempDirName);
        
        if (!fs.existsSync(tempDir)) {
            return 0;
        }
        
        const now = Date.now();
        const files = fs.readdirSync(tempDir);
        let deletedCount = 0;
        
        for (const file of files) {
            const filePath = path.join(tempDir, file);
            const stats = fs.statSync(filePath);
            
            // Delete files older than maxAgeMs
            if (now - stats.mtimeMs > maxAgeMs) {
                try {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                } catch (error) {
                    console.error(`Failed to delete temp file: ${filePath}`, error);
                }
            }
        }
        
        return deletedCount;
    }
}
