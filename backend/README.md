# NextPath Backend

FastAPI-сервис для NextPath. Принимает данные онбординг-формы, сохраняет их в PostgreSQL, генерирует персональный роудмап через Groq (Llama 3.3), управляет пользователями через Google OAuth.

## Стек

- Python 3.12 · FastAPI · SQLAlchemy 2 · PostgreSQL · Uvicorn
- Groq API (llama-3.3-70b-versatile)
- Google OAuth 2.0 · JWT (python-jose)

## Endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/api/health` | Статус сервиса + проверка DB/Groq/Google |
| `POST` | `/api/forms` | Сохранить данные онбординг-формы (анонимно) |
| `POST` | `/api/roadmap` | Сгенерировать роудмап через Groq |
| `POST` | `/api/auth/google` | Google OAuth → JWT |
| `GET` | `/api/me` | Профиль, роудмап, form_data, прогресс |
| `PUT` | `/api/me/profile` | Обновить имя |
| `PUT` | `/api/me/progress` | Сохранить выполненные этапы |
| `POST` | `/api/me/roadmap` | Сохранить роудмап |
| `POST` | `/api/me/save-form` | Сохранить данные формы |
| `POST` | `/api/me/recalculate` | Обновить form_data + пересчитать роудмап |

## Локальный запуск

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # заполнить DATABASE_URL и остальное
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Структура

```
app/
  main.py       — все endpoints, middleware, exception handler
  models.py     — SQLAlchemy модели (UserForm, User)
  schemas.py    — Pydantic схемы валидации
  database.py   — подключение SQLAlchemy
  env.py        — загрузка .env
sql/
  001_create_user_forms.sql
  002_create_users.sql
  003_alter_users_add_progress.sql
  004_alter_users_add_form_data.sql
```

## Production (systemd)

```ini
[Unit]
Description=NextPath FastAPI Backend
After=network.target postgresql.service

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/project_nis/backend
EnvironmentFile=/home/ubuntu/project_nis/.env
ExecStart=/home/ubuntu/project_nis/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable nextpath-backend
sudo systemctl restart nextpath-backend
journalctl -u nextpath-backend -f
```
