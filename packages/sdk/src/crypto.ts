import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';
import { createHash } from 'crypto';
import type { KeyPair, SerializedKeyPair, ReceiptPayload, ReceiptSignature } from './types';

// ─── Key Management ───────────────────────────────────────

/**
 * Generate a new Ed25519 keypair for signing receipts.
 * Call this once when setting up an agent. Save the keys securely.
 */
export function generateKeyPair(): KeyPair {
  const kp = nacl.sign.keyPair();
  return {
    publicKey: kp.publicKey,
    secretKey: kp.secretKey,
  };
}

/**
 * Serialize a keypair to base64 strings for storage.
 */
export function serializeKeyPair(kp: KeyPair): SerializedKeyPair {
  return {
    publicKey: encodeBase64(kp.publicKey),
    secretKey: encodeBase64(kp.secretKey),
  };
}

/**
 * Deserialize a keypair from base64 strings.
 */
export function deserializeKeyPair(skp: SerializedKeyPair): KeyPair {
  return {
    publicKey: decodeBase64(skp.publicKey),
    secretKey: decodeBase64(skp.secretKey),
  };
}

/**
 * Get public key from a base64-encoded secret key.
 */
export function publicKeyFromSecret(secretKeyBase64: string): string {
  const secretKey = decodeBase64(secretKeyBase64);
  const keyPair = nacl.sign.keyPair.fromSecretKey(secretKey);
  return encodeBase64(keyPair.publicKey);
}

// ─── Hashing ──────────────────────────────────────────────

/**
 * Compute SHA-256 hash of any string data.
 * Returns lowercase hex string (64 chars).
 */
export function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Compute SHA-256 hash of a buffer.
 */
export function sha256Buffer(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

// ─── Signing ──────────────────────────────────────────────

/**
 * Canonical JSON serialization for signing.
 * Keys are sorted alphabetically at every level to ensure
 * the same payload always produces the same bytes.
 */
export function canonicalize(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj as object).sort());
}

/**
 * Deep sort all keys in an object recursively.
 * This ensures canonical representation regardless of insertion order.
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
 * Create a deterministic byte representation of a receipt payload.
 * This is what actually gets signed.
 */
export function payloadToBytes(payload: ReceiptPayload): Uint8Array {
  const sorted = deepSortKeys(payload);
  const json = JSON.stringify(sorted);
  return new TextEncoder().encode(json);
}

/**
 * Sign a receipt payload with an Ed25519 secret key.
 * Returns the signature component to attach to the receipt.
 */
export function signPayload(
  payload: ReceiptPayload,
  secretKeyBase64: string
): ReceiptSignature {
  const secretKey = decodeBase64(secretKeyBase64);
  const keyPair = nacl.sign.keyPair.fromSecretKey(secretKey);
  const messageBytes = payloadToBytes(payload);
  const signatureBytes = nacl.sign.detached(messageBytes, secretKey);

  return {
    algorithm: 'ed25519' as const,
    public_key: encodeBase64(keyPair.publicKey),
    value: encodeBase64(signatureBytes),
  };
}

// ─── Verification ─────────────────────────────────────────

/**
 * Verify a signed receipt's signature.
 * Returns true if the signature is valid for the given payload.
 */
export function verifySignature(
  payload: ReceiptPayload,
  signature: ReceiptSignature
): boolean {
  try {
    if (signature.algorithm !== 'ed25519') return false;

    const publicKey = decodeBase64(signature.public_key);
    const signatureBytes = decodeBase64(signature.value);
    const messageBytes = payloadToBytes(payload);

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey);
  } catch {
    return false;
  }
}

/**
 * Verify that an original data string matches a SHA-256 hash.
 */
export function verifyHash(originalData: string, expectedHash: string): boolean {
  return sha256(originalData) === expectedHash;
}

/**
 * Full verification of a signed receipt.
 * Optionally verifies output hash against original data.
 */
export function verifyReceipt(
  receipt: { signature: ReceiptSignature } & ReceiptPayload,
  originalOutput?: string
): {
  signatureValid: boolean;
  hashMatch: boolean | null;
} {
  // Extract payload (everything except signature and server_received_at)
  const { signature, server_received_at, ...payload } = receipt as any;

  const signatureValid = verifySignature(payload as ReceiptPayload, signature);

  let hashMatch: boolean | null = null;
  if (originalOutput !== undefined) {
    hashMatch = verifyHash(originalOutput, payload.hashes.output_sha256);
  }

  return { signatureValid, hashMatch };
}
