from pathlib import Path

from dotenv import load_dotenv


REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = Path(__file__).resolve().parents[1]


def load_environment() -> None:
    """Load shared repo secrets first, then optional backend overrides.

    Production uses the root `.env` as the single EnvironmentFile for systemd.
    Developers may still keep `backend/.env` for backend-only local overrides.
    """

    load_dotenv(REPO_ROOT / ".env", override=False)
    load_dotenv(BACKEND_ROOT / ".env", override=True)
