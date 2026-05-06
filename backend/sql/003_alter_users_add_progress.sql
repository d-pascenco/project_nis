ALTER TABLE users
  ADD COLUMN IF NOT EXISTS completed_stages JSONB NOT NULL DEFAULT '[]'::jsonb;
