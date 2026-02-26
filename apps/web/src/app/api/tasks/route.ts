/**
 * GET /api/tasks?slug=SLUG — Fetch task details by slug.
 * Used by the certification flow and task pages.
 * Supports both API key auth and session auth.
 * Public tasks are accessible without auth.
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateRequest, jsonError } from '@/lib/auth';
import { authenticateSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  const taskId = req.nextUrl.searchParams.get('id');

  if (!slug && !taskId) {
    return jsonError('Missing query parameter: slug or id', 400);
  }

  // ── Fetch task ────────────────────────────────────────────
  let query = supabaseAdmin
    .from('tasks')
    .select(`
      id, slug, name, description, status,
      agent_id, owner_id,
      total_receipts, total_duration_ms, total_cost_usd,
      total_tokens_in, total_tokens_out,
      is_certified, certified_at, certification_batch_id,
      started_at, completed_at, created_at
    `);

  if (slug) {
    query = query.eq('slug', slug);
  } else {
    query = query.eq('id', taskId);
  }

  const { data: task, error } = await query.single();

  if (error || !task) {
    return jsonError('Task not found', 404);
  }

  // ── If certified, fetch certification details ─────────────
  let certification = null;
  if (task.is_certified && task.certification_batch_id) {
    const { data: batch } = await supabaseAdmin
      .from('certification_batches')
      .select(`
        id, merkle_root, receipt_count, leaf_hashes,
        chain, chain_id, contract_address,
        tx_hash, block_number, batch_id_onchain,
        gas_used, cost_wei, cost_usd,
        certifier_address, certified_at
      `)
      .eq('id', task.certification_batch_id)
      .single();

    if (batch) {
      certification = {
        ...batch,
        cost_eth: batch.cost_wei
          ? (Number(batch.cost_wei) / 1e18).toFixed(8)
          : null,
        explorer_url: `https://basescan.org/tx/${batch.tx_hash}`,
      };
    }
  }

  // ── Auth check for private tasks ──────────────────────────
  // For now, all task metadata is public (receipts have their own visibility)
  // But we include ownership info for the frontend

  let isOwner = false;
  const apiAuth = await authenticateRequest(req);
  if (apiAuth && apiAuth.ownerId === task.owner_id) {
    isOwner = true;
  } else {
    const session = await authenticateSession(req);
    if (session && session.ownerId === task.owner_id) {
      isOwner = true;
    }
  }

  return Response.json({
    task: {
      ...task,
      is_owner: isOwner,
    },
    certification,
  });
}
