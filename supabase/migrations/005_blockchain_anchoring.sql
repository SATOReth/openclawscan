-- ============================================================
-- OpenClawScan — 005: Blockchain Anchoring (Base L2)
-- ============================================================
-- Adds on-chain certification via Merkle proofs.
-- ClawVerify.sol deployed at 0x095525d68481a84ffDD4740aaB07f425b84718D3
-- on Base L2 mainnet (chain ID 8453).
-- ============================================================

-- ─── Certification Batches ──────────────────────────────────
-- Each batch = one on-chain TX storing a Merkle root.

CREATE TABLE IF NOT EXISTS certification_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,

  -- Merkle tree
  merkle_root TEXT NOT NULL,
  leaf_count INT NOT NULL,
  leaf_hashes JSONB NOT NULL DEFAULT '[]',

  -- On-chain data
  tx_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  batch_id_onchain INT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'base_l2',
  chain_id INT NOT NULL DEFAULT 8453,

  -- Cost tracking
  gas_used BIGINT,
  cost_wei TEXT,
  cost_usd REAL,

  -- Certifier
  certifier_address TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cert_batches_task ON certification_batches(task_id);
CREATE INDEX idx_cert_batches_tx ON certification_batches(tx_hash);
CREATE INDEX idx_cert_batches_root ON certification_batches(merkle_root);

-- ─── Add blockchain columns to receipts ─────────────────────

ALTER TABLE receipts ADD COLUMN IF NOT EXISTS merkle_proof JSONB;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS certification_batch_id UUID REFERENCES certification_batches(id);

-- ─── Add certification status to tasks ──────────────────────

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_certified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS certified_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS certification_batch_id UUID REFERENCES certification_batches(id);

-- ─── Add certification stats to agents ──────────────────────

ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_certified_batches INT NOT NULL DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_certified_receipts INT NOT NULL DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_certified_at TIMESTAMPTZ;

-- ─── Trigger: update agent stats on certification ───────────

CREATE OR REPLACE FUNCTION update_agent_certification_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE agents
  SET total_certified_batches = total_certified_batches + 1,
      total_certified_receipts = total_certified_receipts + NEW.leaf_count,
      last_certified_at = now()
  WHERE id = NEW.agent_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_certification_batch_inserted
  AFTER INSERT ON certification_batches
  FOR EACH ROW EXECUTE FUNCTION update_agent_certification_stats();

-- ─── RLS for certification_batches ──────────────────────────

ALTER TABLE certification_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY cert_batches_owner ON certification_batches
  FOR ALL USING (owner_id IN (SELECT id FROM owners WHERE auth_id = auth.uid()));

CREATE POLICY cert_batches_public ON certification_batches
  FOR SELECT USING (true);
