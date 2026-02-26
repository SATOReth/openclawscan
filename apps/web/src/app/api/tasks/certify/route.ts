/**
 * POST /api/tasks/certify/route.ts
 *
 * Certify a task on-chain:
 * 1. Fetch all receipts for the task
 * 2. Build Merkle tree from receipt fingerprints
 * 3. Send certifyBatch TX to ClawVerify.sol on Base mainnet
 * 4. Store certification batch in DB
 * 5. Update each receipt with its Merkle proof
 * 6. Return TX hash + BaseScan link
 *
 * Body: { task_id: string }
 * Auth: Bearer API key OR session cookie
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateRequest, jsonError } from '@/lib/auth';
import { authenticateSession } from '@/lib/session';
import { buildReceiptFingerprint, buildMerkleTree } from '@/lib/merkle';
import {
  certifyBatchOnChain,
  basescanTxUrl,
  getCertifierAddress,
  BASE_CHAIN_ID,
} from '@/lib/blockchain';

export async function POST(req: NextRequest) {
  // ── Auth (API key or session) ─────────────────────────────
  let ownerId: string;

  const apiAuth = await authenticateRequest(req);
  if (apiAuth) {
    ownerId = apiAuth.ownerId;
  } else {
    const session = await authenticateSession(req);
    if (!session) return jsonError('Unauthorized', 401);
    ownerId = session.ownerId;
  }

  // ── Parse body ────────────────────────────────────────────
  let body: { task_id: string };
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  if (!body.task_id) {
    return jsonError('Missing required field: task_id', 400);
  }

  // ── Fetch task ────────────────────────────────────────────
  const { data: task, error: taskError } = await supabaseAdmin
    .from('tasks')
    .select('id, slug, agent_id, owner_id, status, is_certified, total_receipts')
    .eq('id', body.task_id)
    .single();

  if (taskError || !task) {
    return jsonError('Task not found', 404);
  }

  if (task.owner_id !== ownerId) {
    return jsonError('Not your task', 403);
  }

  if (task.is_certified) {
    return jsonError('Task is already certified on-chain', 409);
  }

  if (task.status !== 'completed') {
    return jsonError('Task must be completed before certification. Current status: ' + task.status, 400);
  }

  // ── Fetch all receipts for this task ──────────────────────
  const { data: receipts, error: receiptsError } = await supabaseAdmin
    .from('receipts')
    .select('id, receipt_id, input_sha256, output_sha256')
    .eq('task_id', task.id)
    .order('sequence', { ascending: true });

  if (receiptsError || !receipts || receipts.length === 0) {
    return jsonError('No receipts found for this task', 400);
  }

  // ── Build receipt fingerprints ────────────────────────────
  const fingerprints: string[] = [];
  const receiptIdToFingerprint = new Map<string, string>();

  for (const r of receipts) {
    const fp = buildReceiptFingerprint({
      receipt_id: r.receipt_id,
      input_sha256: r.input_sha256,
      output_sha256: r.output_sha256,
    });
    fingerprints.push(fp);
    receiptIdToFingerprint.set(r.id, fp);
  }

  // ── Build Merkle tree ─────────────────────────────────────
  const merkleResult = buildMerkleTree(fingerprints);

  console.log(`[certify] Merkle tree built:`);
  console.log(`  Root:   ${merkleResult.root}`);
  console.log(`  Leaves: ${merkleResult.leafCount}`);

  // ── Fetch agent_id string for on-chain event ──────────────
  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('agent_id')
    .eq('id', task.agent_id)
    .single();

  const agentIdStr = agent?.agent_id || 'unknown';

  // ── Send on-chain transaction ─────────────────────────────
  let certResult;
  try {
    certResult = await certifyBatchOnChain(
      merkleResult.root,
      agentIdStr,
      task.slug,
      receipts.length
    );
  } catch (err: any) {
    console.error('[certify] On-chain TX failed:', err);
    return jsonError(
      `Blockchain transaction failed: ${err.message || 'Unknown error'}. Check wallet balance and try again.`,
      502
    );
  }

  // ── Store certification batch in DB ───────────────────────
  const contractAddress = process.env.CLAWVERIFY_CONTRACT_ADDRESS!;

  const { data: batch, error: batchError } = await supabaseAdmin
    .from('certification_batches')
    .insert({
      task_id: task.id,
      agent_id: task.agent_id,
      owner_id: ownerId,
      merkle_root: merkleResult.root,
      receipt_count: receipts.length,
      leaf_hashes: fingerprints,
      chain: 'base_l2',
      chain_id: BASE_CHAIN_ID,
      contract_address: contractAddress,
      tx_hash: certResult.txHash,
      block_number: certResult.blockNumber,
      batch_id_onchain: certResult.batchId,
      gas_used: Number(certResult.gasUsed),
      cost_wei: Number(certResult.costWei),
      cost_usd: parseFloat(certResult.costEth) * 2500, // rough ETH→USD estimate
      certifier_address: getCertifierAddress(),
    })
    .select()
    .single();

  if (batchError) {
    console.error('[certify] DB insert failed:', batchError);
    // TX already on-chain — log but don't fail completely
    return Response.json({
      warning: 'On-chain TX succeeded but DB update failed. Contact support.',
      tx_hash: certResult.txHash,
      explorer_url: certResult.explorerUrl,
      merkle_root: merkleResult.root,
      batch_id: certResult.batchId,
    }, { status: 207 });
  }

  // ── Update each receipt with its Merkle proof ─────────────
  const updatePromises = receipts.map(async (r) => {
    const fingerprint = receiptIdToFingerprint.get(r.id);
    if (!fingerprint) return;

    const proofData = merkleResult.proofs.get(fingerprint);
    if (!proofData) return;

    return supabaseAdmin
      .from('receipts')
      .update({
        merkle_proof: proofData,
        certification_batch_id: batch.id,
        anchor_chain: 'base_l2',
        anchor_tx_hash: certResult.txHash,
        anchor_batch_id: String(certResult.batchId),
        anchored_at: new Date().toISOString(),
      })
      .eq('id', r.id);
  });

  await Promise.all(updatePromises);

  // ── Response ──────────────────────────────────────────────
  return Response.json({
    success: true,
    certification: {
      batch_id: batch.id,
      batch_id_onchain: certResult.batchId,
      merkle_root: merkleResult.root,
      receipt_count: receipts.length,
      tx_hash: certResult.txHash,
      block_number: certResult.blockNumber,
      gas_used: certResult.gasUsed.toString(),
      cost_eth: certResult.costEth,
      explorer_url: certResult.explorerUrl,
      contract_address: contractAddress,
      chain: 'base_l2',
      chain_id: BASE_CHAIN_ID,
      certified_at: batch.certified_at,
    },
    task: {
      id: task.id,
      slug: task.slug,
      task_url: `https://openclawscan.xyz/task/${task.slug}`,
    },
  }, { status: 201 });
}
