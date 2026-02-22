import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { jsonError } from '@/lib/auth';

/**
 * GET /api/public/task/[slug]/receipts — Public receipt list for a task.
 * Returns all receipts ordered by sequence. No auth required.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  // First get the task
  const { data: task } = await supabaseAdmin
    .from('tasks')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!task) {
    return jsonError('Task not found', 404);
  }

  // Get all receipts for this task (only public/task_only visibility)
  const { data: receipts, error } = await supabaseAdmin
    .from('receipts')
    .select(`
      receipt_id, timestamp, server_received_at,
      action_type, action_name, action_duration_ms,
      model_provider, model_name, tokens_in, tokens_out,
      cost_usd, was_routed,
      input_sha256, output_sha256,
      session_id, sequence, visibility,
      signature_algorithm, signature_public_key, signature_value,
      signed_payload
    `)
    .eq('task_id', task.id)
    .in('visibility', ['public', 'task_only'])
    .order('sequence', { ascending: true });

  if (error) {
    return jsonError('Failed to fetch receipts', 500);
  }

  return Response.json({
    task_id: task.id,
    total: receipts?.length || 0,
    receipts: (receipts || []).map(r => ({
      receipt_id: r.receipt_id,
      timestamp: r.timestamp,
      server_received_at: r.server_received_at,
      action: {
        type: r.action_type,
        name: r.action_name,
        duration_ms: r.action_duration_ms,
      },
      model: {
        provider: r.model_provider,
        name: r.model_name,
        tokens_in: r.tokens_in,
        tokens_out: r.tokens_out,
      },
      cost_usd: r.cost_usd,
      hashes: {
        input: r.input_sha256,
        output: r.output_sha256,
      },
      sequence: r.sequence,
      signature: {
        algorithm: r.signature_algorithm,
        public_key: r.signature_public_key,
        value: r.signature_value,
      },
      signed_payload: r.signed_payload,
    })),
  });
}
