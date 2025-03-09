import * as vscode from 'vscode';
import { IFileSystem } from '../interfaces/fileSystem.interface';
import { IProcessExecutor } from '../interfaces/processExecutor.interface';
import { ILaravelManager } from '../interfaces/laravelManager.interface';
import { NodeFileSystem } from './nodeFileSystem.service';
import { NodeProcessExecutor } from './nodeProcessExecutor.service';
import { LaravelManager } from '../laravel/manager';

export class ServiceFactory {
  public static createFileSystem(): IFileSystem {
    return new NodeFileSystem();
  }
  
  public static createProcessExecutor(): IProcessExecutor {
    return new NodeProcessExecutor();
  }
  
  public static createLaravelManager(
    workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined,
    fileSystem?: IFileSystem,
    outputChannel?: vscode.OutputChannel
  ): ILaravelManager {
    return new LaravelManager(
      workspaceFolders,
      fileSystem || this.createFileSystem(),
      outputChannel
    ) as ILaravelManager;
  }
}