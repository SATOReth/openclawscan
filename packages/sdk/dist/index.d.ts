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
import { type ReceiptInput } from './receipt';
import type { OpenClawScanConfig, SignedReceipt, TaskCreate, TaskInfo } from './types';
export declare class OpenClawScan {
    private builder;
    private backup;
    private api;
    private config;
    private activeTaskId;
    constructor(config: OpenClawScanConfig);
    /**
     * Capture an action and generate a signed receipt.
     * The receipt is saved locally and optionally sent to the server.
     */
    capture(input: ReceiptInput): Promise<SignedReceipt>;
    /**
     * Capture an action synchronously (no server submission).
     * Useful for high-frequency actions where you don't want to wait for HTTP.
     */
    captureSync(input: ReceiptInput): SignedReceipt;
    /**
     * Start a new task. All subsequent receipts will be grouped under this task.
     */
    startTask(task: TaskCreate): Promise<TaskInfo>;
    /**
     * Complete the active task and get a shareable link.
     */
    completeTask(): Promise<TaskInfo>;
    /**
     * Get current session ID.
     */
    getSessionId(): string;
    /**
     * Start a new session.
     */
    newSession(): string;
    /**
     * Get the local backup path.
     */
    getBackupPath(): string;
    /**
     * Verify a signed receipt (static method — no instance needed).
     * Anyone can verify a receipt without an API key or server.
     */
    static verify(receipt: SignedReceipt, originalOutput?: string): {
        signatureValid: boolean;
        hashMatch: boolean | null;
    };
}
export { generateKeyPair, serializeKeyPair, deserializeKeyPair, publicKeyFromSecret, sha256, verifySignature, verifyHash, verifyReceipt, } from './crypto';
export { ReceiptBuilder, generateReceiptId, generateSessionId } from './receipt';
export { LocalBackup } from './backup';
export { ApiClient } from './api';
export type { SignedReceipt, ReceiptPayload, ReceiptAction, ReceiptModel, ReceiptCost, ReceiptHashes, ReceiptContext, ReceiptSignature, KeyPair, SerializedKeyPair, OpenClawScanConfig, SubmitReceiptResponse, VerifyResult, ActionType, Visibility, TaskCreate, TaskInfo, } from './types';
export type { ReceiptInput } from './receipt';
