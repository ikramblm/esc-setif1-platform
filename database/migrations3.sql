-- ═══════════════════════════════════════════════════════════════
--  ESC Sétif 1 — Phase 3 migrations: public catalog metadata
--  Run after migrations2.sql
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE services ADD COLUMN IF NOT EXISTS department VARCHAR(200);
ALTER TABLE services ADD COLUMN IF NOT EXISTS price NUMERIC(12,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_services_department ON services(department);
