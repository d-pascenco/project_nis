# NextPath

Monorepo проекта NextPath.

## Структура

- `frontend/` — сайт NextPath, собирается в статический `dist/` и отдается через Nginx.
- `backend/` — FastAPI API для onboarding-формы и записи данных в PostgreSQL.
- `.env.example` — общий шаблон секретов для frontend/backend; реальный `.env` игнорируется Git.
- `docs/DEPLOY_PRODUCTION.md` — общая инструкция по безопасному деплою на Oracle Ubuntu.
- `docs/CURRENT_HOST_NEXT_STEPS.md` — конкретный план для текущего хоста `mnad-projest` по диагностическому выводу.
- `docs/MIGRATE_HOST_TO_PROJECT_NIS.md` — точный план: удалить/архивировать старый `nextpath-ai-navigator` на хосте и поднять `/home/ubuntu/project_nis`.
- `scripts/deploy_host.sh` — helper-скрипт для сборки frontend, обновления backend и reload Nginx на production-хосте.
- `wiki.md` — история настройки инфраструктуры и текущий workflow.

> В текущем рабочем дереве frontend-каталог может отсутствовать, если он еще не был подтянут в эту копию репозитория. Deploy-инструкция и скрипт рассчитаны на итоговую структуру monorepo с `frontend/` и `backend/`.

## Backend локально

```bash
cp .env.example .env
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Проверка:

```bash
curl http://127.0.0.1:8000/api/health
```

## Production deploy

Короткий вариант после первичной настройки хоста:

```bash
cd /home/ubuntu/project_nis
git pull --ff-only
bash scripts/deploy_host.sh
```

Подробные инструкции:

- общий runbook: [`docs/DEPLOY_PRODUCTION.md`](docs/DEPLOY_PRODUCTION.md);
- конкретно для текущего хоста: [`docs/CURRENT_HOST_NEXT_STEPS.md`](docs/CURRENT_HOST_NEXT_STEPS.md);
- миграция хоста на правильный `/home/ubuntu/project_nis`: [`docs/MIGRATE_HOST_TO_PROJECT_NIS.md`](docs/MIGRATE_HOST_TO_PROJECT_NIS.md).
