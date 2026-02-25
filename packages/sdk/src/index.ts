/**
 * OpenClawScan SDK v1.1
 * 
 * Cryptographically signed receipts for AI agent actions.
 * Now with E2E encryption — raw input/output encrypted client-side,
 * server stores only encrypted blobs + SHA-256 hashes.
 * 
 * === v1.0 Usage (hash-only, backward compatible): ===
 * 
 *   const scanner = new OpenClawScan({
 *     agentId: 'my-agent',
 *     ownerId: 'github:myuser',
 *     secretKey: serialized.secretKey,
 *   });
 * 
 *   const receipt = await scanner.capture({ ... });
 * 
 * === v1.1 Usage (E2E encrypted): ===
 * 
 *   const scanner = new OpenClawScan({
 *     agentId: 'my-agent',
 *     ownerId: 'github:myuser',
 *     secretKey: serialized.secretKey,
 *   });
 * 
 *   // Start an encrypted task — generates a viewing key automatically
 *   const { taskInfo, viewingKey } = await scanner.startEncryptedTask({
 *     agent_id: 'my-agent',
 *     name: 'Smart Contract Audit',
 *   });
 * 
 *   // Capture actions — auto-encrypted with task's viewing key
 *   await scanner.capture({ ... });
 * 
 *   // Complete and share — key goes in URL fragment (never sent to server)
 *   const completed = await scanner.completeTask();
 *   const shareUrl = `${completed.share_url}#key=${viewingKey}`;
 *   // → https://openclawscan.xyz/task/abc123#key=BASE64URL_KEY
 */

import { ReceiptBuilder, type ReceiptInput } from './receipt';
import { LocalBackup } from './backup';
import { ApiClient } from './api';
import {
  verifyReceipt,
  generateViewingKey,
  hashViewingKey,
  encryptField,
} from './crypto';
import type {
  OpenClawScanConfig,
  SignedReceipt,
  EncryptedReceipt,
  TaskCreate,
  EncryptedTaskCreate,
  TaskInfo,
} from './types';

export class OpenClawScan {
  private builder: ReceiptBuilder;
  private backup: LocalBackup;
  private api: ApiClient;
  private config: OpenClawScanConfig;
  private activeTaskId: string | null = null;
  private activeViewingKey: string | null = null;

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
   * 
   * v1.1: If an encrypted task is active, raw input/output are also
   * encrypted with AES-256-GCM before being sent to the server.
   */
  async capture(input: ReceiptInput): Promise<EncryptedReceipt> {
    // If there's an active task, attach it
    if (this.activeTaskId && !input.task_id) {
      input.task_id = this.activeTaskId;
    }

    // Build and sign the receipt (+ encrypt if viewing key is set)
    const receipt = this.builder.build(input);

    // Save locally (always, as backup) — includes encrypted fields
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
  captureSync(input: ReceiptInput): EncryptedReceipt {
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

  // ─── Task Management ──────────────────────────────────────

  /**
   * Start a new task (v1.0 — no encryption).
   * All subsequent receipts will be grouped under this task.
   */
  async startTask(task: TaskCreate): Promise<TaskInfo> {
    const info = await this.api.createTask(task);
    this.activeTaskId = info.task_id;
    this.activeViewingKey = null;
    this.builder.setViewingKey(null);
    return info;
  }

  /**
   * v1.1: Start a new E2E encrypted task.
   * Generates a random AES-256-GCM viewing key automatically.
   * All subsequent receipts will have their input/output encrypted.
   * 
   * Returns both the task info and the viewing key.
   * The viewing key is for the share URL: /task/slug#key=VIEWING_KEY
   * 
   * IMPORTANT: Store the viewing key! It's not recoverable from the server.
   */
  async startEncryptedTask(
    task: TaskCreate
  ): Promise<{ taskInfo: TaskInfo; viewingKey: string }> {
    // Generate a random viewing key
    const viewingKey = generateViewingKey();
    const keyHash = hashViewingKey(viewingKey);

    // Create task with key_hash (server stores hash, never the key)
    const encryptedTask: EncryptedTaskCreate = {
      ...task,
      key_hash: keyHash,
    };

    const taskInfo = await this.api.createTask(encryptedTask);
    this.activeTaskId = taskInfo.task_id;
    this.activeViewingKey = viewingKey;

    // Tell the builder to encrypt from now on
    this.builder.setViewingKey(viewingKey);

    return { taskInfo, viewingKey };
  }

  /**
   * Complete the active task and get a shareable link.
   * v1.1: Can include an encrypted summary of the task results.
   */
  async completeTask(summary?: string): Promise<TaskInfo> {
    if (!this.activeTaskId) {
      throw new Error('No active task to complete');
    }

    // If E2E is active and a summary is provided, encrypt it
    let encrypted_summary: string | undefined;
    if (summary && this.activeViewingKey) {
      encrypted_summary = encryptField(summary, this.activeViewingKey);
    }

    const info = await this.api.completeTask(this.activeTaskId, {
      encrypted_summary,
    });

    // Clear active task state
    this.activeTaskId = null;
    this.activeViewingKey = null;
    this.builder.setViewingKey(null);

    return info;
  }

  /**
   * Get the viewing key for the currently active encrypted task.
   * Returns null if no encrypted task is active or if using v1.0 mode.
   * 
   * Use this to build the share URL:
   *   `${taskInfo.share_url}#key=${scanner.getViewingKey()}`
   */
  getViewingKey(): string | null {
    return this.activeViewingKey;
  }

  /**
   * Check if E2E encryption is currently active.
   */
  isEncrypted(): boolean {
    return this.activeViewingKey !== null;
  }

  // ─── Session Management ───────────────────────────────────

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

  // ─── Static Verification ──────────────────────────────────

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
  // v1.1: E2E encryption
  generateViewingKey,
  hashViewingKey,
  encryptField,
  decryptField,
  toBase64Url,
  fromBase64Url,
} from './crypto';

export { ReceiptBuilder, generateReceiptId, generateSessionId } from './receipt';
export { LocalBackup } from './backup';
export { ApiClient } from './api';

export type {
  SignedReceipt,
  EncryptedReceipt,
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
  EncryptedTaskCreate,
  TaskInfo,
} from './types';
export type { ReceiptInput } from './receipt';
