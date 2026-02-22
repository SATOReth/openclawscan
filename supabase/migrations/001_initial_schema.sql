-- ============================================================
-- OpenClawScan — Initial Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Owners ─────────────────────────────────────────────────
-- An owner is a person who runs one or more agents.
-- Auth handled by Supabase Auth; this stores profile + API key.

CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE NOT NULL,            -- Supabase Auth user ID
  display_name TEXT NOT NULL,
  github_username TEXT,
  avatar_url TEXT,
  api_key TEXT UNIQUE NOT NULL,            -- for SDK authentication
  tier TEXT NOT NULL DEFAULT 'free'         -- free | pro | api
    CHECK (tier IN ('free', 'pro', 'api')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_owners_auth_id ON owners(auth_id);
CREATE INDEX idx_owners_api_key ON owners(api_key);

-- ─── Agents ─────────────────────────────────────────────────
-- An agent is a running OpenClaw instance.

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,                  -- user-chosen agent identifier
  display_name TEXT NOT NULL,
  public_key TEXT NOT NULL,                -- Ed25519 public key (base64)
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  total_receipts BIGINT NOT NULL DEFAULT 0,
  total_tasks_completed INT NOT NULL DEFAULT 0,
  reputation_score REAL NOT NULL DEFAULT 0.0,
  first_receipt_at TIMESTAMPTZ,
  last_receipt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id, agent_id)
);

CREATE INDEX idx_agents_owner ON agents(owner_id);
CREATE INDEX idx_agents_agent_id ON agents(agent_id);
CREATE INDEX idx_agents_public_key ON agents(public_key);

-- ─── Receipts ───────────────────────────────────────────────
-- The core table. Every signed receipt is stored here.
-- Raw input/output are NEVER stored — only hashes.

CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_id TEXT UNIQUE NOT NULL,         -- rcpt_xxxxxxxxxxxx
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,          -- from the receipt (agent-side)
  server_received_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Action details
  action_type TEXT NOT NULL,
  action_name TEXT NOT NULL,
  action_duration_ms INT NOT NULL,

  -- Model details
  model_provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  tokens_in INT NOT NULL,
  tokens_out INT NOT NULL,

  -- Cost
  cost_usd REAL NOT NULL,
  was_routed BOOLEAN NOT NULL DEFAULT false,

  -- Hashes (privacy-preserving)
  input_sha256 TEXT NOT NULL,
  output_sha256 TEXT NOT NULL,

  -- Context
  task_id UUID,                            -- FK set below (nullable)
  session_id TEXT NOT NULL,
  sequence INT NOT NULL,

  -- Visibility & Signature
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'task_only', 'public')),
  signature_algorithm TEXT NOT NULL DEFAULT 'ed25519',
  signature_public_key TEXT NOT NULL,
  signature_value TEXT NOT NULL,

  -- Anchoring (optional, filled later)
  anchor_chain TEXT,                       -- 'base_l2', 'arweave', etc
  anchor_tx_hash TEXT,
  anchor_batch_id TEXT,
  anchored_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_receipts_agent ON receipts(agent_id);
CREATE INDEX idx_receipts_owner ON receipts(owner_id);
CREATE INDEX idx_receipts_receipt_id ON receipts(receipt_id);
CREATE INDEX idx_receipts_task ON receipts(task_id);
CREATE INDEX idx_receipts_timestamp ON receipts(timestamp DESC);
CREATE INDEX idx_receipts_session_seq ON receipts(session_id, sequence);
CREATE INDEX idx_receipts_visibility ON receipts(visibility);

-- ─── Tasks ──────────────────────────────────────────────────
-- A task groups related receipts. Shareable via URL slug.

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,               -- URL-friendly: openclawscan.xyz/task/[slug]
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'failed')),
  total_receipts INT NOT NULL DEFAULT 0,
  total_duration_ms BIGINT NOT NULL DEFAULT 0,
  total_cost_usd REAL NOT NULL DEFAULT 0.0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_agent ON tasks(agent_id);
CREATE INDEX idx_tasks_owner ON tasks(owner_id);
CREATE INDEX idx_tasks_slug ON tasks(slug);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Now add the FK from receipts → tasks
ALTER TABLE receipts
  ADD CONSTRAINT fk_receipts_task
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;

