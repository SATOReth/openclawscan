import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { jsonError } from '@/lib/auth';
import { authenticateSession } from '@/lib/session';

/**
 * GET /api/dashboard/stats — Dashboard overview stats.
 * Requires Supabase auth session.
 */
export async function GET(req: NextRequest) {
  const session = await authenticateSession(req);
  if (!session) return jsonError('Unauthorized', 401);

  const ownerId = session.ownerId;

  // Agent count
  const { count: agentCount } = await supabaseAdmin
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', ownerId);

  // Total receipts
  const { count: receiptCount } = await supabaseAdmin
    .from('receipts')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', ownerId);

  // Total tasks
  const { count: taskCount } = await supabaseAdmin
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', ownerId);

  // Total cost
  const { data: costData } = await supabaseAdmin
    .from('receipts')
    .select('cost_usd')
    .eq('owner_id', ownerId);

  const totalCost = costData?.reduce((sum, r) => sum + (r.cost_usd || 0), 0) || 0;

  // Total tokens
  const { data: tokenData } = await supabaseAdmin
    .from('receipts')
    .select('tokens_in, tokens_out')
    .eq('owner_id', ownerId);

  const totalTokens = tokenData?.reduce((sum, r) => sum + (r.tokens_in || 0) + (r.tokens_out || 0), 0) || 0;

  // Recent activity (last 5 receipts)
  const { data: recent } = await supabaseAdmin
    .from('receipts')
    .select('receipt_id, action_type, action_name, cost_usd, timestamp, action_duration_ms')
    .eq('owner_id', ownerId)
    .order('timestamp', { ascending: false })
    .limit(5);

  return Response.json({
    agents: agentCount || 0,
    receipts: receiptCount || 0,
    tasks: taskCount || 0,
    total_cost_usd: totalCost,
    total_tokens: totalTokens,
    recent: recent || [],
  });
}
