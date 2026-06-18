-- ═══════════════════════════════════════════════════════════════
--  ESC Sétif 1 – PostgreSQL Schema
--  Security: UUID PKs, parameterized queries only, AES-256 for PII
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Companies ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  sector          VARCHAR(100) NOT NULL,
  contact_name    VARCHAR(150) NOT NULL,
  email           TEXT NOT NULL,                    -- AES-256 encrypted
  email_normalized VARCHAR(254) NOT NULL UNIQUE,   -- lowercase for lookup
  phone           TEXT,                             -- AES-256 encrypted
  password_hash   TEXT NOT NULL,                   -- bcrypt(12)
  role            VARCHAR(20) NOT NULL DEFAULT 'company'
                    CHECK (role IN ('company','admin')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_email_normalized ON companies(email_normalized);
CREATE INDEX IF NOT EXISTS idx_companies_role ON companies(role);

-- ── Needs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS needs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  service_type    VARCHAR(50) NOT NULL
                    CHECK (service_type IN ('Consulting','Formation','Études','Recherche')),
  title           VARCHAR(300) NOT NULL,
  description     TEXT NOT NULL,
  deadline        DATE NOT NULL,
  budget          NUMERIC(15,2),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','reviewing','approved','rejected','completed')),
  admin_notes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_needs_company_id ON needs(company_id);
CREATE INDEX IF NOT EXISTS idx_needs_status ON needs(status);
CREATE INDEX IF NOT EXISTS idx_needs_created_at ON needs(created_at DESC);

-- ── Services ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category        VARCHAR(50) NOT NULL
                    CHECK (category IN ('Consulting','Formation','Études','Recherche')),
  title           VARCHAR(300) NOT NULL,
  description     TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  published_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_published ON services(published_at DESC);

-- ── Sessions (refresh token store) ───────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_company_id ON sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ── Auto-update updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_needs_updated_at BEFORE UPDATE ON needs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Cleanup expired sessions (run via cron or pg_cron) ───────
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN DELETE FROM sessions WHERE expires_at < NOW(); END;
$$ LANGUAGE plpgsql;
