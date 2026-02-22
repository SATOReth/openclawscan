import { mkdirSync, appendFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { SignedReceipt } from './types';

const DEFAULT_BACKUP_DIR = join(homedir(), '.openclawscan', 'receipts');

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
export class LocalBackup {
  private backupDir: string;

  constructor(backupDir?: string) {
    this.backupDir = backupDir || DEFAULT_BACKUP_DIR;
    this.ensureDir();
  }

  private ensureDir(): void {
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Save a receipt to the local backup.
   * Appends as a single JSON line to today's log file.
   */
  save(receipt: SignedReceipt): void {
    try {
      const date = new Date().toISOString().split('T')[0]; // 2026-02-21
      const filePath = join(this.backupDir, `${date}.jsonl`);
      const line = JSON.stringify(receipt) + '\n';
      appendFileSync(filePath, line, 'utf8');
    } catch (err) {
      // Backup failure should never block receipt generation
      console.error('[OpenClawScan] Local backup failed:', err);
    }
  }

  /**
   * Get the backup directory path.
   */
  getPath(): string {
    return this.backupDir;
  }
}
