/**
 * @openclawscan/verify
 * 
 * Lightweight standalone receipt verification.
 * Use this if you're a marketplace, client, or auditor who needs
 * to verify OpenClawScan receipts without installing the full SDK.
 * 
 * Usage:
 * 
 *   import { verifyReceipt } from '@openclawscan/verify';
 * 
 *   const result = verifyReceipt(receiptJson);
 *   console.log(result.valid);        // true/false
 *   console.log(result.details);      // { signatureValid, payloadIntact, ... }
 * 
 *   // Or verify a specific output matches the hash:
 *   const result2 = verifyReceipt(receiptJson, { output: 'the actual output text' });
 *   console.log(result2.hashMatch);   // true/false
 */

import nacl from 'tweetnacl';
import { decodeBase64 } from 'tweetnacl-util';
import { createHash } from 'crypto';

// ─── Types ────────────────────────────────────────────────

export interface ReceiptJson {
  version: string;
  receipt_id: string;
  agent_id: string;
  owner_id: string;
  timestamp: string;
  action: { type: string; name: string; duration_ms: number };
  model: { provider: string; name: string; tokens_in: number; tokens_out: number };
  cost: { amount_usd: number; was_routed: boolean };
  hashes: { input_sha256: string; output_sha256: string };
  context: { task_id: string | null; session_id: string; sequence: number };
  visibility: string;
  signature: { algorithm: string; public_key: string; value: string };
  server_received_at?: string | null;
}

export interface VerifyOptions {
  output?: string;  // original output text to verify against hash
  input?: string;   // original input text to verify against hash
}

export interface VerifyResult {
  valid: boolean;
  details: {
    signatureValid: boolean;
    supportedVersion: boolean;
    supportedAlgorithm: boolean;
    inputHashMatch: boolean | null;   // null if no input provided
    outputHashMatch: boolean | null;  // null if no output provided
  };
  receipt: {
    id: string;
    agent: string;
    timestamp: string;
    action: string;
    model: string;
    cost_usd: number;
  };
}

// ─── Internal Helpers ─────────────────────────────────────

function deepSortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepSortKeys);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
    sorted[key] = deepSortKeys((obj as Record<string, unknown>)[key]);
  }
  return sorted;
}

function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

// ─── Main Verification Function ───────────────────────────

/**
 * Verify a signed OpenClawScan receipt.
 * 
 * Checks:
 * 1. Signature is valid (Ed25519)
 * 2. Version and algorithm are supported
 * 3. Optionally: input/output match their SHA-256 hashes
 */
export function verifyReceipt(
  receipt: ReceiptJson,
  options?: VerifyOptions
): VerifyResult {
  const supportedVersion = receipt.version === '1.0';
  const supportedAlgorithm = receipt.signature?.algorithm === 'ed25519';

  // Extract the signable payload
  const { signature, server_received_at, ...payload } = receipt;

  // Verify Ed25519 signature
  let signatureValid = false;
  try {
    if (supportedAlgorithm && signature) {
      const publicKey = decodeBase64(signature.public_key);
      const signatureBytes = decodeBase64(signature.value);
      const sorted = deepSortKeys(payload);
      const json = JSON.stringify(sorted);
      const messageBytes = new TextEncoder().encode(json);
      signatureValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey);
    }
  } catch {
    signatureValid = false;
  }

  // Check hash matches if original data provided
  let inputHashMatch: boolean | null = null;
  let outputHashMatch: boolean | null = null;

  if (options?.input !== undefined) {
    inputHashMatch = sha256(options.input) === receipt.hashes.input_sha256;
  }
  if (options?.output !== undefined) {
    outputHashMatch = sha256(options.output) === receipt.hashes.output_sha256;
  }

  return {
    valid: signatureValid && supportedVersion && supportedAlgorithm,
    details: {
      signatureValid,
      supportedVersion,
      supportedAlgorithm,
      inputHashMatch,
      outputHashMatch,
    },
    receipt: {
      id: receipt.receipt_id,
      agent: receipt.agent_id,
      timestamp: receipt.timestamp,
      action: `${receipt.action.type}:${receipt.action.name}`,
      model: `${receipt.model.provider}/${receipt.model.name}`,
      cost_usd: receipt.cost.amount_usd,
    },
  };
}

export default verifyReceipt;
