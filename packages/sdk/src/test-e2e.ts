/**
 * OpenClawScan v1.1 — E2E Encryption Tests
 * 
 * Run: npx ts-node test-e2e.ts
 * Or after build: node dist/test-e2e.js
 * 
 * Tests:
 *   1. AES-256-GCM encrypt → decrypt round-trip
 *   2. Wrong key fails decryption (authTag mismatch)
 *   3. Tampered ciphertext fails decryption
 *   4. Viewing key hash verification
 *   5. Base64url encode/decode round-trip
 *   6. ReceiptBuilder with E2E encryption produces correct output
 *   7. Encrypted fields are excluded from signed payload
 *   8. Ed25519 signature still validates with encrypted fields present
 *   9. Decrypted content matches SHA-256 hash in signed payload
 *  10. v1.0 compatibility — no viewing key → no encrypted fields
 */

import {
  generateKeyPair,
  serializeKeyPair,
  sha256,
  verifySignature,
  generateViewingKey,
  hashViewingKey,
  encryptField,
  decryptField,
  toBase64Url,
  fromBase64Url,
} from './crypto';
import { ReceiptBuilder } from './receipt';
import type { ReceiptPayload, ReceiptSignature } from './types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string): void {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ ${name}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ─── Test 1: AES-256-GCM round-trip ────────────────────────

section('AES-256-GCM Encrypt/Decrypt');

const key = generateViewingKey();
const plaintext = 'Hello, this is a test input for a smart contract audit.';
const encrypted = encryptField(plaintext, key);
const decrypted = decryptField(encrypted, key);

assert(decrypted === plaintext, 'Round-trip: decrypt(encrypt(x)) === x');
assert(encrypted !== plaintext, 'Encrypted is different from plaintext');
assert(encrypted.length > 0, 'Encrypted blob is non-empty');

// Verify blob format: base64 → bytes → at least 28 bytes (12 IV + 0 + 16 tag)
const blobBytes = Buffer.from(encrypted, 'base64');
assert(blobBytes.length >= 28, `Blob is ${blobBytes.length} bytes (≥28 minimum)`);

// ─── Test 2: Wrong key fails ───────────────────────────────

section('Wrong Key Rejection');

const wrongKey = generateViewingKey();
let wrongKeyFailed = false;
try {
  decryptField(encrypted, wrongKey);
} catch (err) {
  wrongKeyFailed = true;
}
assert(wrongKeyFailed, 'Decryption with wrong key throws error');

// ─── Test 3: Tampered ciphertext fails ─────────────────────

section('Tamper Detection');

const tamperedBytes = Buffer.from(encrypted, 'base64');
// Flip a byte in the ciphertext area (after IV, before authTag)
if (tamperedBytes.length > 20) {
  tamperedBytes[15] ^= 0xFF;
}
const tamperedBlob = tamperedBytes.toString('base64');
let tamperFailed = false;
try {
  decryptField(tamperedBlob, key);
} catch (err) {
  tamperFailed = true;
}
assert(tamperFailed, 'Tampered ciphertext throws error (GCM auth)');

// ─── Test 4: Viewing key hash ──────────────────────────────

section('Viewing Key Hash');

const keyHash = hashViewingKey(key);
assert(keyHash.length === 64, 'Key hash is 64-char hex (SHA-256)');
assert(/^[a-f0-9]{64}$/.test(keyHash), 'Key hash is valid hex');

const keyHash2 = hashViewingKey(key);
assert(keyHash === keyHash2, 'Same key → same hash (deterministic)');

const differentKeyHash = hashViewingKey(wrongKey);
assert(differentKeyHash !== keyHash, 'Different key → different hash');

// ─── Test 5: Base64url round-trip ──────────────────────────

section('Base64url Encoding');

const testBuffer = Buffer.from([0, 1, 255, 128, 63, 191, 62, 252]);
const encoded = toBase64Url(testBuffer);
assert(!encoded.includes('+'), 'No + in base64url');
assert(!encoded.includes('/'), 'No / in base64url');
assert(!encoded.includes('='), 'No padding in base64url');

const decoded = fromBase64Url(encoded);
assert(Buffer.compare(testBuffer, decoded) === 0, 'Base64url round-trip matches');

// ─── Test 6: ReceiptBuilder with E2E ───────────────────────

section('ReceiptBuilder with E2E Encryption');

const keys = generateKeyPair();
const serialized = serializeKeyPair(keys);
const viewingKey = generateViewingKey();

const builder = new ReceiptBuilder({
  agentId: 'test-agent',
  ownerId: 'test-owner',
  secretKey: serialized.secretKey,
  viewingKey: viewingKey,
});

const testInput = 'pragma solidity ^0.8.0; contract Test { ... }';
const testOutput = 'No vulnerabilities found. Gas optimization suggested.';

