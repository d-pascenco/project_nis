CREATE TABLE IF NOT EXISTS shared_roadmaps (
    id          VARCHAR(36) PRIMARY KEY,
    roadmap     JSONB NOT NULL,
    form_data   JSONB,
    profession  VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON shared_roadmaps TO nextpath_app;
