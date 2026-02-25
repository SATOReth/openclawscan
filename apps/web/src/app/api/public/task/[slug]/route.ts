import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { jsonError } from '@/lib/auth';

/**
 * GET /api/public/task/[slug] — Public task view.
 * Returns task info + receipt count. No auth required.
 * v1.1: Also returns key_hash and encrypted_summary for E2E decryption.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const { data: task, error } = await supabaseAdmin
    .from('tasks')
    .select(`
      id, slug, name, description, status,
      total_receipts, total_duration_ms, total_cost_usd,
      total_tokens_in, total_tokens_out,
      key_hash, encrypted_summary,
      created_at, completed_at,
      agents!inner(agent_id, display_name, is_public),
      owners!inner(display_name)
    `)
    .eq('slug', slug)
    .single();

  if (error || !task) {
    return jsonError('Task not found', 404);
  }

  const agent = task.agents as any;
  const owner = task.owners as any;

  return Response.json({
    task_id: task.id,
    slug: task.slug,
    name: task.name,
    description: task.description,
    status: task.status,
    total_receipts: task.total_receipts || 0,
    total_duration_ms: task.total_duration_ms || 0,
    total_cost_usd: task.total_cost_usd || 0,
    total_tokens: (task.total_tokens_in || 0) + (task.total_tokens_out || 0),
    created_at: task.created_at,
    completed_at: task.completed_at,
    // v1.1: E2E encryption fields
    key_hash: task.key_hash || null,
    encrypted_summary: task.encrypted_summary || null,
    agent: {
      id: agent.agent_id,
      name: agent.display_name,
    },
    owner: {
      name: owner.display_name,
    },
  });
}
