import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabase';

export interface SessionContext {
  userId: string;
  ownerId: string;
  tier: string;
  displayName: string;
}

/**
 * Authenticate a dashboard request using Supabase session cookie.
 * Returns owner context or null.
 */
export async function authenticateSession(
  _req?: NextRequest
): Promise<SessionContext | null> {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Look up owner by auth_id
    const { data: owner } = await supabaseAdmin
      .from('owners')
      .select('id, tier, display_name')
      .eq('auth_id', user.id)
      .single();

    if (!owner) return null;

    return {
      userId: user.id,
      ownerId: owner.id,
      tier: owner.tier,
      displayName: owner.display_name,
    };
  } catch {
    return null;
  }
}
