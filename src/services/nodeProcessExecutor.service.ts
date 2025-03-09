import * as cp from 'child_process';
import { IProcessExecutor } from '../interfaces/processExecutor.interface';
import { ExecutionResult } from '../execution/executor';

export class NodeProcessExecutor implements IProcessExecutor {
  public execute(command: string, args: string[], options?: any): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      try {
        const startTime = Date.now();
        const process = cp.spawn(command, args, options);
        
        let stdout = '';
        let stderr = '';
        
        process.stdout?.on('data', (data: Buffer) => {
          stdout += data.toString();
        });
        
        process.stderr?.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
        
        process.on('close', (code: number | null) => {
          const executionTime = Date.now() - startTime;
          resolve({
            output: stdout,
            error: stderr || undefined,
            exitCode: code || 0,
            executionTime
          });
        });
        
        process.on('error', (err: Error) => {
          const executionTime = Date.now() - startTime;
          resolve({
            output: '',
            error: err.message,
            exitCode: 1,
            executionTime
          });
        });
      } catch (error) {
        resolve({
          output: '',
          error: error instanceof Error ? error.message : String(error),
          exitCode: 1,
          executionTime: 0
        });
      }
    });
  }
  
  public executeCommand(command: string, cwd?: string): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      cp.exec(
        command,
        { cwd },
        (error, stdout, stderr) => {
          const executionTime = Date.now() - startTime;
          resolve({
            output: stdout,
            error: stderr || undefined,
            exitCode: error ? error.code as number || 1 : 0,
            executionTime
          });
        }
      );
    });
  }
}