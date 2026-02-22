import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { jsonError } from '@/lib/auth';
import { authenticateSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await authenticateSession(req);
  if (!session) return jsonError('Unauthorized', 401);

  const { data: agents, error } = await supabaseAdmin
    .from('agents')
    .select('id, agent_id, display_name, public_key, description, is_public, total_receipts, total_tasks_completed, reputation_score, created_at, last_receipt_at')
    .eq('owner_id', session.ownerId)
    .order('created_at', { ascending: false });

  if (error) return jsonError('Failed to fetch agents', 500);

  return Response.json({ agents: agents || [] });
}

export async function POST(req: NextRequest) {
  const session = await authenticateSession(req);
  if (!session) return jsonError('Unauthorized', 401);

  let body: { agent_id: string; display_name: string; public_key: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  if (!body.agent_id || !body.display_name || !body.public_key) {
    return jsonError('Missing required fields: agent_id, display_name, public_key', 400);
  }

  const { data: agent, error } = await supabaseAdmin
    .from('agents')
    .insert({
      owner_id: session.ownerId,
      agent_id: body.agent_id,
      display_name: body.display_name,
      public_key: body.public_key,
      description: body.description || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return jsonError('Agent ID already exists', 409);
    return jsonError('Failed to create agent', 500);
  }

  return Response.json({ agent }, { status: 201 });
}
