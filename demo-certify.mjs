#!/usr/bin/env node

/**
 * demo-certify.mjs — Test the full certification flow.
 *
 * This script calls POST /api/tasks/certify to certify a completed task.
 * Use after running demo-e2e.mjs to create a task with receipts.
 *
 * Usage:
 *   node demo-certify.mjs --api-key ocs_xxx --task-slug SLUG
 *   node demo-certify.mjs --api-key ocs_xxx --task-slug SLUG --url http://localhost:3000
 */

const API_URL = 'https://openclawscan.xyz';

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--api-key') config.apiKey = args[++i];
    else if (args[i] === '--task-slug') config.taskSlug = args[++i];
    else if (args[i] === '--task-id') config.taskId = args[++i];
    else if (args[i] === '--url') config.url = args[++i];
  }
  return config;
}

async function main() {
  const config = parseArgs();
  const url = config.url || API_URL;

  if (!config.apiKey || (!config.taskSlug && !config.taskId)) {
    console.error('\n  ◈ OpenClawScan — Certify Demo\n');
    console.error('  Usage:');
    console.error('    node demo-certify.mjs --api-key ocs_xxx --task-slug YOUR_TASK_SLUG');
    console.error('    node demo-certify.mjs --api-key ocs_xxx --task-id UUID\n');
    console.error('  Options:');
    console.error('    --url URL    API base URL (default: https://openclawscan.xyz)');
    console.error('');
    process.exit(1);
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  };

  console.log('\n  ◈ OpenClawScan — Certify Demo\n');
  console.log(`  API: ${url}`);

  // ── Step 1: Find the task ─────────────────────────────────
  let taskId = config.taskId;

  if (!taskId && config.taskSlug) {
    console.log(`  Looking up task: ${config.taskSlug}`);

    const res = await fetch(`${url}/api/tasks?slug=${config.taskSlug}`, { headers });
    const data = await res.json();

    if (!res.ok) {
      console.error(`\n  ✗ Task lookup failed: ${data.error || res.statusText}\n`);
      process.exit(1);
    }

    taskId = data.task?.id;
    if (!taskId) {
      console.error(`\n  ✗ Task not found: ${config.taskSlug}\n`);
      process.exit(1);
    }

    console.log(`  Task ID: ${taskId}`);
    console.log(`  Status:  ${data.task.status}`);
    console.log(`  Receipts: ${data.task.total_receipts}`);

    if (data.task.is_certified) {
      console.log(`\n  ⚠ Task is already certified on-chain.`);
      console.log(`  TX: ${data.task.certification?.tx_hash || 'N/A'}\n`);
      process.exit(0);
    }

    if (data.task.status !== 'completed') {
      console.log(`\n  ⚠ Task must be completed first (current: ${data.task.status}).`);
      console.log(`  Complete it first, then re-run this script.\n`);
      process.exit(1);
    }
  }

  // ── Step 2: Certify ───────────────────────────────────────
  console.log('');
  console.log('  ⛓ Certifying on Base L2 mainnet...');
  console.log('    Building Merkle tree...');
  console.log('    Sending transaction...');
  console.log('    (this may take 5-15 seconds)');
  console.log('');

  const certRes = await fetch(`${url}/api/tasks/certify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ task_id: taskId }),
  });

  const certData = await certRes.json();

  if (!certRes.ok) {
    console.error(`  ✗ Certification failed: ${certData.error || certRes.statusText}\n`);
    if (certData.warning) {
      console.log(`  ⚠ ${certData.warning}`);
      console.log(`  TX: ${certData.tx_hash}`);
    }
    process.exit(1);
  }

  // ── Step 3: Show results ──────────────────────────────────
  const cert = certData.certification;
  const task = certData.task;

  console.log('  ✓ Certified on-chain!\n');
  console.log('  ┌───────────────────────────────────────────────────────┐');
  console.log('  │  ⛓  ON-CHAIN CERTIFICATION COMPLETE                  │');
  console.log('  └───────────────────────────────────────────────────────┘');
  console.log('');
  console.log(`  Merkle Root:    ${cert.merkle_root}`);
  console.log(`  Batch ID:       #${cert.batch_id_onchain}`);
  console.log(`  Receipts:       ${cert.receipt_count}`);
  console.log(`  TX Hash:        ${cert.tx_hash}`);
  console.log(`  Block:          ${cert.block_number}`);
  console.log(`  Gas:            ${cert.gas_used}`);
  console.log(`  Cost:           ${cert.cost_eth} ETH`);
  console.log(`  Contract:       ${cert.contract_address}`);
  console.log('');
  console.log(`  BaseScan:       ${cert.explorer_url}`);
  console.log(`  Task page:      ${task.task_url}`);
  console.log('');
  console.log('  3-Level Verification:');
  console.log('    ✓ Level 1: Ed25519 signature (agent signed it)');
  console.log('    ✓ Level 2: AES-256-GCM encryption (data authentic)');
  console.log('    ✓ Level 3: Merkle proof on Base L2 (immutable)');
  console.log('');
}

main().catch((err) => {
  console.error('\n  ✗ Error:', err.message || err);
  process.exit(1);
});
