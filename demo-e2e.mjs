#!/usr/bin/env node
/**
 * OpenClawScan E2E Demo — Generate signed + encrypted receipts.
 *
 * Run from project root:
 *   node demo-e2e.mjs --api-key ocs_xxx --agent-id my-agent --secret-key BASE64_SECRET
 *
 * This script:
 *   1. Generates a random AES-256-GCM viewing key
 *   2. Creates a task with key_hash (SHA-256 of viewing key)
 *   3. Generates 8 receipts: Ed25519 signed + AES-256-GCM encrypted I/O
 *   4. Completes task with encrypted summary
 *   5. Prints the task URL with #key=VIEWING_KEY for browser decryption
 *
 * Encryption format: base64( IV_12B || ciphertext || authTag_16B )
 * The server stores encrypted blobs — only someone with the viewing key can decrypt.
 * SHA-256 hashes in the signed payload let the browser verify decrypted data is authentic.
 */

import { createRequire } from 'module';
import { createHash, randomBytes, createCipheriv } from 'crypto';

// Load tweetnacl from project dependencies
const require = createRequire(import.meta.url);
let nacl, naclUtil;
try {
  nacl = require('tweetnacl');
  naclUtil = require('tweetnacl-util');
} catch {
  try {
    nacl = require('./apps/web/node_modules/tweetnacl');
    naclUtil = require('./apps/web/node_modules/tweetnacl-util');
  } catch {
    console.error('\n  ✗ Cannot find tweetnacl. Run from project root after npm install.\n');
    process.exit(1);
  }
}

// ── SHA-256 ────────────────────────────────────────────────

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function sha256Bytes(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

// ── Base64url helpers ──────────────────────────────────────

function toBase64Url(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ── AES-256-GCM Encryption ────────────────────────────────
// Format: base64( IV_12B || ciphertext || authTag_16B )
// Must match what e2e-decrypt.ts expects in the browser.

function encryptField(plaintext, keyBuffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyBuffer, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16 bytes

  // Concatenate: IV || ciphertext || authTag
  const blob = Buffer.concat([iv, encrypted, authTag]);
  return blob.toString('base64');
}

// ── Deep sort keys (must match SDK/browser exactly) ────────

function deepSortKeys(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepSortKeys);
  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = deepSortKeys(obj[key]);
  }
  return sorted;
}

// ── Ed25519 signing ────────────────────────────────────────

function signPayload(payload, secretKeyB64) {
  const secretKey = naclUtil.decodeBase64(secretKeyB64);
  const sorted = deepSortKeys(payload);
  const json = JSON.stringify(sorted);
  const messageBytes = new TextEncoder().encode(json);
  const signature = nacl.sign.detached(messageBytes, secretKey);
  return naclUtil.encodeBase64(signature);
}

function getPublicKeyFromSecret(secretKeyB64) {
  const secretKey = naclUtil.decodeBase64(secretKeyB64);
  const keyPair = nacl.sign.keyPair.fromSecretKey(secretKey);
  return naclUtil.encodeBase64(keyPair.publicKey);
}

// ── Config ──────────────────────────────────────────────────

const API_URL = process.env.API_URL || 'https://openclawscan.xyz';

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--api-key') config.apiKey = args[++i];
    else if (args[i] === '--agent-id') config.agentId = args[++i];
    else if (args[i] === '--secret-key') config.secretKey = args[++i];
    else if (args[i] === '--url') config.url = args[++i];
  }
  return config;
}

// ── Demo actions (realistic smart contract audit) ──────────

