"use strict";
/**
 * OpenClawScan SDK
 *
 * Cryptographically signed receipts for AI agent actions.
 *
 * Usage:
 *
 *   import { OpenClawScan, generateKeyPair, serializeKeyPair } from '@openclawscan/sdk';
 *
 *   // First time: generate keys
 *   const keys = generateKeyPair();
 *   const serialized = serializeKeyPair(keys);
 *   // Save serialized.secretKey securely!
 *
 *   // Initialize
 *   const scanner = new OpenClawScan({
 *     agentId: 'my-agent',
 *     ownerId: 'github:myuser',
 *     secretKey: serialized.secretKey,
 *   });
 *
 *   // Generate a receipt
 *   const receipt = scanner.capture({
 *     action: { type: 'tool_call', name: 'web_search', duration_ms: 1200 },
 *     model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 500, tokens_out: 1200 },
 *     cost: { amount_usd: 0.015 },
 *     input: 'search query text',
 *     output: 'search results text',
 *   });
 *
 *   // Verify a receipt
 *   const result = OpenClawScan.verify(receipt, 'search results text');
 *   // { signatureValid: true, hashMatch: true }
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = exports.LocalBackup = exports.generateSessionId = exports.generateReceiptId = exports.ReceiptBuilder = exports.verifyReceipt = exports.verifyHash = exports.verifySignature = exports.sha256 = exports.publicKeyFromSecret = exports.deserializeKeyPair = exports.serializeKeyPair = exports.generateKeyPair = exports.OpenClawScan = void 0;
const receipt_1 = require("./receipt");
const backup_1 = require("./backup");
const api_1 = require("./api");
const crypto_1 = require("./crypto");
class OpenClawScan {
    constructor(config) {
        this.activeTaskId = null;
        this.config = config;
        this.builder = new receipt_1.ReceiptBuilder({
            agentId: config.agentId,
            ownerId: config.ownerId,
            secretKey: config.secretKey,
            defaultVisibility: config.defaultVisibility,
        });
        this.backup = new backup_1.LocalBackup(config.localBackupPath);
        this.api = new api_1.ApiClient(config.apiUrl, config.apiKey);
    }
    /**
     * Capture an action and generate a signed receipt.
     * The receipt is saved locally and optionally sent to the server.
     */
    async capture(input) {
        // If there's an active task, attach it
        if (this.activeTaskId && !input.task_id) {
            input.task_id = this.activeTaskId;
        }
        // Build and sign the receipt
        const receipt = this.builder.build(input);
        // Save locally (always, as backup)
        this.backup.save(receipt);
        // Send to server (if API key is configured)
        if (this.config.apiKey) {
            try {
                const response = await this.api.submitReceipt(receipt);
                receipt.server_received_at = response.server_received_at;
            }
            catch (err) {
                console.error('[OpenClawScan] Failed to submit receipt to server:', err);
                // Receipt is still valid locally — server submission is best-effort
            }
        }
        // Callback
        if (this.config.onReceipt) {
            this.config.onReceipt(receipt);
        }
        return receipt;
    }
    /**
     * Capture an action synchronously (no server submission).
     * Useful for high-frequency actions where you don't want to wait for HTTP.
     */
    captureSync(input) {
        if (this.activeTaskId && !input.task_id) {
            input.task_id = this.activeTaskId;
        }
        const receipt = this.builder.build(input);
        this.backup.save(receipt);
        if (this.config.onReceipt) {
            this.config.onReceipt(receipt);
        }
        return receipt;
    }
    /**
     * Start a new task. All subsequent receipts will be grouped under this task.
     */
    async startTask(task) {
        const info = await this.api.createTask(task);
        this.activeTaskId = info.task_id;
        return info;
    }
    /**
     * Complete the active task and get a shareable link.
     */
    async completeTask() {
        if (!this.activeTaskId) {
            throw new Error('No active task to complete');
        }
        const info = await this.api.completeTask(this.activeTaskId);
        this.activeTaskId = null;
        return info;
    }
    /**
     * Get current session ID.
     */
    getSessionId() {
        return this.builder.getSessionId();
    }
    /**
     * Start a new session.
     */
    newSession() {
        return this.builder.newSession();
    }
    /**
     * Get the local backup path.
     */
    getBackupPath() {
        return this.backup.getPath();
    }
    /**
     * Verify a signed receipt (static method — no instance needed).
     * Anyone can verify a receipt without an API key or server.
     */
    static verify(receipt, originalOutput) {
        return (0, crypto_1.verifyReceipt)(receipt, originalOutput);
    }
}
exports.OpenClawScan = OpenClawScan;
// ─── Re-exports ───────────────────────────────────────────
var crypto_2 = require("./crypto");
Object.defineProperty(exports, "generateKeyPair", { enumerable: true, get: function () { return crypto_2.generateKeyPair; } });
Object.defineProperty(exports, "serializeKeyPair", { enumerable: true, get: function () { return crypto_2.serializeKeyPair; } });
Object.defineProperty(exports, "deserializeKeyPair", { enumerable: true, get: function () { return crypto_2.deserializeKeyPair; } });
Object.defineProperty(exports, "publicKeyFromSecret", { enumerable: true, get: function () { return crypto_2.publicKeyFromSecret; } });
Object.defineProperty(exports, "sha256", { enumerable: true, get: function () { return crypto_2.sha256; } });
Object.defineProperty(exports, "verifySignature", { enumerable: true, get: function () { return crypto_2.verifySignature; } });
Object.defineProperty(exports, "verifyHash", { enumerable: true, get: function () { return crypto_2.verifyHash; } });
Object.defineProperty(exports, "verifyReceipt", { enumerable: true, get: function () { return crypto_2.verifyReceipt; } });
var receipt_2 = require("./receipt");
Object.defineProperty(exports, "ReceiptBuilder", { enumerable: true, get: function () { return receipt_2.ReceiptBuilder; } });
Object.defineProperty(exports, "generateReceiptId", { enumerable: true, get: function () { return receipt_2.generateReceiptId; } });
Object.defineProperty(exports, "generateSessionId", { enumerable: true, get: function () { return receipt_2.generateSessionId; } });
var backup_2 = require("./backup");
Object.defineProperty(exports, "LocalBackup", { enumerable: true, get: function () { return backup_2.LocalBackup; } });
var api_2 = require("./api");
Object.defineProperty(exports, "ApiClient", { enumerable: true, get: function () { return api_2.ApiClient; } });
