import * as vscode from 'vscode';
import { IFileSystem } from '../interfaces/fileSystem.interface';
import { IProcessExecutor } from '../interfaces/processExecutor.interface';
import { ILaravelManager } from '../interfaces/laravelManager.interface';
import { IBlockStateManager } from '../interfaces/blockState.interface';
import { NodeFileSystem } from './nodeFileSystem.service';
import { NodeProcessExecutor } from './nodeProcessExecutor.service';
import { LaravelManager } from '../laravel/manager';
import { BlockStateManager } from '../state/blockStateManager';
import { ResultReferenceProcessor } from '../state/resultReferenceProcessor';

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
    outputChannel?: vscode.OutputChannel,
    processExecutor?: IProcessExecutor
  ): ILaravelManager {
    const fs = fileSystem || this.createFileSystem();
    const executor = processExecutor || this.createProcessExecutor();
    
    return new LaravelManager(
      workspaceFolders,
      fs,
      outputChannel,
      executor
    ) as ILaravelManager;
  }
  
  /**
   * Create a block state manager
   * @param context The extension context
   * @returns An instance of IBlockStateManager
   */
  public static createBlockStateManager(
    context: vscode.ExtensionContext
  ): IBlockStateManager {
    return new BlockStateManager(context);
  }
  
  /**
   * Create a result reference processor
   * @param stateManager The block state manager
   * @returns A ResultReferenceProcessor instance
   */
  public static createResultReferenceProcessor(
    stateManager: IBlockStateManager
  ): ResultReferenceProcessor {
    return new ResultReferenceProcessor(stateManager);
  }
}