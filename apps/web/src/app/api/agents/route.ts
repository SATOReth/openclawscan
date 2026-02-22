import { NextRequest } from 'next/server';
import { authenticateRequest, jsonError } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/agents — Register a new agent.
 * Requires: agent_id, display_name, public_key
 * 
 * Free tier: 1 agent max
 * Pro/API tier: unlimited
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return jsonError('Invalid or missing API key', 401);

  let body: { agent_id: string; display_name: string; public_key: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  if (!body.agent_id || !body.display_name || !body.public_key) {
    return jsonError('Missing required fields: agent_id, display_name, public_key', 400);
  }

  // Check agent limit for free tier
  if (auth.tier === 'free') {
    const { count } = await supabaseAdmin
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', auth.ownerId);

    if ((count ?? 0) >= 1) {
      return jsonError('Free tier allows 1 agent. Upgrade to Pro for unlimited.', 429);
    }
  }

  // Check for duplicate agent_id for this owner
  const { data: existing } = await supabaseAdmin
    .from('agents')
    .select('id')
    .eq('owner_id', auth.ownerId)
    .eq('agent_id', body.agent_id)
    .single();

  if (existing) {
    return jsonError('Agent with this ID already registered', 409);
  }

  // Insert
  const { data: agent, error } = await supabaseAdmin
    .from('agents')
    .insert({
      owner_id: auth.ownerId,
      agent_id: body.agent_id,
      display_name: body.display_name,
      public_key: body.public_key,
      description: body.description || null,
    })
    .select('id, agent_id, display_name, public_key, created_at')
    .single();

  if (error) {
    console.error('Agent registration error:', error);
    return jsonError('Failed to register agent', 500);
  }

  // Initialize agent_stats row
  await supabaseAdmin.from('agent_stats').insert({ agent_id: agent.id });

  return Response.json(agent, { status: 201 });
}

/**
 * GET /api/agents — List owner's agents.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return jsonError('Invalid or missing API key', 401);

  const { data: agents, error } = await supabaseAdmin
    .from('agents')
    .select('id, agent_id, display_name, public_key, total_receipts, reputation_score, created_at, last_receipt_at')
    .eq('owner_id', auth.ownerId)
    .order('created_at', { ascending: false });

  if (error) {
    return jsonError('Failed to fetch agents', 500);
  }

  return Response.json({ agents });
}
