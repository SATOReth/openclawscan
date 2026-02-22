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

import { ReceiptBuilder, type ReceiptInput } from './receipt';
import { LocalBackup } from './backup';
import { ApiClient } from './api';
import { verifyReceipt } from './crypto';
import type {
  OpenClawScanConfig,
  SignedReceipt,
  TaskCreate,
  TaskInfo,
} from './types';

export class OpenClawScan {
  private builder: ReceiptBuilder;
  private backup: LocalBackup;
  private api: ApiClient;
  private config: OpenClawScanConfig;
  private activeTaskId: string | null = null;

  constructor(config: OpenClawScanConfig) {
    this.config = config;

    this.builder = new ReceiptBuilder({
      agentId: config.agentId,
      ownerId: config.ownerId,
      secretKey: config.secretKey,
      defaultVisibility: config.defaultVisibility,
    });

    this.backup = new LocalBackup(config.localBackupPath);
    this.api = new ApiClient(config.apiUrl, config.apiKey);
  }

  /**
   * Capture an action and generate a signed receipt.
   * The receipt is saved locally and optionally sent to the server.
   */
  async capture(input: ReceiptInput): Promise<SignedReceipt> {
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
      } catch (err) {
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
  captureSync(input: ReceiptInput): SignedReceipt {
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
  async startTask(task: TaskCreate): Promise<TaskInfo> {
    const info = await this.api.createTask(task);
    this.activeTaskId = info.task_id;
    return info;
  }

  /**
   * Complete the active task and get a shareable link.
   */
  async completeTask(): Promise<TaskInfo> {
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
  getSessionId(): string {
    return this.builder.getSessionId();
  }

  /**
   * Start a new session.
   */
  newSession(): string {
    return this.builder.newSession();
  }

  /**
   * Get the local backup path.
   */
  getBackupPath(): string {
    return this.backup.getPath();
  }

  /**
   * Verify a signed receipt (static method — no instance needed).
   * Anyone can verify a receipt without an API key or server.
   */
  static verify(
    receipt: SignedReceipt,
    originalOutput?: string
  ): { signatureValid: boolean; hashMatch: boolean | null } {
    return verifyReceipt(receipt, originalOutput);
  }
}

// ─── Re-exports ───────────────────────────────────────────

export {
  generateKeyPair,
  serializeKeyPair,
  deserializeKeyPair,
  publicKeyFromSecret,
  sha256,
  verifySignature,
  verifyHash,
  verifyReceipt,
} from './crypto';

export { ReceiptBuilder, generateReceiptId, generateSessionId } from './receipt';
export { LocalBackup } from './backup';
export { ApiClient } from './api';

export type {
  SignedReceipt,
  ReceiptPayload,
  ReceiptAction,
  ReceiptModel,
  ReceiptCost,
  ReceiptHashes,
  ReceiptContext,
  ReceiptSignature,
  KeyPair,
  SerializedKeyPair,
  OpenClawScanConfig,
  SubmitReceiptResponse,
  VerifyResult,
  ActionType,
  Visibility,
  TaskCreate,
  TaskInfo,
} from './types';
export type { ReceiptInput } from './receipt';
