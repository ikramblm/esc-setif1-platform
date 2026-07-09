
















-- ═══════════════════════════════════════════════════════════════
--  Seed Data – Demo admin + 4 default services
--  Admin password: admin123 (bcrypt 12 rounds)
--  Run AFTER schema.sql
-- ═══════════════════════════════════════════════════════════════

-- Demo admin account
-- Password: admin123
INSERT INTO companies (id, name, sector, contact_name, email, email_normalized, phone, password_hash, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ESC Sétif 1 Administration',
  'Administration Publique',
  'Administrateur Système',
  'ENCRYPTED_PLACEHOLDER',                  -- Replace with: encrypt('admin@esc-setif1.dz')
  'admin@esc-setif1.dz',
  'ENCRYPTED_PLACEHOLDER',
  '$2b$12$D6UTUONRS/SkbDPc9Eac4OIKYmxfGhRE5oLT6lGBcTLDzxrUajNrK',  -- admin123
  'admin'
) ON CONFLICT (email_normalized) DO NOTHING;

-- 4 Default services
INSERT INTO services (id, category, title, description) VALUES
(
  gen_random_uuid(),
  'Consulting',
  'Audit Stratégique et Organisationnel',
  'Diagnostic approfondi de votre organisation : analyse de la structure, des processus et de la gouvernance. Livrables : rapport d''audit + plan d''action priorisé.'
),
(
  gen_random_uuid(),
  'Formation',
  'Formation en Management de Projet (PMP Ready)',
  'Programme de 5 jours en présentiel animé par des docteurs en management. Couvre : initiation, planification, exécution, contrôle et clôture de projet selon PMBoK v7.'
),
(
  gen_random_uuid(),
  'Études',
  'Étude de Faisabilité Technico-Économique',
  'Analyse complète de la viabilité technique, économique et financière de votre projet d''investissement. Inclut : analyse de marché, étude de rentabilité et matrice des risques.'
),
(
  gen_random_uuid(),
  'Recherche',
  'Partenariat R&D Industriel',
  'Collaboration avec nos laboratoires universitaires pour développer des solutions innovantes adaptées à vos problématiques industrielles. Valorisation des résultats et dépôt de brevets inclus.'
)
ON CONFLICT DO NOTHING;
