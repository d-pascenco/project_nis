ALTER TABLE user_forms
  ADD COLUMN IF NOT EXISTS schedule_items JSONB NOT NULL DEFAULT '[]'::jsonb;
