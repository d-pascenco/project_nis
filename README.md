# NextPath

Система персонального карьерного сопровождения. Пользователь заполняет анкету и получает индивидуальный план развития, сгенерированный через Groq (Llama 3.3). Прогресс отслеживается в личном кабинете.

**Продакшн:** https://nextpath.su · https://my.nextpath.su

## Структура

```
nextpath.su          — публичный сайт и форма
my.nextpath.su       — личный кабинет

frontend/            React + TypeScript + Vite + Tailwind + shadcn/ui
backend/             FastAPI + SQLAlchemy + PostgreSQL
backend/tests/       Тесты API (FastAPI TestClient)
scripts/             deploy_host.sh
wiki.md              Документация проекта
```

Инфраструктура: Oracle Cloud Free Tier, Ubuntu 24.04, Nginx, Cloudflare, Let's Encrypt, systemd.

## Быстрый старт

### Backend

```bash
cp .env.example .env
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

```bash
curl http://127.0.0.1:8000/api/health
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

### Тесты backend

```bash
cd backend
source venv/bin/activate
pip install pytest httpx
pytest tests/
```

Тесты используют `FakeDb` — реальная база данных не нужна.

## Переменные окружения

Скопировать `.env.example` в `.env` и заполнить:

| Переменная | Назначение |
|------------|------------|
| `DATABASE_URL` | Строка подключения к PostgreSQL |
| `GROQ_API_KEY` | Ключ Groq API (console.groq.com) |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID (Google Cloud Console) |
| `JWT_SECRET` | Случайная строка для подписи токенов |
| `VITE_GOOGLE_CLIENT_ID` | То же значение, что `GOOGLE_CLIENT_ID` |
| `VITE_CABINET_URL` | URL кабинета в prod: `https://my.nextpath.su` |
| `VITE_MAIN_URL` | URL основного сайта: `https://nextpath.su` |

## Деплой

```bash
cd /home/ubuntu/project_nis
git pull origin main
NODE_OPTIONS="--max-old-space-size=512" bash scripts/deploy_host.sh
```

Скрипт применяет SQL-миграции, собирает frontend, обновляет Python-зависимости, перезапускает сервис и перезагружает Nginx.

## Миграции базы данных

Применяются автоматически при каждом деплое. Ручное применение:

```bash
psql -h 127.0.0.1 -U nextpath_app -d nextpath -f backend/sql/001_create_user_forms.sql
psql -h 127.0.0.1 -U nextpath_app -d nextpath -f backend/sql/002_create_users.sql
psql -h 127.0.0.1 -U nextpath_app -d nextpath -f backend/sql/003_alter_users_add_progress.sql
psql -h 127.0.0.1 -U nextpath_app -d nextpath -f backend/sql/004_alter_users_add_form_data.sql
psql -h 127.0.0.1 -U nextpath_app -d nextpath -f backend/sql/005_alter_user_forms_add_schedule.sql
psql -h 127.0.0.1 -U nextpath_app -d nextpath -f backend/sql/006_alter_user_forms_add_target_skills.sql
psql -h 127.0.0.1 -U nextpath_app -d nextpath -f backend/sql/007_alter_user_forms_add_country.sql
psql -h 127.0.0.1 -U nextpath_app -d nextpath -f backend/sql/008_create_shared_roadmaps.sql
```
