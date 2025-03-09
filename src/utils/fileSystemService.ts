import * as fs from 'fs';
import { IFileSystem } from '../interfaces/fileSystem.interface';

// Mantener la interfaz original por compatibilidad
export interface FileSystemService extends IFileSystem {}

export class NodeFileSystemService implements FileSystemService {
  existsSync(path: string): boolean {
    return fs.existsSync(path);
  }

  mkdirSync(path: string, options?: fs.MakeDirectoryOptions): void {
    fs.mkdirSync(path, options);
  }

  readFileSync(path: string, encoding?: BufferEncoding): string | Buffer {
    return fs.readFileSync(path, encoding);
  }

  writeFileSync(path: string, data: string): void {
    fs.writeFileSync(path, data);
  }
  
  unlinkSync(path: string): void {
    fs.unlinkSync(path);
  }
}