const DEMO_ACTIONS = [
  {
    action: { type: 'tool_call', name: 'fetch_contract_source', duration_ms: 1240 },
    model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 520, tokens_out: 3840 },
    cost: { amount_usd: 0.018, was_routed: false },
    input: 'Fetch and decompile contract at 0x1234...abcd on Ethereum mainnet',
    output: 'Retrieved 847 lines of Solidity. Contract: TokenVault.sol. Compiler: 0.8.19. Optimization: 200 runs.',
  },
  {
    action: { type: 'tool_call', name: 'slither_analysis', duration_ms: 8420 },
    model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 4200, tokens_out: 6100 },
    cost: { amount_usd: 0.052, was_routed: false },
    input: 'Run Slither static analysis on TokenVault.sol with all detectors enabled',
    output: 'Slither found 3 issues: 1 high (reentrancy in withdraw()), 1 medium (unchecked return value), 1 low (missing zero-address check)',
  },
  {
    action: { type: 'tool_call', name: 'manual_review', duration_ms: 15200 },
    model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 8500, tokens_out: 12400 },
    cost: { amount_usd: 0.112, was_routed: false },
    input: 'Perform manual review of TokenVault.sol focusing on access control, reentrancy, and economic attacks',
    output: 'Manual review complete. Confirmed reentrancy in withdraw(). Found additional issue: flash loan attack vector in deposit/borrow cycle. Severity: Critical.',
  },
  {
    action: { type: 'tool_call', name: 'foundry_poc', duration_ms: 22100 },
    model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 6200, tokens_out: 9800 },
    cost: { amount_usd: 0.084, was_routed: false },
    input: 'Write Foundry proof-of-concept exploit for the reentrancy vulnerability in withdraw()',
    output: 'PoC written and tested. Attack drains 100% of vault funds in single transaction. Forge test passed: testReentrancyExploit() — stolen 1000 ETH from 1000 ETH vault.',
  },
  {
    action: { type: 'tool_call', name: 'gas_analysis', duration_ms: 3100 },
    model: { provider: 'anthropic', name: 'claude-haiku-4-5', tokens_in: 2100, tokens_out: 1800 },
    cost: { amount_usd: 0.008, was_routed: true },
    input: 'Analyze gas costs of all external functions in TokenVault.sol',
    output: 'Gas report: deposit() 45,230 | withdraw() 62,100 | borrow() 78,400 | repay() 38,900. withdraw() is 38% above average — suggests optimization opportunity.',
  },
  {
    action: { type: 'tool_call', name: 'generate_fixes', duration_ms: 11800 },
    model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 7200, tokens_out: 8900 },
    cost: { amount_usd: 0.086, was_routed: false },
    input: 'Generate patched version of TokenVault.sol fixing all identified vulnerabilities',
    output: 'Patched contract ready. Changes: (1) Added ReentrancyGuard to withdraw(), (2) Added return value check on token.transfer(), (3) Added zero-address validation, (4) Added flash loan protection delay.',
  },
  {
    action: { type: 'tool_call', name: 'verify_fixes', duration_ms: 9400 },
    model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 5800, tokens_out: 4200 },
    cost: { amount_usd: 0.048, was_routed: false },
    input: 'Re-run Slither and Foundry tests on patched TokenVault.sol to verify all fixes',
    output: 'All fixes verified. Slither: 0 high, 0 medium, 0 low. Foundry PoC: testReentrancyExploit() — REVERTED as expected. All 24 unit tests passing.',
  },
  {
    action: { type: 'tool_call', name: 'generate_report', duration_ms: 7600 },
    model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 9400, tokens_out: 15200 },
    cost: { amount_usd: 0.138, was_routed: false },
    input: 'Generate final audit report for TokenVault.sol including all findings, PoCs, and recommended fixes',
    output: 'Audit report generated. 12 pages. Summary: 1 Critical (reentrancy), 1 High (flash loan), 1 Medium (unchecked return), 1 Low (zero-address). All fixed and verified. Overall risk: LOW (post-fix).',
  },
];

const TASK_SUMMARY = `TokenVault.sol Security Audit — Complete

Findings:
• 1 Critical: Reentrancy in withdraw() — fixed with ReentrancyGuard
• 1 High: Flash loan attack vector in deposit/borrow — fixed with delay protection
• 1 Medium: Unchecked return value on transfer() — fixed with require()
• 1 Low: Missing zero-address check — fixed with validation

All vulnerabilities patched and verified. Slither clean. Foundry PoC reverts correctly.
Final risk assessment: LOW (post-fix).`;

