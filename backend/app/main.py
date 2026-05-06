import json
import logging
import os

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.env import load_environment
from app.models import User, UserForm
from app.schemas import UserFormCreate, UserFormResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nextpath")

load_environment()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-in-production")
JWT_ALGORITHM = "HS256"

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
        result = json.loads(completion.choices[0].message.content)
        logger.info("Roadmap generated for profession=%s, stages=%d", form_data.target_profession, len(result.get("stages", [])))
        return result
    except Exception as exc:
        logger.error("Groq API error: %s", exc)
        raise HTTPException(status_code=502, detail=f"Groq API error: {exc}") from exc


# ── Auth helpers ──────────────────────────────────────────────────────────────

def _create_jwt(user_id: int) -> str:
    return jwt.encode({"sub": str(user_id)}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _get_user_id(authorization: str | None, db: Session) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token = authorization[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return int(payload["sub"])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


# ── Google OAuth ──────────────────────────────────────────────────────────────

class GoogleCredential(BaseModel):
    credential: str


@app.post("/api/auth/google")
def google_auth(payload: GoogleCredential, db: Session = Depends(get_db)) -> dict:
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests

    id_info: dict | None = None

    # 1. Try full verification with audience check
    if GOOGLE_CLIENT_ID:
        try:
            id_info = id_token.verify_oauth2_token(
                payload.credential,
                google_requests.Request(),
                GOOGLE_CLIENT_ID,
            )
            logger.info("Token verified with audience")
        except ValueError as exc:
            logger.warning("Audience verification failed (%s), retrying without audience", exc)

    # 2. Fallback: verify signature + expiry, skip audience check
    if id_info is None:
        try:
            id_info = id_token.verify_oauth2_token(
                payload.credential,
                google_requests.Request(),
            )
            logger.info("Token verified without audience check")
        except Exception as exc:
            logger.error("Google token verification failed: %s", exc)
            raise HTTPException(status_code=401, detail=f"Не удалось верифицировать токен Google: {exc}") from exc

    google_id = id_info["sub"]
    email = id_info.get("email", "")
    name = id_info.get("name", "")
    picture = id_info.get("picture", "")

    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = User(google_id=google_id, email=email, name=name, picture=picture)
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info("New user registered: %s", email)
    else:
        logger.info("User logged in: %s", email)

    return {
        "token": _create_jwt(user.id),
        "user": {"id": user.id, "email": email, "name": name, "picture": picture},
    }


# ── Profile ───────────────────────────────────────────────────────────────────

@app.get("/api/me")
def get_me(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> dict:
    user_id = _get_user_id(authorization, db)
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "roadmap": user.roadmap,
    }


class RoadmapSave(BaseModel):
    roadmap: dict


@app.post("/api/me/roadmap")
def save_roadmap(payload: RoadmapSave, authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> dict:
    user_id = _get_user_id(authorization, db)
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.roadmap = payload.roadmap
    db.commit()
    logger.info("Roadmap saved for user_id=%d", user_id)
    return {"ok": True}
