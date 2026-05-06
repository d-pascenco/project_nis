# NextPath Backend

Backend MVP для страницы `https://nextpath.su/onboarding`: принимает все поля React-формы `Onboarding.tsx`, валидирует payload и сохраняет его в PostgreSQL в таблицу `user_forms`.

## Стек

- Python 3.12+
- FastAPI
- SQLAlchemy 2
- PostgreSQL
- Uvicorn

## Контракт с фронтендом

Endpoint для формы:

```text
POST /api/forms
```

Backend принимает camelCase-поля, которые сейчас есть во frontend `FormData`:

| Шаг frontend | Поля |
|--------------|------|
| `BasicInfoStep` | `fullName`, `age`, `location`, `currentStatus` |
| `EducationStep` | `education`, `university`, `specialization`, `yearsExperience`, `currentRole`, `cvSummary` |
| `GoalsStep` | `targetProfession`, `targetIndustry`, `timeline`, `motivation`, `priorities` |
| `SkillsStep` | `technicalSkills`, `softSkills`, `languages`, `learningStyle` |
| `ConstraintsStep` | `hoursPerWeek`, `budget`, `healthConsiderations`, `preferOnline`, `preferRussian`, `needMentorship`, `additionalInfo` |

Поле `email` тоже поддерживается как опциональное на случай, если его добавят в форму позже.

## API

### `GET /api/health`

Проверка, что сервис жив.

```json
{"status": "ok"}
```

### `POST /api/forms`

Пример запроса с полями сайта:

```json
{
  "fullName": "Anna Ivanova",
  "age": "21",
  "location": "Moscow",
  "currentStatus": "student",
  "education": "bachelor",
  "university": "HSE",
  "specialization": "Computer Science",
  "yearsExperience": "1",
  "currentRole": "Intern",
  "cvSummary": "Python and SQL basics",
  "targetProfession": "Data Scientist",
  "targetIndustry": "AI / ML",
  "timeline": "6 months",
  "motivation": "Want a first analytics job",
  "priorities": ["growth", "remote"],
  "technicalSkills": ["Python", "SQL"],
  "softSkills": ["Коммуникация"],
  "languages": [{"name": "English", "level": 70}],
  "learningStyle": "projects",
  "hoursPerWeek": 15,
  "budget": "free",
  "healthConsiderations": "No",
  "preferOnline": true,
  "preferRussian": true,
  "needMentorship": false,
  "additionalInfo": "Prefers evening study"
}
```

Ответ:

```json
{
  "id": 1,
  "message": "Form data saved successfully.",
  "created_at": "2026-05-06T12:00:00Z"
}
```

## Таблица PostgreSQL

Основная таблица называется `user_forms`. SQL для ручного применения лежит в `sql/001_create_user_forms.sql`.

```bash
sudo -u postgres psql
\c nextpath
\i /home/ubuntu/nextpath-ai-navigator/backend/sql/001_create_user_forms.sql
```

Если `CREATE_TABLES_ON_STARTUP=true`, SQLAlchemy также попробует создать таблицу автоматически при старте backend.

## Локальный запуск

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
cp .env.example .env
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Проверка:

```bash
curl http://127.0.0.1:8000/api/health
```

Проверка записи формы:

```bash
curl -X POST http://127.0.0.1:8000/api/forms \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Test User","age":"21","currentStatus":"student","targetProfession":"Data Scientist","hoursPerWeek":15,"technicalSkills":["Python","SQL"],"languages":[{"name":"English","level":70}]}'
```

Проверка в PostgreSQL:

```sql
SELECT id, full_name, target_profession, hours_per_week, created_at
FROM user_forms
ORDER BY id DESC
LIMIT 5;
```

## Переменные окружения

| Переменная | Назначение | Пример |
|------------|------------|--------|
| `DATABASE_URL` | строка подключения к PostgreSQL из root `.env` или `backend/.env` | `postgresql://nextpath_app:REAL_PASSWORD@127.0.0.1:5432/nextpath` |
| `APP_HOST` | host для ручного запуска/systemd | `127.0.0.1` |
| `APP_PORT` | port для ручного запуска/systemd | `8000` |
| `FRONTEND_ORIGINS` | разрешенные frontend origins через запятую | `https://nextpath.su,https://www.nextpath.su` |
| `CREATE_TABLES_ON_STARTUP` | создавать таблицы при старте | `true` |

## Production на Ubuntu + systemd

```ini
[Unit]
Description=NextPath FastAPI Backend
After=network.target postgresql.service

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/nextpath-ai-navigator/backend
EnvironmentFile=/home/ubuntu/nextpath-ai-navigator/.env
ExecStart=/home/ubuntu/nextpath-ai-navigator/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Команды:

```bash
sudo systemctl daemon-reload
sudo systemctl enable nextpath-backend
sudo systemctl start nextpath-backend
sudo systemctl status nextpath-backend
journalctl -u nextpath-backend -f
```

## Nginx reverse proxy

Внутри `server { ... }`:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Проверка:

```bash
sudo nginx -t
sudo systemctl reload nginx
curl https://nextpath.su/api/health
```

## Что добавить во frontend

На последнем шаге, где сейчас вызывается `setShowRoadmap(true)`, нужно перед этим отправить `formData`:

```ts
const response = await fetch("/api/forms", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(formData),
});

if (!response.ok) {
  throw new Error("Не удалось сохранить форму");
}
```

Так как backend принимает те же camelCase-ключи, которые уже есть в `Onboarding.tsx`, дополнительный mapper на фронтенде не нужен.
