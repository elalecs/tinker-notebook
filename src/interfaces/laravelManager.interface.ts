export interface ILaravelManager {
  getLaravelProject(filePath: string): Promise<string | null>;
}