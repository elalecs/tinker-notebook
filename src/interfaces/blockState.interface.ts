import { ExecutionResult } from '../execution/executor';

/**
 * Enum for the possible states of a code block
 */
export enum BlockState {
    NotExecuted = 'not_executed',
    Executing = 'executing',
    Success = 'success',
    Error = 'error'
}

/**
 * Interface for a code block state entry
 */
export interface BlockStateEntry {
    id: string;
    state: BlockState;
    lastResult?: ExecutionResult;
    lastExecutionTime?: Date;
}

/**
 * Interface for a block state manager
 */
export interface IBlockStateManager {
    /**
     * Get the state of a specific block
     * @param blockId The ID of the block
     */
    getBlockState(blockId: string): BlockStateEntry | undefined;
    
    /**
     * Set the state of a specific block
     * @param blockId The ID of the block
     * @param state The new state
     * @param result The execution result (if available)
     */
    setBlockState(blockId: string, state: BlockState, result?: ExecutionResult): void;
    
    /**
     * Store the result of a block execution
     * @param blockId The ID of the block
     * @param result The execution result
     */
    storeResult(blockId: string, result: ExecutionResult): void;
    
    /**
     * Get the result of a block execution
     * @param blockId The ID of the block
     */
    getResult(blockId: string): ExecutionResult | undefined;
    
    /**
     * Get all stored block states
     */
    getAllStates(): Map<string, BlockStateEntry>;
    
    /**
     * Clear all block states
     */
    clearAllStates(): void;
    
    /**
     * Save state to persistent storage
     */
    saveState(): Promise<void>;
    
    /**
     * Load state from persistent storage
     */
    loadState(): Promise<void>;
}