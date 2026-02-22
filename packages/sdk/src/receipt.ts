import { randomBytes } from 'crypto';
import { sha256, signPayload } from './crypto';
import {
  ReceiptPayload,
  SignedReceipt,
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

  constructor(config: {
    agentId: string;
    ownerId: string;
    secretKey: string;
    sessionId?: string;
    defaultVisibility?: Visibility;
  }) {
    this.agentId = config.agentId;
    this.ownerId = config.ownerId;
    this.secretKey = config.secretKey;
    this.sessionId = config.sessionId || generateSessionId();
    this.sequence = 0;
    this.defaultVisibility = config.defaultVisibility || 'private';
  }

  /**
   * Build and sign a receipt from action input.
   * The raw input/output are hashed — only hashes are stored in the receipt.
   */
  build(input: ReceiptInput): SignedReceipt {
    const receiptId = generateReceiptId();
    const timestamp = new Date().toISOString();
    const sequence = this.sequence++;

    // Hash input and output — privacy preserved
    const inputHash = sha256(input.input);
    const outputHash = sha256(input.output);

    // Build the payload (the data that gets signed)
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

    // Sign the payload
    const signature = signPayload(payload, this.secretKey);

    // Return the complete signed receipt
    const signedReceipt: SignedReceipt = {
      ...payload,
      signature,
      server_received_at: null,
    };

    return signedReceipt;
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
