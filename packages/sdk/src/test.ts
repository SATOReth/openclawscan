import {
  OpenClawScan,
  generateKeyPair,
  serializeKeyPair,
  sha256,
  verifyReceipt,
} from './index';
import type { SignedReceipt } from './types';

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}`);
      failed++;
    }
  }

  // ─── Test 1: Key Generation ─────────────────────────────
  console.log('\n🔑 Test 1: Key Generation');
  const keys = generateKeyPair();
  assert(keys.publicKey.length === 32, 'Public key is 32 bytes');
  assert(keys.secretKey.length === 64, 'Secret key is 64 bytes');

  const serialized = serializeKeyPair(keys);
  assert(typeof serialized.publicKey === 'string', 'Serialized public key is string');
  assert(typeof serialized.secretKey === 'string', 'Serialized secret key is string');

  // ─── Test 2: SHA-256 Hashing ────────────────────────────
  console.log('\n#️⃣  Test 2: SHA-256 Hashing');
  const hash1 = sha256('hello world');
  const hash2 = sha256('hello world');
  const hash3 = sha256('hello world!');
  assert(hash1 === hash2, 'Same input produces same hash');
  assert(hash1 !== hash3, 'Different input produces different hash');
  assert(hash1.length === 64, 'Hash is 64 hex chars');
  assert(/^[a-f0-9]{64}$/.test(hash1), 'Hash matches hex pattern');

  // ─── Test 3: Receipt Generation ─────────────────────────
  console.log('\n📄 Test 3: Receipt Generation');
  const scanner = new OpenClawScan({
    agentId: 'test-agent-001',
    ownerId: 'github:testuser',
    secretKey: serialized.secretKey,
    localBackupPath: '/tmp/openclawscan-test',
  });

  const receipt = scanner.captureSync({
    action: {
      type: 'tool_call',
      name: 'web_search',
      duration_ms: 1200,
    },
    model: {
      provider: 'anthropic',
      name: 'claude-sonnet-4-5',
      tokens_in: 500,
      tokens_out: 1200,
    },
    cost: {
      amount_usd: 0.015,
    },
    input: 'search for smart contract vulnerabilities',
    output: 'Found 3 potential vulnerabilities in the contract...',
  });

  assert(receipt.version === '1.0', 'Version is 1.0');
  assert(receipt.receipt_id.startsWith('rcpt_'), 'Receipt ID starts with rcpt_');
  assert(receipt.agent_id === 'test-agent-001', 'Agent ID matches');
  assert(receipt.owner_id === 'github:testuser', 'Owner ID matches');
  assert(receipt.action.type === 'tool_call', 'Action type matches');
  assert(receipt.action.name === 'web_search', 'Action name matches');
  assert(receipt.model.name === 'claude-sonnet-4-5', 'Model name matches');
  assert(receipt.hashes.input_sha256.length === 64, 'Input hash is valid');
  assert(receipt.hashes.output_sha256.length === 64, 'Output hash is valid');
  assert(receipt.context.sequence === 0, 'First receipt has sequence 0');
  assert(receipt.signature.algorithm === 'ed25519', 'Signature algorithm is ed25519');
  assert(receipt.signature.public_key === serialized.publicKey, 'Public key matches');
  assert(receipt.signature.value.length > 0, 'Signature value is not empty');

  // ─── Test 4: Signature Verification ─────────────────────
  console.log('\n🔐 Test 4: Signature Verification');
  const verifyResult = OpenClawScan.verify(receipt);
  assert(verifyResult.signatureValid === true, 'Signature is valid');
  assert(verifyResult.hashMatch === null, 'Hash match is null (no original data provided)');

  // ─── Test 5: Hash Verification with Original Data ───────
  console.log('\n🔍 Test 5: Hash Verification with Original Data');
  const verifyWithData = OpenClawScan.verify(
    receipt,
    'Found 3 potential vulnerabilities in the contract...'
  );
  assert(verifyWithData.signatureValid === true, 'Signature still valid');
  assert(verifyWithData.hashMatch === true, 'Output hash matches original data');

  const verifyWithWrongData = OpenClawScan.verify(
    receipt,
    'This is not the original output'
  );
  assert(verifyWithWrongData.signatureValid === true, 'Signature valid even with wrong data');
  assert(verifyWithWrongData.hashMatch === false, 'Hash does NOT match wrong data');

  // ─── Test 6: Tamper Detection ───────────────────────────
  console.log('\n🛡️  Test 6: Tamper Detection');
  // Try to modify a receipt and verify — should fail
  const tamperedReceipt: SignedReceipt = {
    ...receipt,
    cost: { ...receipt.cost, amount_usd: 999.99 }, // tampered!
  };
  const tamperResult = OpenClawScan.verify(tamperedReceipt);
  assert(tamperResult.signatureValid === false, 'Tampered receipt signature is INVALID');

  // ─── Test 7: Sequence Numbers ───────────────────────────
  console.log('\n🔢 Test 7: Sequence Numbers');
  const receipt2 = scanner.captureSync({
    action: { type: 'file_write', name: 'report.md', duration_ms: 300 },
    model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 200, tokens_out: 800 },
    cost: { amount_usd: 0.008 },
    input: 'write report',
    output: '# Report\n\nFindings...',
  });

  const receipt3 = scanner.captureSync({
    action: { type: 'api_request', name: 'etherscan_api', duration_ms: 800 },
    model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 100, tokens_out: 400 },
    cost: { amount_usd: 0.004 },
    input: 'get contract source',
    output: '// SPDX-License-Identifier: MIT...',
  });

  assert(receipt2.context.sequence === 1, 'Second receipt has sequence 1');
  assert(receipt3.context.sequence === 2, 'Third receipt has sequence 2');
  assert(receipt2.context.session_id === receipt3.context.session_id, 'Same session ID');

  // ─── Test 8: New Session ────────────────────────────────
  console.log('\n🔄 Test 8: New Session');
  const oldSession = scanner.getSessionId();
  const newSession = scanner.newSession();
  assert(newSession !== oldSession, 'New session has different ID');

  const receipt4 = scanner.captureSync({
    action: { type: 'web_search', name: 'google', duration_ms: 500 },
    model: { provider: 'openai', name: 'gpt-4o', tokens_in: 50, tokens_out: 200 },
    cost: { amount_usd: 0.002 },
    input: 'test query',
    output: 'test result',
  });
  assert(receipt4.context.sequence === 0, 'Sequence resets with new session');
  assert(receipt4.context.session_id === newSession, 'New session ID is used');

  // ─── Test 9: Privacy — No Raw Data in Receipt ───────────
  console.log('\n🔒 Test 9: Privacy — No Raw Data in Receipt');
  const receiptJson = JSON.stringify(receipt);
  assert(
    !receiptJson.includes('search for smart contract vulnerabilities'),
    'Raw input is NOT in receipt'
  );
  assert(
    !receiptJson.includes('Found 3 potential vulnerabilities'),
    'Raw output is NOT in receipt'
  );

  // ─── Results ────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(50));

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! SDK core is working correctly.');
    console.log('\nSample receipt:');
    console.log(JSON.stringify(receipt, null, 2));
  }
}

runTests().catch(console.error);
