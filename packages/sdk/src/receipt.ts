import { randomBytes } from 'crypto';
import { sha256, signPayload, encryptField } from './crypto';
import {
  ReceiptPayload,
  SignedReceipt,
  EncryptedReceipt,
  ActionType,
  Visibility,
} from './types';

// ─── ID Generation ────────────────────────────────────────

/**
 * Generate a unique receipt ID.
 * Format: rcpt_ + 12 random alphanumeric chars
 */
export function generateReceiptId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(12);
  let id = 'rcpt_';
  for (let i = 0; i < 12; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}

/**
 * Generate a session ID.
 */
export function generateSessionId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(8);
  let id = 'sess_';
  for (let i = 0; i < 8; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}

// ─── Receipt Input ────────────────────────────────────────

export interface ReceiptInput {
  action: {
    type: ActionType;
    name: string;
    duration_ms: number;
  };
  model: {
    provider: string;
    name: string;
    tokens_in: number;
    tokens_out: number;
  };
  cost: {
    amount_usd: number;
    was_routed?: boolean;
  };
  input: string;  // raw input — will be hashed, NOT stored
  output: string; // raw output — will be hashed, NOT stored
  task_id?: string;
  visibility?: Visibility;
}

// ─── Receipt Builder ──────────────────────────────────────

export class ReceiptBuilder {
  private agentId: string;
  private ownerId: string;
  private secretKey: string;
  private sessionId: string;
  private sequence: number;
  private defaultVisibility: Visibility;
  private viewingKey: string | null;

  constructor(config: {
    agentId: string;
    ownerId: string;
    secretKey: string;
    sessionId?: string;
    defaultVisibility?: Visibility;
    viewingKey?: string; // v1.1: AES-256-GCM key for E2E encryption
  }) {
    this.agentId = config.agentId;
    this.ownerId = config.ownerId;
    this.secretKey = config.secretKey;
    this.sessionId = config.sessionId || generateSessionId();
    this.sequence = 0;
    this.defaultVisibility = config.defaultVisibility || 'private';
    this.viewingKey = config.viewingKey || null;
  }

  /**
   * Build and sign a receipt from action input.
   * The raw input/output are hashed — only hashes are stored in the signed payload.
   * 
   * v1.1: If a viewing key is set, also encrypts raw input/output with AES-256-GCM.
   * The encrypted fields are NOT part of the signed payload — they're transport-only.
   * Verification: decrypt(encrypted_input) → SHA-256 must match hashes.input_sha256
   */
  build(input: ReceiptInput): EncryptedReceipt {
    const receiptId = generateReceiptId();
    const timestamp = new Date().toISOString();
    const sequence = this.sequence++;

    // Hash input and output — privacy preserved
    const inputHash = sha256(input.input);
    const outputHash = sha256(input.output);

    // Build the payload (the data that gets signed)
    // NOTE: encrypted fields are deliberately EXCLUDED from the signed payload.
    // The SHA-256 hashes in the payload cryptographically bind the encrypted content:
    //   decrypt(encrypted_input) → SHA-256 must equal hashes.input_sha256
    const payload: ReceiptPayload = {
      version: '1.0',
      receipt_id: receiptId,
      agent_id: this.agentId,
      owner_id: this.ownerId,
      timestamp,
      action: {
        type: input.action.type,
        name: input.action.name,
        duration_ms: input.action.duration_ms,
      },
      model: {
        provider: input.model.provider,
        name: input.model.name,
        tokens_in: input.model.tokens_in,
        tokens_out: input.model.tokens_out,
      },
      cost: {
        amount_usd: input.cost.amount_usd,
        was_routed: input.cost.was_routed ?? false,
      },
      hashes: {
        input_sha256: inputHash,
        output_sha256: outputHash,
      },
      context: {
        task_id: input.task_id ?? null,
        session_id: this.sessionId,
        sequence,
      },
      visibility: input.visibility ?? this.defaultVisibility,
    };

    // Sign the payload (Ed25519)
    const signature = signPayload(payload, this.secretKey);

    // v1.1: Encrypt raw input/output if viewing key is available
    let encrypted_input: string | null = null;
    let encrypted_output: string | null = null;

    if (this.viewingKey) {
      encrypted_input = encryptField(input.input, this.viewingKey);
      encrypted_output = encryptField(input.output, this.viewingKey);
    }

    // Return the complete receipt
    const receipt: EncryptedReceipt = {
      ...payload,
      signature,
      server_received_at: null,
      encrypted_input,
      encrypted_output,
    };

    return receipt;
  }

  /**
   * Set or update the viewing key for E2E encryption.
   * Called when starting a new encrypted task.
   */
  setViewingKey(key: string | null): void {
    this.viewingKey = key;
  }

  /**
   * Check if E2E encryption is active.
   */
  hasViewingKey(): boolean {
    return this.viewingKey !== null;
  }

  /**
   * Get current session ID.
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current sequence number (next receipt will have this number).
   */
  getSequence(): number {
    return this.sequence;
  }

  /**
   * Start a new session (resets sequence counter).
   */
  newSession(): string {
    this.sessionId = generateSessionId();
    this.sequence = 0;
    return this.sessionId;
  }
}
