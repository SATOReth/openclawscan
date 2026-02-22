-- ============================================================
-- Migration 002: Auto-create owner on signup + task token columns
-- ============================================================

-- ─── Add missing token columns to tasks ─────────────────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS total_tokens_in BIGINT NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS total_tokens_out BIGINT NOT NULL DEFAULT 0;

-- Update the task stats trigger to also track tokens
CREATE OR REPLACE FUNCTION update_task_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.task_id IS NOT NULL THEN
    UPDATE tasks
    SET total_receipts = total_receipts + 1,
        total_duration_ms = total_duration_ms + NEW.action_duration_ms,
        total_cost_usd = total_cost_usd + NEW.cost_usd,
        total_tokens_in = total_tokens_in + NEW.tokens_in,
        total_tokens_out = total_tokens_out + NEW.tokens_out
    WHERE id = NEW.task_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Auto-create owner row when Supabase Auth user signs up ──
-- This trigger fires on auth.users insert and creates a matching
-- row in public.owners with a generated API key.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.owners (
    auth_id,
    display_name,
    github_username,
    avatar_url,
    api_key
  ) VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'user_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'user_name',  -- GitHub username if OAuth
    NEW.raw_user_meta_data->>'avatar_url',
    generate_api_key()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on Supabase auth.users table
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── API key display endpoint helper ────────────────────────
-- Allow owner to see their API key once (dashboard shows it)
-- No changes needed — the dashboard/stats API already returns it
-- through the authenticated session.

-- ─── Grant permissions ──────────────────────────────────────
-- Supabase Auth trigger needs SECURITY DEFINER to write to public schema
-- Already set above on handle_new_user()
