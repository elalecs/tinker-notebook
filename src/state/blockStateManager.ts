import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ExecutionResult } from '../execution/executor';
import { BlockState, BlockStateEntry, IBlockStateManager } from '../interfaces/blockState.interface';

/**
 * Manages the state of code blocks
 */
export class BlockStateManager implements IBlockStateManager {
    private states: Map<string, BlockStateEntry> = new Map();
    private results: Map<string, ExecutionResult> = new Map();
    private context: vscode.ExtensionContext;
    private stateFile: string | undefined;
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        
        // Set up state file path if workspace is available
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
            this.stateFile = path.join(workspaceFolder, '.tinker-notebook', 'block-state.json');
            
            // Ensure directory exists
            const stateDir = path.dirname(this.stateFile);
            if (!fs.existsSync(stateDir)) {
                fs.mkdirSync(stateDir, { recursive: true });
            }
        }
    }
    
    /**
     * Get the state of a specific block
     * @param blockId The ID of the block
     */
    public getBlockState(blockId: string): BlockStateEntry | undefined {
        return this.states.get(blockId);
    }
    
    /**
     * Set the state of a specific block
     * @param blockId The ID of the block
     * @param state The new state
     * @param result The execution result (if available)
     */
    public setBlockState(blockId: string, state: BlockState, result?: ExecutionResult): void {
        const entry: BlockStateEntry = {
            id: blockId,
            state,
            lastExecutionTime: new Date()
        };
        
        if (result) {
            entry.lastResult = result;
            this.storeResult(blockId, result);
        }
        
        this.states.set(blockId, entry);
        this.saveState().catch(err => {
            console.error('Failed to save block state:', err);
        });
    }
    
    /**
     * Store the result of a block execution
     * @param blockId The ID of the block
     * @param result The execution result
     */
    public storeResult(blockId: string, result: ExecutionResult): void {
        this.results.set(blockId, result);
    }
    
    /**
     * Get the result of a block execution
     * @param blockId The ID of the block
     */
    public getResult(blockId: string): ExecutionResult | undefined {
        return this.results.get(blockId);
    }
    
    /**
     * Get all stored block states
     */
    public getAllStates(): Map<string, BlockStateEntry> {
        return this.states;
    }
    
    /**
     * Clear all block states
     */
    public clearAllStates(): void {
        this.states.clear();
        this.results.clear();
        this.saveState().catch(err => {
            console.error('Failed to save block state after clearing:', err);
        });
    }
    
    /**
     * Save state to persistent storage
     */
    public async saveState(): Promise<void> {
        // Save to workspace storage if available
        if (this.stateFile) {
            try {
                const stateData: Record<string, BlockStateEntry> = {};
                this.states.forEach((state, key) => {
                    stateData[key] = state;
                });
                
                const resultsData: Record<string, ExecutionResult> = {};
                this.results.forEach((result, key) => {
                    resultsData[key] = result;
                });
                
                const saveData = {
                    states: stateData,
                    results: resultsData
                };
                
                // Convert dates to ISO strings for serialization
                const jsonData = JSON.stringify(saveData, (key, value) => {
                    return value instanceof Date ? value.toISOString() : value;
                });
                
                await fs.promises.writeFile(this.stateFile, jsonData, 'utf8');
            } catch (error) {
                console.error('Failed to save state to file:', error);
            }
        }
        
        // Also save to extension context storage
        this.context.workspaceState.update('tinker-notebook.blockStates', Array.from(this.states.entries()));
        this.context.workspaceState.update('tinker-notebook.blockResults', Array.from(this.results.entries()));
    }
    
    /**
     * Load state from persistent storage
     */
    public async loadState(): Promise<void> {
        // First try to load from workspace file
        if (this.stateFile && fs.existsSync(this.stateFile)) {
            try {
                const data = await fs.promises.readFile(this.stateFile, 'utf8');
                const jsonData = JSON.parse(data, (key, value) => {
                    // Convert date strings back to Date objects
                    if (key === 'lastExecutionTime' && typeof value === 'string') {
                        return new Date(value);
                    }
                    return value;
                });
                
                // Load states
                if (jsonData.states) {
                    this.states = new Map(Object.entries(jsonData.states));
                }
                
                // Load results
                if (jsonData.results) {
                    this.results = new Map(Object.entries(jsonData.results));
                }
                
                return;
            } catch (error) {
                console.error('Failed to load state from file:', error);
            }
        }
        
        // Fall back to extension context storage
        const savedStates = this.context.workspaceState.get<[string, BlockStateEntry][]>('tinker-notebook.blockStates');
        if (savedStates) {
            this.states = new Map(savedStates);
        }
        
        const savedResults = this.context.workspaceState.get<[string, ExecutionResult][]>('tinker-notebook.blockResults');
        if (savedResults) {
            this.results = new Map(savedResults);
        }
    }
}