import type { SignedReceipt, SubmitReceiptResponse, TaskCreate, TaskInfo } from './types';
/**
 * HTTP client for the OpenClawScan API.
 * Handles receipt submission, task management, and verification.
 */
export declare class ApiClient {
    private apiUrl;
    private apiKey;
    constructor(apiUrl?: string, apiKey?: string);
    private request;
    /**
     * Submit a signed receipt to the server.
     */
    submitReceipt(receipt: SignedReceipt): Promise<SubmitReceiptResponse>;
    /**
     * Submit multiple receipts in a batch.
     */
    submitBatch(receipts: SignedReceipt[]): Promise<SubmitReceiptResponse[]>;
    /**
     * Create a new task (group of receipts).
     */
    createTask(task: TaskCreate): Promise<TaskInfo>;
    /**
     * Complete a task and get the shareable URL.
     */
    completeTask(taskId: string): Promise<TaskInfo>;
    /**
     * Get task info.
     */
    getTask(taskId: string): Promise<TaskInfo>;
}
