import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import type { KeyPair, SerializedKeyPair, ReceiptPayload, ReceiptSignature } from './types';

// ─── Key Management (Ed25519) ─────────────────────────────

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

// ─── Ed25519 Signing ──────────────────────────────────────

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

// ─── Ed25519 Verification ─────────────────────────────────

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

// ═══════════════════════════════════════════════════════════
// AES-256-GCM — E2E Encryption (v1.1)
// ═══════════════════════════════════════════════════════════
//
// Flow:
//   1. Per task, SDK generates a random 256-bit viewing key
//   2. For each receipt, raw input/output are encrypted with that key
//   3. The key goes ONLY in the URL fragment (#key=...) — never to server
//   4. Server stores encrypted blobs + SHA-256 hashes (from signed payload)
//   5. Browser extracts key from fragment, decrypts, verifies hash match
//
// Blob format: base64( IV_12bytes || ciphertext || authTag_16bytes )
// ═══════════════════════════════════════════════════════════

/**
 * Generate a random AES-256-GCM viewing key for a task.
 * Returns a base64url-encoded 32-byte key (URL-safe, no padding).
 * 
 * This key goes in the URL fragment: /task/slug#key=THIS_VALUE
 * The fragment is never sent to the server (per HTTP spec).
 */
export function generateViewingKey(): string {
  const key = randomBytes(32);
  return toBase64Url(key);
}

/**
 * Encrypt a plaintext string with AES-256-GCM.
 * 
 * @param plaintext - The raw data to encrypt (input or output string)
 * @param viewingKeyBase64Url - The task's viewing key (base64url)
 * @returns base64-encoded blob: IV (12B) || ciphertext || authTag (16B)
 */
export function encryptField(plaintext: string, viewingKeyBase64Url: string): string {
  const key = fromBase64Url(viewingKeyBase64Url);
  const iv = randomBytes(12); // 96-bit IV, recommended for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const plaintextBytes = Buffer.from(plaintext, 'utf8');
  const encrypted = Buffer.concat([
    cipher.update(plaintextBytes),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16 bytes

  // Concatenate: IV || ciphertext || authTag
  const blob = Buffer.concat([iv, encrypted, authTag]);
  return blob.toString('base64');
}

/**
 * Decrypt an AES-256-GCM encrypted blob back to plaintext.
 * 
 * @param encryptedBase64 - base64-encoded blob: IV (12B) || ciphertext || authTag (16B)
 * @param viewingKeyBase64Url - The task's viewing key (base64url)
 * @returns The original plaintext string
 * @throws Error if decryption fails (wrong key, tampered data)
 */
export function decryptField(encryptedBase64: string, viewingKeyBase64Url: string): string {
  const key = fromBase64Url(viewingKeyBase64Url);
  const blob = Buffer.from(encryptedBase64, 'base64');

  if (blob.length < 28) {
    // Minimum: 12 (IV) + 0 (empty ciphertext) + 16 (authTag)
    throw new Error('Encrypted blob too short — invalid format');
  }

  const iv = blob.subarray(0, 12);
  const authTag = blob.subarray(blob.length - 16);
  const ciphertext = blob.subarray(12, blob.length - 16);

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(), // throws if authTag mismatch (tampered!)
  ]);

  return decrypted.toString('utf8');
}

/**
 * Hash the viewing key with SHA-256.
 * Stored in tasks.key_hash so the frontend can verify
 * the user has the correct key BEFORE attempting decryption.
 * 
 * The server never sees the actual key — only this hash.
 */
export function hashViewingKey(viewingKeyBase64Url: string): string {
  return createHash('sha256').update(viewingKeyBase64Url, 'utf8').digest('hex');
}

// ─── Base64url helpers ────────────────────────────────────
// URL-safe base64 without padding — safe for URL fragments

/**
 * Convert raw bytes to base64url string (no padding).
 */
export function toBase64Url(buffer: Buffer | Uint8Array): string {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Convert base64url string back to Buffer.
 */
export function fromBase64Url(base64url: string): Buffer {
  // Restore standard base64
  let b64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  return Buffer.from(b64, 'base64');
}
