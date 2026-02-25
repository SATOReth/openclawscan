/**
 * OpenClawScan E2E Decryption — Browser-side
 * 
 * Uses the Web Crypto API to decrypt AES-256-GCM encrypted receipt
 * fields using the viewing key from the URL fragment.
 * 
 * Usage in a React component:
 * 
 *   import { extractViewingKey, decryptReceiptField, verifyKeyHash } from '@/lib/e2e-decrypt';
 *   
 *   const key = extractViewingKey(); // from URL #key=...
 *   if (key && verifyKeyHash(key, task.key_hash)) {
 *     const plaintext = await decryptReceiptField(receipt.encrypted_input, key);
 *     // Verify: sha256(plaintext) === receipt.input_sha256
 *   }
 */

// ─── Base64url helpers ────────────────────────────────────

/**
 * Convert base64url string (URL-safe, no padding) to ArrayBuffer.
 */
function fromBase64Url(base64url: string): ArrayBuffer {
  let b64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

/**
 * Convert standard base64 string to ArrayBuffer.
 */
function fromBase64(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

// ─── Key Management ───────────────────────────────────────

/**
 * Extract the viewing key from the URL fragment.
 * The fragment is #key=BASE64URL_VALUE — never sent to the server.
 * Returns null if no key is present.
 */
export function extractViewingKey(): string | null {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash;
  if (!hash) return null;

  // Parse fragment: #key=VALUE or #key=VALUE&other=...
  const params = new URLSearchParams(hash.slice(1));
  return params.get('key') || null;
}

/**
 * Verify the viewing key matches the task's key_hash.
 * This confirms the user has the correct key before attempting decryption.
 * Uses SHA-256 via Web Crypto API.
 */
export async function verifyKeyHash(
  viewingKeyBase64Url: string,
  expectedKeyHash: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(viewingKeyBase64Url);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyBytes.buffer as ArrayBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  const hashHex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex === expectedKeyHash;
}

/**
 * Import the viewing key as a CryptoKey for AES-256-GCM.
 */
async function importViewingKey(viewingKeyBase64Url: string): Promise<CryptoKey> {
  const keyBuffer = fromBase64Url(viewingKeyBase64Url);
  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
}

// ─── Decryption ───────────────────────────────────────────

/**
 * Decrypt an AES-256-GCM encrypted receipt field.
 * 
 * @param encryptedBase64 - The encrypted blob from the receipt (standard base64)
 *   Format: base64( IV_12bytes || ciphertext || authTag_16bytes )
 * @param viewingKeyBase64Url - The viewing key from the URL fragment (base64url)
 * @returns The decrypted plaintext string
 * @throws Error if decryption fails (wrong key, tampered data)
 */
export async function decryptReceiptField(
  encryptedBase64: string,
  viewingKeyBase64Url: string
): Promise<string> {
  const blobBuffer = fromBase64(encryptedBase64);
  const blob = new Uint8Array(blobBuffer);

  if (blob.length < 28) {
    throw new Error('Encrypted blob too short — invalid format');
  }

  // Extract components: IV (12B) || ciphertext || authTag (16B)
  const iv = blob.slice(0, 12);
  // Web Crypto expects ciphertext + authTag concatenated (not separated)
  const ciphertextWithTag = blob.slice(12);

  const cryptoKey = await importViewingKey(viewingKeyBase64Url);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
    },
    cryptoKey,
    ciphertextWithTag.buffer as ArrayBuffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}

// ─── Hash Verification ────────────────────────────────────

/**
 * Compute SHA-256 hash of a string using Web Crypto API.
 * Returns lowercase hex string (64 chars).
 * Used to verify: SHA-256(decrypted_data) === receipt.input_sha256
 */
export async function sha256Browser(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes.buffer as ArrayBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Full Decrypt + Verify ────────────────────────────────

export interface DecryptedReceiptField {
  plaintext: string;
  hashMatch: boolean; // SHA-256(plaintext) === expected hash
}

/**
 * Decrypt an encrypted field AND verify it matches the SHA-256 hash
 * from the signed receipt payload.
 * 
 * This is the complete verification chain:
 *   1. Ed25519 signature proves the hash is authentic (done by verifyReceiptSignature)
 *   2. AES-256-GCM decryption recovers the plaintext (done here)
 *   3. SHA-256(plaintext) === signed hash proves the encrypted data is genuine (done here)
 * 
 * All three levels pass → the data is authentic, unmodified, and came from the agent.
 */
export async function decryptAndVerify(
  encryptedBase64: string,
  viewingKeyBase64Url: string,
  expectedSha256: string
): Promise<DecryptedReceiptField> {
  const plaintext = await decryptReceiptField(encryptedBase64, viewingKeyBase64Url);
  const actualHash = await sha256Browser(plaintext);
  return {
    plaintext,
    hashMatch: actualHash === expectedSha256,
  };
}

// ─── Encryption Level Detection ───────────────────────────

export type EncryptionLevel = 'none' | 'hash_only' | 'encrypted';

/**
 * Detect the encryption level of a receipt.
 * - 'none': No hashes or encryption (shouldn't happen in v1.0+)
 * - 'hash_only': v1.0 receipt — SHA-256 hashes only, no encrypted content
 * - 'encrypted': v1.1 receipt — encrypted input/output available
 */
export function detectEncryptionLevel(receipt: {
  encrypted_input?: string | null;
  encrypted_output?: string | null;
}): EncryptionLevel {
  if (receipt.encrypted_input || receipt.encrypted_output) {
    return 'encrypted';
  }
  return 'hash_only';
}
