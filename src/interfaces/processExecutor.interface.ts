import { ExecutionResult } from '../execution/executor';

export interface IProcessExecutor {
  execute(command: string, args: string[], options?: any): Promise<ExecutionResult>;
  executeCommand(command: string, cwd?: string): Promise<ExecutionResult>;
}