const receipt = builder.build({
  action: { type: 'tool_call', name: 'slither_analysis', duration_ms: 5000 },
  model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 1000, tokens_out: 2000 },
  cost: { amount_usd: 0.05 },
  input: testInput,
  output: testOutput,
});

assert(receipt.encrypted_input !== null, 'encrypted_input is present');
assert(receipt.encrypted_output !== null, 'encrypted_output is present');
assert(receipt.hashes.input_sha256 === sha256(testInput), 'Input hash matches');
assert(receipt.hashes.output_sha256 === sha256(testOutput), 'Output hash matches');

// ─── Test 7: Encrypted fields excluded from signed payload ──

section('Signed Payload Integrity');

// Simulate extractSignablePayload (same logic as server)
const {
  signature,
  server_received_at,
  encrypted_input: _ei,
  encrypted_output: _eo,
  ...signablePayload
} = receipt as any;

assert(!('encrypted_input' in signablePayload), 'encrypted_input excluded from payload');
assert(!('encrypted_output' in signablePayload), 'encrypted_output excluded from payload');
assert(!('signature' in signablePayload), 'signature excluded from payload');
assert('hashes' in signablePayload, 'hashes still in payload');
assert('version' in signablePayload, 'version still in payload');

// ─── Test 8: Signature validates with encrypted fields ──────

section('Signature Verification');

const sigValid = verifySignature(
  signablePayload as ReceiptPayload,
  receipt.signature as ReceiptSignature
);
assert(sigValid, 'Ed25519 signature is valid on the original payload');

// ─── Test 9: Decrypted content matches hash ─────────────────

section('E2E Hash Verification Chain');

const decryptedInput = decryptField(receipt.encrypted_input!, viewingKey);
const decryptedOutput = decryptField(receipt.encrypted_output!, viewingKey);

assert(decryptedInput === testInput, 'Decrypted input matches original');
assert(decryptedOutput === testOutput, 'Decrypted output matches original');

const inputHashMatch = sha256(decryptedInput) === receipt.hashes.input_sha256;
const outputHashMatch = sha256(decryptedOutput) === receipt.hashes.output_sha256;

assert(inputHashMatch, 'SHA-256(decrypted_input) === signed input hash ✓');
assert(outputHashMatch, 'SHA-256(decrypted_output) === signed output hash ✓');

// ─── Test 10: v1.0 compatibility ────────────────────────────

section('v1.0 Backward Compatibility');

const builderV1 = new ReceiptBuilder({
  agentId: 'test-agent-v1',
  ownerId: 'test-owner',
  secretKey: serialized.secretKey,
  // No viewingKey → v1.0 mode
});

const receiptV1 = builderV1.build({
  action: { type: 'tool_call', name: 'test', duration_ms: 100 },
  model: { provider: 'openai', name: 'gpt-4', tokens_in: 50, tokens_out: 100 },
  cost: { amount_usd: 0.01 },
  input: 'test input',
  output: 'test output',
});

assert(receiptV1.encrypted_input === null, 'v1.0: no encrypted_input');
assert(receiptV1.encrypted_output === null, 'v1.0: no encrypted_output');
assert(receiptV1.hashes.input_sha256.length === 64, 'v1.0: hashes still present');

// Signature still valid for v1.0
const {
  signature: sigV1,
  server_received_at: _sra,
  encrypted_input: _ei2,
  encrypted_output: _eo2,
  ...payloadV1
} = receiptV1 as any;
const sigV1Valid = verifySignature(payloadV1 as ReceiptPayload, sigV1);
assert(sigV1Valid, 'v1.0: Ed25519 signature is valid');

// ─── Test 11: Large content encryption ──────────────────────

section('Large Content Handling');

const largeInput = 'x'.repeat(100_000); // 100KB
const largeEncrypted = encryptField(largeInput, key);
const largeDecrypted = decryptField(largeEncrypted, key);
assert(largeDecrypted === largeInput, '100KB content encrypts/decrypts correctly');
assert(largeDecrypted.length === 100_000, 'Decrypted length matches');

// ─── Test 12: Empty string encryption ───────────────────────

section('Edge Cases');

const emptyEncrypted = encryptField('', key);
const emptyDecrypted = decryptField(emptyEncrypted, key);
assert(emptyDecrypted === '', 'Empty string encrypts/decrypts correctly');

const unicodeInput = '日本語テスト 🔐 Ñoño € £ ¥';
const unicodeEncrypted = encryptField(unicodeInput, key);
const unicodeDecrypted = decryptField(unicodeEncrypted, key);
assert(unicodeDecrypted === unicodeInput, 'Unicode content round-trips correctly');

// ─── Summary ─────────────────────────────────────────────

console.log(`\n${'═'.repeat(50)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(50)}\n`);

if (failed > 0) {
  process.exit(1);
}
