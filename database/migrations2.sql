-- ═══════════════════════════════════════════════════════════════
--  ESC Sétif 1 — Phase 2 migrations
--  Run after migrations.sql
-- ═══════════════════════════════════════════════════════════════

-- Extend companies role enum to include 'researcher'
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_role_check;
ALTER TABLE companies ADD CONSTRAINT companies_role_check
  CHECK (role IN ('company','admin','researcher'));

-- Extra fields for researcher profiles
ALTER TABLE companies ADD COLUMN IF NOT EXISTS department  VARCHAR(200);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS specialty   VARCHAR(200);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS grade       VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bio         TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS expertise   TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS h_index     INTEGER;

-- ── Projects ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id         UUID REFERENCES needs(id) ON DELETE SET NULL,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title           VARCHAR(300) NOT NULL,
  description     TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','paused','completed','cancelled')),
  start_date      DATE,
  end_date        DATE,
  budget_approved NUMERIC(15,2),
  progress_pct    INTEGER NOT NULL DEFAULT 0
                    CHECK (progress_pct BETWEEN 0 AND 100),
  admin_notes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Project assignments (researcher ↔ project) ─────────────────
CREATE TABLE IF NOT EXISTS project_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  researcher_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role            VARCHAR(50) NOT NULL DEFAULT 'member'
                    CHECK (role IN ('lead','member')),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','accepted','declined')),
  accepted_at     TIMESTAMPTZ,
  decline_note    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, researcher_id)
);

-- ── Contracts ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title           VARCHAR(300) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','sent','signed','expired')),
  file_url        TEXT,
  notes           TEXT,
  signed_company  TIMESTAMPTZ,
  signed_admin    TIMESTAMPTZ,
  expires_at      DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Documents ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title           VARCHAR(300) NOT NULL,
  file_name       VARCHAR(300),
  file_url        TEXT,
  doc_type        VARCHAR(30) NOT NULL DEFAULT 'other'
                    CHECK (doc_type IN ('report','deliverable','contract','cv','other')),
  visibility      VARCHAR(20) NOT NULL DEFAULT 'all'
                    CHECK (visibility IN ('all','admin','company','researcher')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Messages ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  receiver_id     UUID REFERENCES companies(id) ON DELETE SET NULL,
  body            TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type            VARCHAR(50) NOT NULL,
  title           VARCHAR(300) NOT NULL,
  body            TEXT,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  link            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Forgot-password reset tokens
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reset_token         VARCHAR(128);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_projects_company    ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_assignments_project ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_researcher ON project_assignments(researcher_id);
CREATE INDEX IF NOT EXISTS idx_messages_project    ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver   ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user  ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project   ON documents(project_id);
