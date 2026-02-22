"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalBackup = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const DEFAULT_BACKUP_DIR = (0, path_1.join)((0, os_1.homedir)(), '.openclawscan', 'receipts');
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
class LocalBackup {
    constructor(backupDir) {
        this.backupDir = backupDir || DEFAULT_BACKUP_DIR;
        this.ensureDir();
    }
    ensureDir() {
        if (!(0, fs_1.existsSync)(this.backupDir)) {
            (0, fs_1.mkdirSync)(this.backupDir, { recursive: true });
        }
    }
    /**
     * Save a receipt to the local backup.
     * Appends as a single JSON line to today's log file.
     */
    save(receipt) {
        try {
            const date = new Date().toISOString().split('T')[0]; // 2026-02-21
            const filePath = (0, path_1.join)(this.backupDir, `${date}.jsonl`);
            const line = JSON.stringify(receipt) + '\n';
            (0, fs_1.appendFileSync)(filePath, line, 'utf8');
        }
        catch (err) {
            // Backup failure should never block receipt generation
            console.error('[OpenClawScan] Local backup failed:', err);
        }
    }
    /**
     * Get the backup directory path.
     */
    getPath() {
        return this.backupDir;
    }
}
exports.LocalBackup = LocalBackup;
