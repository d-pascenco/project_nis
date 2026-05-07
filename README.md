# NextPath

AI-система персонального карьерного сопровождения. Пользователь заполняет онбординг-анкету, получает персональный план развития от Llama 3.3 (Groq) и отслеживает прогресс в личном кабинете.

**Продакшн:** https://nextpath.su · https://my.nextpath.su

## Архитектура

```
nextpath.su          → публичный сайт + форма онбординга
my.nextpath.su       → личный кабинет пользователя

frontend/            React + TypeScript + Vite + Tailwind + shadcn/ui
backend/             FastAPI + SQLAlchemy + PostgreSQL
scripts/             deploy_host.sh
docs/                DEPLOY_PRODUCTION.md
```

Инфраструктура: Oracle Cloud Free Tier · Ubuntu 24.04 · Nginx · Cloudflare · Let's Encrypt · systemd.

## Быстрый старт

### Backend

```bash
cp .env.example .env          # заполнить секреты
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Проверка: `curl http://127.0.0.1:8000/api/health`

### Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

## Переменные окружения

Скопировать `.env.example` → `.env` и заполнить:

| Переменная | Назначение |
|------------|------------|
| `DATABASE_URL` | PostgreSQL строка подключения |
| `GROQ_API_KEY` | Ключ Groq API (бесплатно: console.groq.com) |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID из Google Cloud Console |
| `JWT_SECRET` | Произвольная случайная строка для подписи JWT |
| `VITE_GOOGLE_CLIENT_ID` | То же значение, что `GOOGLE_CLIENT_ID` (для Vite) |
| `VITE_CABINET_URL` | URL кабинета в prod (`https://my.nextpath.su`) |
| `VITE_MAIN_URL` | URL основного сайта в prod (`https://nextpath.su`) |

## Деплой на хост

```bash
cd /home/ubuntu/project_nis
git pull origin main
NODE_OPTIONS="--max-old-space-size=512" bash scripts/deploy_host.sh
```

Подробнее: [`docs/DEPLOY_PRODUCTION.md`](docs/DEPLOY_PRODUCTION.md).

## База данных

Миграции применяются скриптом `scripts/deploy_host.sh` автоматически (все `backend/sql/00*.sql` по порядку). Ручное применение:

```bash
psql -h 127.0.0.1 -U nextpath_app -d nextpath -f backend/sql/001_create_user_forms.sql
psql -h 127.0.0.1 -U nextpath_app -d nextpath -f backend/sql/002_create_users.sql
psql -h 127.0.0.1 -U nextpath_app -d nextpath -f backend/sql/003_alter_users_add_progress.sql
psql -h 127.0.0.1 -U nextpath_app -d nextpath -f backend/sql/004_alter_users_add_form_data.sql
```
