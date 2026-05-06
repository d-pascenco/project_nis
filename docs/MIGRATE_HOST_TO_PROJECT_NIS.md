# Миграция хоста на правильный monorepo `project_nis`

Правильный production-репозиторий теперь:

```text
https://github.com/d-pascenco/project_nis.git
```

На хосте больше не нужно использовать `https://github.com/d-pascenco/nextpath-ai-navigator.git`: это frontend-only репозиторий, поэтому там нет `backend/`, `scripts/`, `docs/`.

Цель миграции:

```text
/home/ubuntu/nextpath-ai-navigator   удалить/архивировать как старый frontend-only clone
/home/ubuntu/project_nis             создать как нормальный monorepo
/var/www/html                        оставить web root для Nginx, чтобы сайт продолжил работать
/etc/nginx/sites-enabled/nextpath.su оставить Certbot/SSL и добавить только proxy на backend
```

## 1. Backup и исправление прав на `/home/ubuntu/backups`

У тебя `pg_dump > /home/ubuntu/backups/...sql` упал с `Permission denied`, потому что папка была создана через `sudo`, а redirect `>` выполнялся от пользователя `ubuntu`.

Выполни:

```bash
sudo mkdir -p /home/ubuntu/backups
sudo chown -R ubuntu:ubuntu /home/ubuntu/backups

tar -czf /home/ubuntu/backups/www-html-$(date +%F-%H%M%S).tar.gz /var/www/html
sudo tar -czf /home/ubuntu/backups/nginx-$(date +%F-%H%M%S).tar.gz /etc/nginx
pg_dump -h 127.0.0.1 -U nextpath_app -d nextpath --schema-only > /home/ubuntu/backups/nextpath-schema-$(date +%F-%H%M%S).sql
```

Если `pg_dump` спросит пароль — введи пароль `nextpath_app`.

## 2. Убрать старый frontend-only clone и склонировать `project_nis`

```bash
cd /home/ubuntu

# frontend-only clone больше не нужен как рабочая папка; сохраняем на всякий случай как архивную копию
if [ -d /home/ubuntu/nextpath-ai-navigator ]; then
  mv /home/ubuntu/nextpath-ai-navigator /home/ubuntu/nextpath-ai-navigator.frontend-only.$(date +%F-%H%M%S)
fi

# если project_nis уже существует после прошлых попыток — тоже архивируем
if [ -d /home/ubuntu/project_nis ]; then
  mv /home/ubuntu/project_nis /home/ubuntu/project_nis.old.$(date +%F-%H%M%S)
fi

git clone https://github.com/d-pascenco/project_nis.git /home/ubuntu/project_nis
cd /home/ubuntu/project_nis
```

Проверка, что это реально monorepo:

```bash
ls
find . -maxdepth 2 -type d \( -name frontend -o -name backend -o -name scripts -o -name docs \) -print
```

Ожидаемо должны быть:

```text
./frontend
./backend
./scripts
./docs
```

Если `frontend/` пока не появился в `project_nis`, значит его еще не запушили в этот репозиторий. Тогда сначала нужно локально закоммитить frontend в `project_nis` и `git push`, а потом на хосте повторить clone/pull.

## 3. Создать общий `.env` в `/home/ubuntu/project_nis`

```bash
cd /home/ubuntu/project_nis
cp .env.example .env
nano .env
```

Минимум:

```env
DATABASE_URL=postgresql://nextpath_app:REAL_PASSWORD@127.0.0.1:5432/nextpath
CREATE_TABLES_ON_STARTUP=true
APP_HOST=127.0.0.1
APP_PORT=8000
FRONTEND_ORIGINS=https://nextpath.su,https://www.nextpath.su
```

Замени `REAL_PASSWORD` на реальный пароль PostgreSQL-роли `nextpath_app`.

## 4. Nginx: оставить сайт на `/var/www/html`, добавить `/api/`

Точный файл уже найден:

```text
/etc/nginx/sites-enabled/nextpath.su
```

Открой его:

```bash
sudo nano /etc/nginx/sites-enabled/nextpath.su
```

В первом HTTPS `server { ... }` добавь `location /api/` перед текущим `location /`:

```nginx
server {
    server_name nextpath.su www.nextpath.su;
    root /var/www/html;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Certbot SSL строки оставить как есть
}
```

Проверка:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Создать/заменить `nextpath-backend.service` под `/home/ubuntu/project_nis`

```bash
sudo tee /etc/systemd/system/nextpath-backend.service >/dev/null <<'EOF'
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

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable nextpath-backend
```

## 6. Первый deploy из `project_nis`

```bash
cd /home/ubuntu/project_nis
bash scripts/deploy_host.sh
```

Скрипт:

- соберет frontend;
- скопирует `dist` в `/var/www/html`;
- создаст `backend/venv`;
- поставит backend dependencies;
- применит SQL;
- перезапустит `nextpath-backend`;
- проверит и reload'ит Nginx.

## 7. Проверки

```bash
sudo systemctl status nextpath-backend --no-pager
curl http://127.0.0.1:8000/api/health
curl https://nextpath.su/api/health
curl -I https://nextpath.su/onboarding
```

Проверка записи формы:

```bash
curl -X POST https://nextpath.su/api/forms \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Deploy Test","age":"21","currentStatus":"student","targetProfession":"Data Scientist","hoursPerWeek":10,"technicalSkills":["Python","SQL"],"languages":[{"name":"English","level":70}]}'
```

Проверка в БД:

```bash
psql -h 127.0.0.1 -U nextpath_app -d nextpath -c "SELECT id, full_name, target_profession, created_at FROM user_forms ORDER BY id DESC LIMIT 5;"
```

## 8. Дальнейшие деплои

После этого на хосте рабочая папка всегда `/home/ubuntu/project_nis`:

```bash
cd /home/ubuntu/project_nis
git pull --ff-only
bash scripts/deploy_host.sh
```

Если хочешь `git push prod main`, bare repo hook должен использовать `WORK_TREE=/home/ubuntu/project_nis`, а не `nextpath-ai-navigator`.
