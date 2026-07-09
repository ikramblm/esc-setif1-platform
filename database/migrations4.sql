-- ═══════════════════════════════════════════════════════════════
--  ESC Sétif 1 — Phase 4 migrations: favorites
--  Run after migrations3.sql
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
