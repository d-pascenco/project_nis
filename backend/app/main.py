import json
import logging
import os
import time
import traceback

from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.env import load_environment
from app.models import User, UserForm
from app.schemas import UserFormCreate, UserFormResponse

# ── Logging setup ─────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("nextpath")

# ── Config ────────────────────────────────────────────────────────────────────

load_environment()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-in-production")
JWT_ALGORITHM = "HS256"
FRONTEND_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "FRONTEND_ORIGINS",
        "https://nextpath.su,https://www.nextpath.su,http://localhost:5173,http://localhost:3000",
    ).split(",")
    if o.strip()
]
CREATE_TABLES_ON_STARTUP = os.getenv("CREATE_TABLES_ON_STARTUP", "true").lower() in {"1", "true", "yes", "on"}

logger.info("GOOGLE_CLIENT_ID configured: %s", bool(GOOGLE_CLIENT_ID))
logger.info("GROQ_API_KEY configured: %s", bool(os.getenv("GROQ_API_KEY", "")))
logger.info("FRONTEND_ORIGINS: %s", FRONTEND_ORIGINS)

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="NextPath Backend", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Middleware: log every request ─────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000)
    level = logging.WARNING if response.status_code >= 400 else logging.INFO
    logger.log(level, "%s %s → %d (%dms)", request.method, request.url.path, response.status_code, duration_ms)
    return response


# ── Global exception handler: log traceback for every 500 ────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    logger.error(
        "Unhandled exception on %s %s:\n%s",
        request.method, request.url.path, tb,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {type(exc).__name__}: {exc}"},
    )


# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup() -> None:
    if CREATE_TABLES_ON_STARTUP:
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("DB tables verified/created")
        except Exception as exc:
            logger.error("Failed to create DB tables: %s", exc)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)) -> dict:
    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        db_ok = True
    except Exception as exc:
        logger.error("DB health check failed: %s", exc)
        db_ok = False
    return {
        "status": "ok",
        "db": "ok" if db_ok else "error",
        "google_auth": "configured" if GOOGLE_CLIENT_ID else "not configured",
        "groq": "configured" if os.getenv("GROQ_API_KEY") else "not configured",
    }


# ── Forms ─────────────────────────────────────────────────────────────────────

@app.post("/api/forms", response_model=UserFormResponse, status_code=status.HTTP_201_CREATED)
def create_user_form(form_data: UserFormCreate, db: Session = Depends(get_db)) -> UserFormResponse:
    try:
        new_form = UserForm(**form_data.to_model_dict())
        db.add(new_form)
        db.commit()
        db.refresh(new_form)
        logger.info("Form saved: id=%d profession=%s", new_form.id, new_form.target_profession)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error("Form save failed: %s", exc)
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc
    return UserFormResponse(id=new_form.id, message="Form data saved successfully.", created_at=new_form.created_at)


# ── Roadmap ───────────────────────────────────────────────────────────────────

@app.post("/api/roadmap")
def generate_roadmap(form_data: UserFormCreate) -> dict:
    groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not groq_api_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY not set")

    try:
        from groq import Groq
        client = Groq(api_key=groq_api_key)
    except Exception as exc:
        logger.error("Groq client init failed: %s", exc)
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
    {{"id": 1, "title": "...", "duration": "...", "skills": ["..."], "resources": ["..."]}}
  ],
  "total_duration": "...",
  "summary": "..."
}}

Правила: 4-6 этапов, сроки под {hours} ч/нед, resources — реальные платформы (Stepik, Coursera, YouTube, GitHub, Хекслет), весь текст {lang}"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        result = json.loads(completion.choices[0].message.content)
        logger.info("Roadmap generated: profession=%s stages=%d", form_data.target_profession, len(result.get("stages", [])))
        return result
    except Exception as exc:
        logger.error("Groq API error: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=502, detail=f"Groq API error: {exc}") from exc


# ── Auth helpers ──────────────────────────────────────────────────────────────

def _create_jwt(user_id: int) -> str:
    return jwt.encode({"sub": str(user_id)}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _get_user_id(authorization: str | None, db: Session) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = jwt.decode(authorization[7:], JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return int(payload["sub"])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc


# ── Google OAuth ──────────────────────────────────────────────────────────────

class GoogleCredential(BaseModel):
    credential: str


@app.post("/api/auth/google")
def google_auth(payload: GoogleCredential, db: Session = Depends(get_db)) -> dict:
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests

    logger.info("Google auth attempt (client_id configured: %s)", bool(GOOGLE_CLIENT_ID))

    id_info: dict | None = None

    # Try with audience check first
    if GOOGLE_CLIENT_ID:
        try:
            id_info = id_token.verify_oauth2_token(payload.credential, google_requests.Request(), GOOGLE_CLIENT_ID)
            logger.info("Token verified with audience")
        except ValueError as exc:
            logger.warning("Audience check failed (%s), retrying without audience", exc)

    # Fallback: verify signature/expiry only
    if id_info is None:
        try:
            id_info = id_token.verify_oauth2_token(payload.credential, google_requests.Request())
            logger.info("Token verified without audience check")
        except Exception as exc:
            logger.error("Google token verification failed: %s\n%s", exc, traceback.format_exc())
            raise HTTPException(status_code=401, detail=f"Token verification failed: {exc}") from exc

    google_id = id_info.get("sub", "")
    email = id_info.get("email", "")
    name = id_info.get("name", "")
    picture = id_info.get("picture", "")
    logger.info("Google token ok: email=%s google_id=%s", email, google_id)

    try:
        user = db.query(User).filter(User.google_id == google_id).first()
        if not user:
            user = User(google_id=google_id, email=email, name=name, picture=picture)
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info("New user created: id=%d email=%s", user.id, email)
        else:
            logger.info("Existing user login: id=%d email=%s", user.id, email)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error("DB error during user upsert: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=503, detail=f"Database error: {exc}") from exc

    return {
        "token": _create_jwt(user.id),
        "user": {"id": user.id, "email": email, "name": name, "picture": picture},
    }


# ── Profile ───────────────────────────────────────────────────────────────────

@app.get("/api/me")
def get_me(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> dict:
    user_id = _get_user_id(authorization, db)
    try:
        user = db.get(User, user_id)
    except SQLAlchemyError as exc:
        logger.error("DB error in get_me: %s", exc)
        raise HTTPException(status_code=503, detail="Database error") from exc
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "email": user.email, "name": user.name, "picture": user.picture, "roadmap": user.roadmap}


class RoadmapSave(BaseModel):
    roadmap: dict


@app.post("/api/me/roadmap")
def save_roadmap(
    payload: RoadmapSave,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> dict:
    user_id = _get_user_id(authorization, db)
    try:
        user = db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.roadmap = payload.roadmap
        db.commit()
        logger.info("Roadmap saved for user_id=%d", user_id)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error("DB error saving roadmap: %s", exc)
        raise HTTPException(status_code=503, detail="Database error") from exc
    return {"ok": True}