// ── Main ────────────────────────────────────────────────────

async function main() {
  const config = parseArgs();
  const url = config.url || API_URL;

  if (!config.apiKey || !config.agentId || !config.secretKey) {
    console.error('\n  ◈ OpenClawScan E2E Demo\n');
    console.error('  Usage:');
    console.error('    node demo-e2e.mjs --api-key ocs_xxx --agent-id my-agent --secret-key BASE64_SECRET\n');
    console.error('  Get your API key from: https://openclawscan.xyz/dashboard');
    console.error('  Register an agent at:  https://openclawscan.xyz/dashboard/agents\n');
    process.exit(1);
  }

  const publicKey = getPublicKeyFromSecret(config.secretKey);

  // Verify the key looks correct
  try {
    const testMsg = new TextEncoder().encode('test');
    const secretKey = naclUtil.decodeBase64(config.secretKey);
    const sig = nacl.sign.detached(testMsg, secretKey);
    const pubKey = naclUtil.decodeBase64(publicKey);
    if (!nacl.sign.detached.verify(testMsg, sig, pubKey)) throw new Error('Self-verification failed');
  } catch (e) {
    console.error(`\n  ✗ Invalid secret key: ${e.message}\n`);
    process.exit(1);
  }

  // ── Step 0: Generate viewing key ──────────────────────────
  // 32 random bytes → base64url (no padding) — this is the AES-256 key
  const viewingKeyBuffer = randomBytes(32);
  const viewingKey = toBase64Url(viewingKeyBuffer);

  // key_hash = SHA-256 of the base64url STRING (matches browser's verifyKeyHash)
  const keyHash = sha256(viewingKey);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  };

  console.log('\n  ◈ OpenClawScan E2E Demo (AES-256-GCM + Ed25519)\n');
  console.log(`  API:          ${url}`);
  console.log(`  Agent:        ${config.agentId}`);
  console.log(`  Public key:   ${publicKey.slice(0, 20)}...`);
  console.log(`  Viewing key:  ${viewingKey.slice(0, 16)}...`);
  console.log(`  Key hash:     ${keyHash.slice(0, 16)}...`);
  console.log('');

  // ── Step 1: Create task with key_hash ─────────────────────
  console.log('  [1/4] Creating E2E encrypted task...');
  const taskRes = await fetch(`${url}/api/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      agent_id: config.agentId,
      name: 'Smart Contract Audit — TokenVault.sol (E2E Encrypted)',
      description: 'Full security audit with E2E encrypted input/output. Viewing key required to see content.',
      key_hash: keyHash,
    }),
  });

  if (!taskRes.ok) {
    const err = await taskRes.json().catch(() => ({}));
    console.error(`  ✗ Failed to create task: ${err.error || taskRes.statusText}`);
    process.exit(1);
  }

  const task = await taskRes.json();
  console.log(`  ✓ Task created: ${task.slug}`);
  console.log(`  ✓ Key hash stored on server`);
  console.log('');

  // ── Step 2: Send encrypted receipts ───────────────────────
  console.log(`  [2/4] Sending ${DEMO_ACTIONS.length} E2E encrypted receipts...`);
  const sessionId = `sess_${Date.now().toString(36)}`;
  const baseTime = Date.now() - (DEMO_ACTIONS.length * 30000);

  for (let i = 0; i < DEMO_ACTIONS.length; i++) {
    const a = DEMO_ACTIONS[i];
    const timestamp = new Date(baseTime + (i * 30000)).toISOString();
    const receiptId = `rcpt_e2e_${Date.now().toString(36)}_${i}`;

    // Hash plaintext FIRST (goes into signed payload)
    const inputHash = sha256(a.input);
    const outputHash = sha256(a.output);

    // Encrypt plaintext with viewing key (goes as extra transport fields)
    const encryptedInput = encryptField(a.input, viewingKeyBuffer);
    const encryptedOutput = encryptField(a.output, viewingKeyBuffer);

    // Build the signed payload (contains HASHES, not encrypted data)
    const payload = {
      version: '1.0',
      receipt_id: receiptId,
      agent_id: config.agentId,
      owner_id: config.agentId,
      timestamp,
      action: a.action,
      model: a.model,
      cost: a.cost,
      hashes: { input_sha256: inputHash, output_sha256: outputHash },
      context: { task_id: task.task_id, session_id: sessionId, sequence: i },
      visibility: 'task_only',
    };

    // Sign the payload with Ed25519
    const signatureValue = signPayload(payload, config.secretKey);

    // Full receipt = signed payload + signature + encrypted blobs
    const fullReceipt = {
      ...payload,
      signature: {
        algorithm: 'ed25519',
        public_key: publicKey,
        value: signatureValue,
      },
      // v1.1: E2E encrypted fields (server stores as-is, never decrypts)
      encrypted_input: encryptedInput,
      encrypted_output: encryptedOutput,
    };

    const res = await fetch(`${url}/api/receipts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(fullReceipt),
    });

    if (res.ok) {
      console.log(`  ✓ [${i + 1}/${DEMO_ACTIONS.length}] ${a.action.name} — $${a.cost.amount_usd.toFixed(3)} (encrypted)`);
    } else {
      const err = await res.json().catch(() => ({}));
      console.error(`  ✗ [${i + 1}/${DEMO_ACTIONS.length}] ${a.action.name} — ${err.error || res.statusText}`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log('');

  // ── Step 3: Encrypt and send task summary ─────────────────
  console.log('  [3/4] Encrypting task summary...');
  const encryptedSummary = encryptField(TASK_SUMMARY, viewingKeyBuffer);

  // ── Step 4: Complete task with encrypted summary ──────────
  console.log('  [4/4] Completing task with encrypted summary...');
  const completeRes = await fetch(`${url}/api/tasks`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      task_id: task.task_id,
      status: 'completed',
      encrypted_summary: encryptedSummary,
    }),
  });

  if (completeRes.ok) {
    console.log('  ✓ Task completed with encrypted summary');
  } else {
    const err = await completeRes.json().catch(() => ({}));
    console.error(`  ✗ Failed to complete task: ${err.error || completeRes.statusText}`);
  }

  // ── Summary ───────────────────────────────────────────────
  const totalCost = DEMO_ACTIONS.reduce((s, a) => s + a.cost.amount_usd, 0);
  const taskUrl = `${url}/task/${task.slug}#key=${viewingKey}`;

  console.log('\n  ══════════════════════════════════════════════════');
  console.log('  E2E ENCRYPTION SUMMARY');
  console.log('  ══════════════════════════════════════════════════');
  console.log(`  Total cost:       $${totalCost.toFixed(3)}`);
  console.log(`  Total receipts:   ${DEMO_ACTIONS.length}`);
  console.log(`  Encryption:       AES-256-GCM`);
  console.log(`  Signatures:       Ed25519`);
  console.log('');
  console.log('  ── LINKS ──');
  console.log(`  ◈ Task (encrypted):  ${url}/task/${task.slug}`);
  console.log(`  ◈ Task (decrypted):  ${taskUrl}`);
  console.log(`  ◈ Verify signatures: ${url}/scan?q=${task.slug}`);
  console.log('');
  console.log('  ── VIEWING KEY (save this!) ──');
  console.log(`  ${viewingKey}`);
  console.log('');
  console.log('  Without the viewing key, the server only has encrypted blobs.');
  console.log('  The key never touches the server — it stays in the URL fragment.');
  console.log('  ══════════════════════════════════════════════════\n');
}

main().catch(err => { console.error(err); process.exit(1); });
