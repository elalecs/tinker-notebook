import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { IFileSystem } from '../../interfaces/fileSystem.interface';
import { IProcessExecutor } from '../../interfaces/processExecutor.interface';
import { ILaravelManager } from '../../interfaces/laravelManager.interface';
import { ExecutionResult } from '../../execution/executor';

export class MockFactory {
  public sandbox: sinon.SinonSandbox;

  constructor() {
    this.sandbox = sinon.createSandbox();
  }

  public createMockFileSystem(): IFileSystem {
    // Create an object first, then add stubs to it
    const mockFileSystem = {} as IFileSystem;
    
    // Add stubs with actual sinon stub methods
    mockFileSystem.existsSync = this.sandbox.stub().returns(true);
    mockFileSystem.mkdirSync = this.sandbox.stub();
    mockFileSystem.readFileSync = this.sandbox.stub().returns('mock content');
    mockFileSystem.writeFileSync = this.sandbox.stub();
    mockFileSystem.unlinkSync = this.sandbox.stub();
    
    return mockFileSystem;
  }

  public createMockProcessExecutor(): IProcessExecutor {
    // Create an object first, then add stubs to it
    const mockProcessExecutor = {} as IProcessExecutor;
    
    // Add stubs with actual sinon stub methods
    mockProcessExecutor.execute = this.sandbox.stub().resolves({
      output: 'Mock execution output',
      error: undefined,
      exitCode: 0,
      executionTime: 100
    });
    
    mockProcessExecutor.executeCommand = this.sandbox.stub().resolves({
      output: 'Mock command output',
      error: undefined,
      exitCode: 0,
      executionTime: 100
    });
    
    return mockProcessExecutor;
  }

  public createMockLaravelManager(): ILaravelManager {
    // Create an object first, then add stubs to it
    const mockLaravelManager = {} as ILaravelManager;
    
    // Add stubs with actual sinon stub methods
    mockLaravelManager.getLaravelProject = this.sandbox.stub().resolves('/mock/laravel/path');
    
    return mockLaravelManager;
  }

  public createMockOutputChannel(): vscode.OutputChannel {
    return {
      name: 'Mock Output Channel',
      append: this.sandbox.stub(),
      appendLine: this.sandbox.stub(),
      clear: this.sandbox.stub(),
      show: this.sandbox.stub(),
      hide: this.sandbox.stub(),
      dispose: this.sandbox.stub()
    } as unknown as vscode.OutputChannel;
  }

  public createMockDiagnosticCollection(): vscode.DiagnosticCollection {
    return {
      name: 'Mock Diagnostic Collection',
      set: this.sandbox.stub(),
      delete: this.sandbox.stub(),
      clear: this.sandbox.stub(),
      forEach: this.sandbox.stub(),
      get: this.sandbox.stub(),
      has: this.sandbox.stub(),
      dispose: this.sandbox.stub()
    } as unknown as vscode.DiagnosticCollection;
  }

  public restore(): void {
    this.sandbox.restore();
  }
}