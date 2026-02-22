"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateKeyPair = generateKeyPair;
exports.serializeKeyPair = serializeKeyPair;
exports.deserializeKeyPair = deserializeKeyPair;
exports.publicKeyFromSecret = publicKeyFromSecret;
exports.sha256 = sha256;
exports.sha256Buffer = sha256Buffer;
exports.canonicalize = canonicalize;
exports.payloadToBytes = payloadToBytes;
exports.signPayload = signPayload;
exports.verifySignature = verifySignature;
exports.verifyHash = verifyHash;
exports.verifyReceipt = verifyReceipt;
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const tweetnacl_util_1 = require("tweetnacl-util");
const crypto_1 = require("crypto");
// ─── Key Management ───────────────────────────────────────
/**
 * Generate a new Ed25519 keypair for signing receipts.
 * Call this once when setting up an agent. Save the keys securely.
 */
function generateKeyPair() {
    const kp = tweetnacl_1.default.sign.keyPair();
    return {
        publicKey: kp.publicKey,
        secretKey: kp.secretKey,
    };
}
/**
 * Serialize a keypair to base64 strings for storage.
 */
function serializeKeyPair(kp) {
    return {
        publicKey: (0, tweetnacl_util_1.encodeBase64)(kp.publicKey),
        secretKey: (0, tweetnacl_util_1.encodeBase64)(kp.secretKey),
    };
}
/**
 * Deserialize a keypair from base64 strings.
 */
function deserializeKeyPair(skp) {
    return {
        publicKey: (0, tweetnacl_util_1.decodeBase64)(skp.publicKey),
        secretKey: (0, tweetnacl_util_1.decodeBase64)(skp.secretKey),
    };
}
/**
 * Get public key from a base64-encoded secret key.
 */
function publicKeyFromSecret(secretKeyBase64) {
    const secretKey = (0, tweetnacl_util_1.decodeBase64)(secretKeyBase64);
    const keyPair = tweetnacl_1.default.sign.keyPair.fromSecretKey(secretKey);
    return (0, tweetnacl_util_1.encodeBase64)(keyPair.publicKey);
}
// ─── Hashing ──────────────────────────────────────────────
/**
 * Compute SHA-256 hash of any string data.
 * Returns lowercase hex string (64 chars).
 */
function sha256(data) {
    return (0, crypto_1.createHash)('sha256').update(data, 'utf8').digest('hex');
}
/**
 * Compute SHA-256 hash of a buffer.
 */
function sha256Buffer(data) {
    return (0, crypto_1.createHash)('sha256').update(data).digest('hex');
}
// ─── Signing ──────────────────────────────────────────────
/**
 * Canonical JSON serialization for signing.
 * Keys are sorted alphabetically at every level to ensure
 * the same payload always produces the same bytes.
 */
function canonicalize(obj) {
    return JSON.stringify(obj, Object.keys(obj).sort());
}
/**
 * Deep sort all keys in an object recursively.
 * This ensures canonical representation regardless of insertion order.
 */
function deepSortKeys(obj) {
    if (obj === null || typeof obj !== 'object')
        return obj;
    if (Array.isArray(obj))
        return obj.map(deepSortKeys);
    const sorted = {};
    for (const key of Object.keys(obj).sort()) {
        sorted[key] = deepSortKeys(obj[key]);
    }
    return sorted;
}
/**
 * Create a deterministic byte representation of a receipt payload.
 * This is what actually gets signed.
 */
function payloadToBytes(payload) {
    const sorted = deepSortKeys(payload);
    const json = JSON.stringify(sorted);
    return new TextEncoder().encode(json);
}
/**
 * Sign a receipt payload with an Ed25519 secret key.
 * Returns the signature component to attach to the receipt.
 */
function signPayload(payload, secretKeyBase64) {
    const secretKey = (0, tweetnacl_util_1.decodeBase64)(secretKeyBase64);
    const keyPair = tweetnacl_1.default.sign.keyPair.fromSecretKey(secretKey);
    const messageBytes = payloadToBytes(payload);
    const signatureBytes = tweetnacl_1.default.sign.detached(messageBytes, secretKey);
    return {
        algorithm: 'ed25519',
        public_key: (0, tweetnacl_util_1.encodeBase64)(keyPair.publicKey),
        value: (0, tweetnacl_util_1.encodeBase64)(signatureBytes),
    };
}
// ─── Verification ─────────────────────────────────────────
/**
 * Verify a signed receipt's signature.
 * Returns true if the signature is valid for the given payload.
 */
function verifySignature(payload, signature) {
    try {
        if (signature.algorithm !== 'ed25519')
            return false;
        const publicKey = (0, tweetnacl_util_1.decodeBase64)(signature.public_key);
        const signatureBytes = (0, tweetnacl_util_1.decodeBase64)(signature.value);
        const messageBytes = payloadToBytes(payload);
        return tweetnacl_1.default.sign.detached.verify(messageBytes, signatureBytes, publicKey);
    }
    catch {
        return false;
    }
}
/**
 * Verify that an original data string matches a SHA-256 hash.
 */
function verifyHash(originalData, expectedHash) {
    return sha256(originalData) === expectedHash;
}
/**
 * Full verification of a signed receipt.
 * Optionally verifies output hash against original data.
 */
function verifyReceipt(receipt, originalOutput) {
    // Extract payload (everything except signature and server_received_at)
    const { signature, server_received_at, ...payload } = receipt;
    const signatureValid = verifySignature(payload, signature);
    let hashMatch = null;
    if (originalOutput !== undefined) {
        hashMatch = verifyHash(originalOutput, payload.hashes.output_sha256);
    }
    return { signatureValid, hashMatch };
}
