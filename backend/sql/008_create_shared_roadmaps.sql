CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS shared_roadmaps (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap     JSONB NOT NULL,
    form_data   JSONB,
    profession  VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON shared_roadmaps TO nextpath_app;
