import nacl from 'tweetnacl';
import { decodeBase64 } from 'tweetnacl-util';

interface ReceiptSignature {
  algorithm: string;
  public_key: string;
  value: string;
}

/**
 * Deep sort all keys in an object recursively.
 * Must match exactly the SDK's implementation.
 */
function deepSortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepSortKeys);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
    sorted[key] = deepSortKeys((obj as Record<string, unknown>)[key]);
  }
  return sorted;
}

/**
 * Verify an Ed25519 signature on a receipt payload.
 * The payload is everything EXCEPT signature and server_received_at.
 */
export function verifyReceiptSignature(
  payload: Record<string, unknown>,
  signature: ReceiptSignature
): boolean {
  try {
    if (signature.algorithm !== 'ed25519') return false;

    const publicKey = decodeBase64(signature.public_key);
    const signatureBytes = decodeBase64(signature.value);

    const sorted = deepSortKeys(payload);
    const json = JSON.stringify(sorted);
    const messageBytes = new TextEncoder().encode(json);

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey);
  } catch {
    return false;
  }
}

/**
 * Extract the signable payload from a full receipt body.
 * Removes signature and server_received_at (which are not signed).
 */
export function extractSignablePayload(
  body: Record<string, unknown>
): Record<string, unknown> {
  const { signature, server_received_at, ...payload } = body;
  return payload;
}

/**
 * Validate receipt timestamp: must be within 5 minutes of server time.
 * Returns true if acceptable, false if suspicious.
 */
export function isTimestampReasonable(
  receiptTimestamp: string,
  maxDriftMs: number = 5 * 60 * 1000
): boolean {
  try {
    const receiptTime = new Date(receiptTimestamp).getTime();
    const serverTime = Date.now();
    return Math.abs(serverTime - receiptTime) <= maxDriftMs;
  } catch {
    return false;
  }
}
