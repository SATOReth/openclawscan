"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyReceipt = verifyReceipt;
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const tweetnacl_util_1 = require("tweetnacl-util");
const crypto_1 = require("crypto");
// ─── Internal Helpers ─────────────────────────────────────
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
function sha256(data) {
    return (0, crypto_1.createHash)('sha256').update(data, 'utf8').digest('hex');
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
function verifyReceipt(receipt, options) {
    const supportedVersion = receipt.version === '1.0';
    const supportedAlgorithm = receipt.signature?.algorithm === 'ed25519';
    // Extract the signable payload
    const { signature, server_received_at, ...payload } = receipt;
    // Verify Ed25519 signature
    let signatureValid = false;
    try {
        if (supportedAlgorithm && signature) {
            const publicKey = (0, tweetnacl_util_1.decodeBase64)(signature.public_key);
            const signatureBytes = (0, tweetnacl_util_1.decodeBase64)(signature.value);
            const sorted = deepSortKeys(payload);
            const json = JSON.stringify(sorted);
            const messageBytes = new TextEncoder().encode(json);
            signatureValid = tweetnacl_1.default.sign.detached.verify(messageBytes, signatureBytes, publicKey);
        }
    }
    catch {
        signatureValid = false;
    }
    // Check hash matches if original data provided
    let inputHashMatch = null;
    let outputHashMatch = null;
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
exports.default = verifyReceipt;
