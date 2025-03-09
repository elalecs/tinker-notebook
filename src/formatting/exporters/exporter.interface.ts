/**
 * Interface for result exporters
 */
export interface IExporter {
    /**
     * Get the format name
     */
    getFormat(): string;
    
    /**
     * Export data to the specified format
     * @param data The data to export
     */
    export(data: any): Promise<void>;
}