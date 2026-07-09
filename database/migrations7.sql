ALTER TABLE services ADD COLUMN IF NOT EXISTS activity_code VARCHAR(10);
ALTER TABLE services ADD COLUMN IF NOT EXISTS title_en VARCHAR(300);
ALTER TABLE services ADD COLUMN IF NOT EXISTS title_ar VARCHAR(300);
ALTER TABLE services ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS description_ar TEXT;
CREATE INDEX IF NOT EXISTS idx_services_activity_code ON services(activity_code);
