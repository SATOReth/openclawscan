import type { SignedReceipt } from './types';
/**
 * Local receipt backup.
 * Saves every receipt as a JSON line in a daily log file.
 * This ensures the agent owner always has an independent copy
 * of their receipts, regardless of the server.
 *
 * File structure:
 *   ~/.openclawscan/receipts/
 *     2026-02-21.jsonl
 *     2026-02-22.jsonl
 */
export declare class LocalBackup {
    private backupDir;
    constructor(backupDir?: string);
    private ensureDir;
    /**
     * Save a receipt to the local backup.
     * Appends as a single JSON line to today's log file.
     */
    save(receipt: SignedReceipt): void;
    /**
     * Get the backup directory path.
     */
    getPath(): string;
}
