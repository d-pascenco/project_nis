ALTER TABLE user_forms
  ADD COLUMN IF NOT EXISTS target_hard_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS target_soft_skills JSONB NOT NULL DEFAULT '[]'::jsonb;
