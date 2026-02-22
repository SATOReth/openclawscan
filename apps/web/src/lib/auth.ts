import { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase';

export interface AuthContext {
  ownerId: string;
  tier: string;
}

/**
 * Authenticate an API request via Bearer token (API key).
 * Returns the owner context or null if invalid.
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<AuthContext | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const apiKey = authHeader.slice(7);
  if (!apiKey.startsWith('ocs_')) return null;

  const { data: owner, error } = await supabaseAdmin
    .from('owners')
    .select('id, tier')
    .eq('api_key', apiKey)
    .single();

  if (error || !owner) return null;

  return {
    ownerId: owner.id,
    tier: owner.tier,
  };
}

/**
 * Simple JSON error response helper.
 */
export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/**
 * Tier-based receipt limits — REMOVED.
 * OpenClawScan is completely free with no limits.
 */
export function getReceiptLimit(_tier: string): number {
  return Infinity;
}
