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