-- ─── Agent Stats (materialized view, refreshed) ────────────
-- Pre-computed stats for the Explorer agent profile page.

CREATE TABLE agent_stats (
  agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  total_receipts BIGINT NOT NULL DEFAULT 0,
  total_tasks INT NOT NULL DEFAULT 0,
  total_cost_usd REAL NOT NULL DEFAULT 0.0,
  total_tokens_in BIGINT NOT NULL DEFAULT 0,
  total_tokens_out BIGINT NOT NULL DEFAULT 0,
  avg_duration_ms REAL NOT NULL DEFAULT 0.0,
  most_used_model TEXT,
  most_used_action TEXT,
  active_days INT NOT NULL DEFAULT 0,
  first_receipt_at TIMESTAMPTZ,
  last_receipt_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Functions ──────────────────────────────────────────────

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_owners_updated
  BEFORE UPDATE ON owners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_agents_updated
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_tasks_updated
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Increment agent receipt count on new receipt
CREATE OR REPLACE FUNCTION increment_agent_receipts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE agents
  SET total_receipts = total_receipts + 1,
      last_receipt_at = NEW.timestamp,
      first_receipt_at = COALESCE(first_receipt_at, NEW.timestamp)
  WHERE id = NEW.agent_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_receipt_inserted
  AFTER INSERT ON receipts
  FOR EACH ROW EXECUTE FUNCTION increment_agent_receipts();

-- Update task stats on receipt insert (if receipt has task_id)
CREATE OR REPLACE FUNCTION update_task_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.task_id IS NOT NULL THEN
    UPDATE tasks
    SET total_receipts = total_receipts + 1,
        total_duration_ms = total_duration_ms + NEW.action_duration_ms,
        total_cost_usd = total_cost_usd + NEW.cost_usd
    WHERE id = NEW.task_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_receipt_task_stats
  AFTER INSERT ON receipts
  FOR EACH ROW EXECUTE FUNCTION update_task_stats();

-- Generate URL-friendly slug for tasks
CREATE OR REPLACE FUNCTION generate_task_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- Generate short random slug
  base_slug := lower(
    substr(md5(random()::text || clock_timestamp()::text), 1, 8)
  );
  final_slug := base_slug;

  -- Handle collision (very unlikely with 8 hex chars)
  WHILE EXISTS (SELECT 1 FROM tasks WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || counter::text;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_task_slug
  BEFORE INSERT ON tasks
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR NEW.slug = '')
  EXECUTE FUNCTION generate_task_slug();

-- ─── Row Level Security ─────────────────────────────────────
-- Enabled for all tables. Policies control access.

ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_stats ENABLE ROW LEVEL SECURITY;

-- Owners can only see/edit their own data
CREATE POLICY owners_self ON owners
  FOR ALL USING (auth_id = auth.uid());

-- Agents: owner sees all their agents, public can see is_public agents
CREATE POLICY agents_owner ON agents
  FOR ALL USING (owner_id IN (SELECT id FROM owners WHERE auth_id = auth.uid()));

CREATE POLICY agents_public ON agents
  FOR SELECT USING (is_public = true);

-- Receipts: owner sees all, public sees 'public' visibility
CREATE POLICY receipts_owner ON receipts
  FOR ALL USING (owner_id IN (SELECT id FROM owners WHERE auth_id = auth.uid()));

CREATE POLICY receipts_public ON receipts
  FOR SELECT USING (visibility = 'public');

-- Receipts: anyone can see task_only receipts IF they know the task slug
CREATE POLICY receipts_task_only ON receipts
  FOR SELECT USING (
    visibility = 'task_only'
    AND task_id IN (SELECT id FROM tasks)
  );

-- Tasks: owner manages, anyone can view (tasks are shareable by URL)
CREATE POLICY tasks_owner ON tasks
  FOR ALL USING (owner_id IN (SELECT id FROM owners WHERE auth_id = auth.uid()));

CREATE POLICY tasks_public ON tasks
  FOR SELECT USING (true);

-- Agent stats: same as agents
CREATE POLICY agent_stats_public ON agent_stats
  FOR SELECT USING (
    agent_id IN (SELECT id FROM agents WHERE is_public = true)
  );

-- ─── API Key Generation Helper ──────────────────────────────

CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ocs_' || encode(gen_random_bytes(24), 'hex');
END;
$$ LANGUAGE plpgsql;
