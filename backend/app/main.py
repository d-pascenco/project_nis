import json
import os

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.env import load_environment
from app.models import UserForm
from app.schemas import UserFormCreate, UserFormResponse

load_environment()

FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "https://nextpath.su,https://www.nextpath.su,http://localhost:5173,http://localhost:3000",
    ).split(",")
    if origin.strip()
]
CREATE_TABLES_ON_STARTUP = os.getenv("CREATE_TABLES_ON_STARTUP", "true").lower() in {"1", "true", "yes", "on"}

app = FastAPI(
    title="NextPath Backend",
    description="Backend API for collecting NextPath onboarding form data.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    if CREATE_TABLES_ON_STARTUP:
        Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/forms", response_model=UserFormResponse, status_code=status.HTTP_201_CREATED)
def create_user_form(form_data: UserFormCreate, db: Session = Depends(get_db)) -> UserFormResponse:
    try:
        new_form = UserForm(**form_data.to_model_dict())
        db.add(new_form)
        db.commit()
        db.refresh(new_form)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is temporarily unavailable",
        ) from exc

    return UserFormResponse(
        id=new_form.id,
        message="Form data saved successfully.",
        created_at=new_form.created_at,
    )


@app.post("/api/roadmap")
def generate_roadmap(form_data: UserFormCreate) -> dict:
    groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not groq_api_key:
        raise HTTPException(status_code=503, detail="Roadmap generation unavailable: GROQ_API_KEY not set")

    try:
        from groq import Groq
        client = Groq(api_key=groq_api_key)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Groq client init failed") from exc

    lang = "на русском языке" if form_data.prefer_russian is not False else "in English"
    skills = ", ".join(form_data.technical_skills) if form_data.technical_skills else "не указаны"
    hours = form_data.hours_per_week or 10

    prompt = f"""Ты карьерный консультант. Составь персональный план развития {lang}.

Профиль:
- Цель: {form_data.target_profession or "не указана"}
- Индустрия: {form_data.target_industry or "любая"}
- Срок: {form_data.timeline or "не указан"}
- Текущие навыки: {skills}
- Текущая роль: {form_data.current_role or "не указана"}
- Часов в неделю: {hours}
- Бюджет: {form_data.budget or "не указан"}

Верни ТОЛЬКО валидный JSON без markdown:
{{
  "stages": [
    {{
      "id": 1,
      "title": "...",
      "duration": "...",
      "skills": ["...", "..."],
      "resources": ["...", "..."]
    }}
  ],
  "total_duration": "...",
  "summary": "..."
}}

Правила:
- 4-6 этапов, сроки реалистичны под {hours} ч/нед
- resources — реальные платформы: Stepik, Coursera, YouTube, GitHub, Хекслет и т.д.
- весь текст {lang}"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Groq API error: {exc}") from exc
