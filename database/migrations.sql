-- ═══════════════════════════════════════════════════════════════
--  ESC Sétif 1 – Feature Migrations
--  Run: psql -U postgres -d esc_setif1 -f database/migrations.sql
-- ═══════════════════════════════════════════════════════════════

-- ── Researchers ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS researchers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   VARCHAR(200) NOT NULL,
  specialty   VARCHAR(200) NOT NULL,
  department  VARCHAR(200),
  grade       VARCHAR(100),           -- Professeur, MCA, MCB, MA…
  email       TEXT NOT NULL,          -- AES-256 encrypted
  phone       TEXT,                   -- AES-256 encrypted
  bio         TEXT,
  expertise   TEXT,                   -- comma-separated tags
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_researchers_active ON researchers(is_active);

CREATE TRIGGER trg_researchers_updated_at BEFORE UPDATE ON researchers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Project Offers (admin posts) ─────────────────────────────
CREATE TABLE IF NOT EXISTS project_offers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  category    VARCHAR(50) NOT NULL
                CHECK (category IN ('Consulting','Formation','Études','Recherche')),
  deadline    DATE,
  budget      NUMERIC(15,2),
  slots       INTEGER DEFAULT 1,
  tags        TEXT,                   -- comma-separated
  status      VARCHAR(20) NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','closed','archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_status ON project_offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_created ON project_offers(created_at DESC);

CREATE TRIGGER trg_offers_updated_at BEFORE UPDATE ON project_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Project Applications (company applies to offer) ──────────
CREATE TABLE IF NOT EXISTS project_applications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id     UUID NOT NULL REFERENCES project_offers(id) ON DELETE CASCADE,
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','accepted','rejected')),
  applied_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(offer_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_offer ON project_applications(offer_id);
CREATE INDEX IF NOT EXISTS idx_applications_company ON project_applications(company_id);

CREATE TRIGGER trg_applications_updated_at BEFORE UPDATE ON project_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Company profile extra fields (add if missing) ────────────
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website    VARCHAR(300);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address    TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS employees  INTEGER;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS about      TEXT;
