import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────

export const ActionType = z.enum([
  'tool_call',
  'file_write',
  'file_read',
  'api_request',
  'message_send',
  'skill_exec',
  'code_exec',
  'web_search',
  'model_call',
]);
export type ActionType = z.infer<typeof ActionType>;

export const Visibility = z.enum(['private', 'task_only', 'public']);
export type Visibility = z.infer<typeof Visibility>;

// ─── Receipt Schema ───────────────────────────────────────

export const ReceiptAction = z.object({
  type: ActionType,
  name: z.string().min(1).max(256),
  duration_ms: z.number().int().nonnegative(),
});
export type ReceiptAction = z.infer<typeof ReceiptAction>;

export const ReceiptModel = z.object({
  provider: z.string().min(1).max(64),
  name: z.string().min(1).max(128),
  tokens_in: z.number().int().nonnegative(),
  tokens_out: z.number().int().nonnegative(),
});
export type ReceiptModel = z.infer<typeof ReceiptModel>;

export const ReceiptCost = z.object({
  amount_usd: z.number().nonnegative(),
  was_routed: z.boolean().default(false),
});
export type ReceiptCost = z.infer<typeof ReceiptCost>;

export const ReceiptHashes = z.object({
  input_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  output_sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
export type ReceiptHashes = z.infer<typeof ReceiptHashes>;

export const ReceiptContext = z.object({
  task_id: z.string().nullable().default(null),
  session_id: z.string().min(1),
  sequence: z.number().int().nonnegative(),
});
export type ReceiptContext = z.infer<typeof ReceiptContext>;

export const ReceiptSignature = z.object({
  algorithm: z.literal('ed25519'),
  public_key: z.string().min(1),
  value: z.string().min(1),
});
export type ReceiptSignature = z.infer<typeof ReceiptSignature>;

/**
 * The core receipt payload — the data that gets signed.
 * Signature is NOT included in the signed payload (it's added after).
 * Encrypted fields are NOT part of the signed payload either.
 */
export const ReceiptPayload = z.object({
  version: z.literal('1.0'),
  receipt_id: z.string().min(1),
  agent_id: z.string().min(1),
  owner_id: z.string().min(1),
  timestamp: z.string().datetime(),
  action: ReceiptAction,
  model: ReceiptModel,
  cost: ReceiptCost,
  hashes: ReceiptHashes,
  context: ReceiptContext,
  visibility: Visibility.default('private'),
});
export type ReceiptPayload = z.infer<typeof ReceiptPayload>;

/**
 * A complete signed receipt = payload + signature.
 */
export const SignedReceipt = ReceiptPayload.extend({
  signature: ReceiptSignature,
  server_received_at: z.string().datetime().nullable().default(null),
});
export type SignedReceipt = z.infer<typeof SignedReceipt>;

/**
 * v1.1: A signed receipt with optional E2E encrypted fields.
 * The encrypted fields are transport-only — they are NOT part
 * of the signed payload (the hashes in the payload verify them).
 * 
 * Flow:
 *   1. SHA-256(raw_input) → hashes.input_sha256 (in signed payload)
 *   2. AES-GCM-encrypt(raw_input, viewing_key) → encrypted_input (transport)
 *   3. Verifier decrypts → SHA-256(decrypted) must match hashes.input_sha256
 */
export const EncryptedReceipt = SignedReceipt.extend({
  encrypted_input: z.string().nullable().default(null),
  encrypted_output: z.string().nullable().default(null),
});
export type EncryptedReceipt = z.infer<typeof EncryptedReceipt>;

// ─── Key Pair ─────────────────────────────────────────────

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface SerializedKeyPair {
  publicKey: string; // base64
  secretKey: string; // base64
}

// ─── SDK Config ───────────────────────────────────────────

export interface OpenClawScanConfig {
  agentId: string;
  ownerId: string;
  apiKey?: string;
  apiUrl?: string;
  secretKey: string; // base64-encoded Ed25519 secret key
  autoCapture?: boolean;
  defaultVisibility?: Visibility;
  localBackupPath?: string; // path to save local receipt copies
  onReceipt?: (receipt: SignedReceipt) => void;
}

// ─── API Types ────────────────────────────────────────────

export interface SubmitReceiptResponse {
  receipt_id: string;
  explorer_url: string;
  server_received_at: string;
}

export interface VerifyResult {
  signature_valid: boolean;
  hash_match: boolean | null; // null if no original data provided
  receipt_registered: boolean;
  timestamp: string;
  agent_id: string;
  details: {
    public_key: string;
    algorithm: string;
  };
}

// ─── Task Types ───────────────────────────────────────────

export interface TaskCreate {
  agent_id: string;
  name: string;
  description?: string;
}

/**
 * v1.1: Task creation with E2E encryption support.
 * key_hash allows the server to confirm key correctness
 * without ever seeing the actual viewing key.
 */
export interface EncryptedTaskCreate extends TaskCreate {
  key_hash: string; // SHA-256(viewing_key) — server stores this
}

export interface TaskInfo {
  task_id: string;
  slug: string;
  share_url: string;
  status: 'active' | 'completed' | 'failed';
  total_receipts: number;
  total_duration_ms: number;
  total_cost_usd: number;
  key_hash?: string | null; // v1.1: present if E2E encrypted
}
