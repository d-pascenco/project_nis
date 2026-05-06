CREATE TABLE IF NOT EXISTS user_forms (
    id SERIAL PRIMARY KEY,

    -- BasicInfoStep: fullName, age, location, currentStatus
    full_name VARCHAR(255),
    age INTEGER CHECK (age IS NULL OR (age >= 0 AND age <= 120)),
    location VARCHAR(255),
    current_status VARCHAR(100),
    email VARCHAR(255),

    -- EducationStep: education, university, specialization, yearsExperience, currentRole, cvSummary
    education VARCHAR(255),
    university VARCHAR(255),
    specialization VARCHAR(255),
    years_experience INTEGER CHECK (years_experience IS NULL OR (years_experience >= 0 AND years_experience <= 80)),
    current_role VARCHAR(255),
    cv_summary TEXT,

    -- GoalsStep: targetProfession, targetIndustry, timeline, motivation, priorities
    target_profession VARCHAR(255),
    target_industry VARCHAR(255),
    timeline VARCHAR(100),
    motivation TEXT,
    priorities JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- SkillsStep: technicalSkills, softSkills, languages, learningStyle
    technical_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    soft_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    languages JSONB NOT NULL DEFAULT '[]'::jsonb,
    learning_style VARCHAR(255),

    -- ConstraintsStep: hoursPerWeek, budget, healthConsiderations,
    -- preferOnline, preferRussian, needMentorship, additionalInfo
    hours_per_week INTEGER CHECK (hours_per_week IS NULL OR (hours_per_week >= 0 AND hours_per_week <= 80)),
    budget VARCHAR(255),
    health_considerations TEXT,
    prefer_online BOOLEAN,
    prefer_russian BOOLEAN,
    need_mentorship BOOLEAN,
    additional_info TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_forms_created_at ON user_forms (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_forms_target_profession ON user_forms (target_profession);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_forms TO nextpath_app;
GRANT USAGE, SELECT ON SEQUENCE user_forms_id_seq TO nextpath_app;
