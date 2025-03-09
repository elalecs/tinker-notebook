export interface IFileSystem {
  existsSync(path: string): boolean;
  mkdirSync(path: string, options?: any): void;
  readFileSync(path: string, encoding?: BufferEncoding): string | Buffer;
  writeFileSync(path: string, data: string): void;
  unlinkSync(path: string): void;
}