import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { jsonError } from '@/lib/auth';
import { authenticateSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await authenticateSession(req);
  if (!session) return jsonError('Unauthorized', 401);

  const { data: tasks, error } = await supabaseAdmin
    .from('tasks')
    .select(`
      id, slug, name, description, status,
      total_receipts, total_duration_ms, total_cost_usd,
      created_at, completed_at,
      is_certified, certified_at,
      agents!inner(agent_id, display_name)
    `)
    .eq('owner_id', session.ownerId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return jsonError('Failed to fetch tasks', 500);

  return Response.json({
    tasks: (tasks || []).map(t => {
      const agent = t.agents as any;
      return {
        task_id: t.id,
        slug: t.slug,
        name: t.name,
        status: t.status,
        total_receipts: t.total_receipts || 0,
        total_duration_ms: t.total_duration_ms || 0,
        total_cost_usd: t.total_cost_usd || 0,
        created_at: t.created_at,
        completed_at: t.completed_at,
        is_certified: t.is_certified || false,
        certified_at: t.certified_at || null,
        agent: { id: agent.agent_id, name: agent.display_name },
      };
    }),
  });
}
