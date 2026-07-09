-- ═══════════════════════════════════════════════════════════════
--  ESC Sétif 1 — Phase 5 migrations: researcher self-publish services
--  Run after migrations4.sql
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE services ADD COLUMN IF NOT EXISTS researcher_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS city VARCHAR(150);
ALTER TABLE services ADD COLUMN IF NOT EXISTS research_domain VARCHAR(200);
ALTER TABLE services ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE services ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]';
ALTER TABLE services ADD COLUMN IF NOT EXISTS documents JSONB NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_services_researcher ON services(researcher_id);
