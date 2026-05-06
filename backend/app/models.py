from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    google_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    picture: Mapped[str | None] = mapped_column(Text, nullable=True)
    roadmap: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    completed_stages: Mapped[list[int]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserForm(Base):
    __tablename__ = "user_forms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # BasicInfoStep: fullName, age, location, currentStatus
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    current_status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # EducationStep: education, university, specialization, yearsExperience, currentRole, cvSummary
    education: Mapped[str | None] = mapped_column(String(255), nullable=True)
    university: Mapped[str | None] = mapped_column(String(255), nullable=True)
    specialization: Mapped[str | None] = mapped_column(String(255), nullable=True)
    years_experience: Mapped[int | None] = mapped_column(Integer, nullable=True)
    current_role: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cv_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    # GoalsStep: targetProfession, targetIndustry, timeline, motivation, priorities
    target_profession: Mapped[str | None] = mapped_column(String(255), nullable=True)
    target_industry: Mapped[str | None] = mapped_column(String(255), nullable=True)
    timeline: Mapped[str | None] = mapped_column(String(100), nullable=True)
    motivation: Mapped[str | None] = mapped_column(Text, nullable=True)
    priorities: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))

    # SkillsStep: technicalSkills, softSkills, languages, learningStyle
    technical_skills: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    soft_skills: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    languages: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    learning_style: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # ConstraintsStep: hoursPerWeek, budget, healthConsiderations, preferOnline,
    # preferRussian, needMentorship, additionalInfo
    hours_per_week: Mapped[int | None] = mapped_column(Integer, nullable=True)
    budget: Mapped[str | None] = mapped_column(String(255), nullable=True)
    health_considerations: Mapped[str | None] = mapped_column(Text, nullable=True)
    prefer_online: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    prefer_russian: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    need_mentorship: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    additional_info: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
