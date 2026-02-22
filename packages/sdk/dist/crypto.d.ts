import type { KeyPair, SerializedKeyPair, ReceiptPayload, ReceiptSignature } from './types';
/**
 * Generate a new Ed25519 keypair for signing receipts.
 * Call this once when setting up an agent. Save the keys securely.
 */
export declare function generateKeyPair(): KeyPair;
/**
 * Serialize a keypair to base64 strings for storage.
 */
export declare function serializeKeyPair(kp: KeyPair): SerializedKeyPair;
/**
 * Deserialize a keypair from base64 strings.
 */
export declare function deserializeKeyPair(skp: SerializedKeyPair): KeyPair;
/**
 * Get public key from a base64-encoded secret key.
 */
export declare function publicKeyFromSecret(secretKeyBase64: string): string;
/**
 * Compute SHA-256 hash of any string data.
 * Returns lowercase hex string (64 chars).
 */
export declare function sha256(data: string): string;
/**
 * Compute SHA-256 hash of a buffer.
 */
export declare function sha256Buffer(data: Buffer): string;
/**
 * Canonical JSON serialization for signing.
 * Keys are sorted alphabetically at every level to ensure
 * the same payload always produces the same bytes.
 */
export declare function canonicalize(obj: unknown): string;
/**
 * Create a deterministic byte representation of a receipt payload.
 * This is what actually gets signed.
 */
export declare function payloadToBytes(payload: ReceiptPayload): Uint8Array;
/**
 * Sign a receipt payload with an Ed25519 secret key.
 * Returns the signature component to attach to the receipt.
 */
export declare function signPayload(payload: ReceiptPayload, secretKeyBase64: string): ReceiptSignature;
/**
 * Verify a signed receipt's signature.
 * Returns true if the signature is valid for the given payload.
 */
export declare function verifySignature(payload: ReceiptPayload, signature: ReceiptSignature): boolean;
/**
 * Verify that an original data string matches a SHA-256 hash.
 */
export declare function verifyHash(originalData: string, expectedHash: string): boolean;
/**
 * Full verification of a signed receipt.
 * Optionally verifies output hash against original data.
 */
export declare function verifyReceipt(receipt: {
    signature: ReceiptSignature;
} & ReceiptPayload, originalOutput?: string): {
    signatureValid: boolean;
    hashMatch: boolean | null;
};
