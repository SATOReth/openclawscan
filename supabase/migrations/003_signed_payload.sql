-- ============================================================
-- Migration 003: Store original signed payload for client-side verification
-- ============================================================

-- The signed payload is the exact JSON that was signed by the agent.
-- Storing it allows anyone to verify signatures client-side without
-- needing to reconstruct the payload from individual columns.
-- This is critical for trustless verification.

ALTER TABLE receipts ADD COLUMN signed_payload JSONB;

-- For future receipts, this will be NOT NULL.
-- Existing receipts (if any) will have NULL.
