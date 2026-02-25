-- ============================================================
-- Migration 004: E2E Encryption Support (v1.1 Phase 1)
-- ============================================================
-- 
-- Adds encrypted input/output storage to receipts and
-- viewing key hash + encrypted summary to tasks.
--
-- DESIGN:
--   - encrypted_input/output = base64( IV_12B || ciphertext || authTag_16B )
--   - AES-256-GCM with random 12-byte IV per field
--   - Viewing key is per-task, never sent to server
--   - key_hash = SHA-256(viewing_key) so server can confirm key correctness
--     without ever seeing the key itself
--   - URL fragment #key=BASE64URL_KEY is never transmitted to server (HTTP spec)
--
-- BACKWARD COMPATIBLE:
--   - All new columns are nullable
--   - Existing v1.0 receipts continue to work (encrypted fields = NULL)
--   - v1.0 SDK sends no encrypted fields → server stores NULL → works fine
--   - v1.1 SDK sends encrypted fields → server stores them → frontend decrypts

-- ─── Receipts: encrypted input/output blobs ─────────────────

ALTER TABLE receipts 
  ADD COLUMN IF NOT EXISTS encrypted_input TEXT,
  ADD COLUMN IF NOT EXISTS encrypted_output TEXT;

COMMENT ON COLUMN receipts.encrypted_input IS 
  'AES-256-GCM encrypted raw input. Format: base64(IV_12B || ciphertext || authTag_16B). NULL for v1.0 receipts.';
COMMENT ON COLUMN receipts.encrypted_output IS 
  'AES-256-GCM encrypted raw output. Format: base64(IV_12B || ciphertext || authTag_16B). NULL for v1.0 receipts.';

-- ─── Tasks: viewing key hash + encrypted summary ────────────

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS key_hash TEXT,
  ADD COLUMN IF NOT EXISTS encrypted_summary TEXT;

COMMENT ON COLUMN tasks.key_hash IS 
  'SHA-256 hex hash of the AES-256-GCM viewing key. Used to verify the key in the URL fragment is correct without revealing the key to the server. NULL for v1.0 tasks.';
COMMENT ON COLUMN tasks.encrypted_summary IS 
  'AES-256-GCM encrypted task summary/conclusion. Decrypted client-side with the viewing key. NULL if not provided.';

-- ─── Index for key_hash lookups ─────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tasks_key_hash ON tasks(key_hash) 
  WHERE key_hash IS NOT NULL;
