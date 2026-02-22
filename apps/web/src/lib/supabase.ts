import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization — avoids crash when env vars aren't set at build time

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/** Client-side (uses anon key, respects RLS) */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

/** Server-side (bypasses RLS — use only in API routes) */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabaseAdmin;
}

// Backward-compatible proxy exports (lazy, won't crash at import time)
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) { return (getSupabase() as any)[prop]; }
});

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) { return (getSupabaseAdmin() as any)[prop]; }
});
