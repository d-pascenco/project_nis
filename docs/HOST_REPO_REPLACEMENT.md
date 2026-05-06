# Замена frontend-only папки на хосте на новый monorepo

Этот файл описывает именно ситуацию, которая произошла на хосте 2026-05-06:

- `/home/ubuntu/nextpath-ai-navigator` был переименован;
- затем снова был склонирован `https://github.com/d-pascenco/nextpath-ai-navigator.git`;
- после clone в папке оказались только frontend-файлы (`package.json`, `src`, `public`, `vite.config.ts`);
- папок `backend/`, `scripts/`, `docs/` там нет;
- поэтому `bash scripts/deploy_host.sh` закономерно падает с `No such file or directory`.

Это значит, что на GitHub по этому URL пока лежит старый frontend-only репозиторий, а не новый monorepo. Сначала нужно запушить новый monorepo в GitHub или клонировать другой URL, где уже есть `frontend/`, `backend/`, `scripts/`, `docs/`.

## 1. Быстро восстановить сайт, если он сейчас сломан

Если после переименований сайт перестал открываться, можно просто пересобрать текущий frontend-only clone и снова положить `dist` в `/var/www/html`:

```bash
cd /home/ubuntu/nextpath-ai-navigator
npm ci
npm run build
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo nginx -t
sudo systemctl reload nginx
```

Это вернет статический сайт, но backend еще не появится.

## 2. Исправить backup permission issue

Ошибка:

```text
Permission denied: /home/ubuntu/backups/nextpath-schema-....sql
```

возникла потому, что директория `/home/ubuntu/backups` или файлы внутри созданы через `sudo`, а shell-redirect `>` выполняется от пользователя `ubuntu`.

Исправить права:

```bash
sudo mkdir -p /home/ubuntu/backups
sudo chown -R ubuntu:ubuntu /home/ubuntu/backups
pg_dump -h 127.0.0.1 -U nextpath_app -d nextpath --schema-only > /home/ubuntu/backups/nextpath-schema-$(date +%F-%H%M%S).sql
```

Альтернатива без `chown`:

```bash
sudo sh -c 'pg_dump -h 127.0.0.1 -U nextpath_app -d nextpath --schema-only > /home/ubuntu/backups/nextpath-schema-$(date +%F-%H%M%S).sql'
```

Но `chown` проще для учебного проекта.

## 3. На локальном компьютере: убедиться, что GitHub содержит monorepo

В локальном репозитории должно быть так:

```text
nextpath-ai-navigator/
├── frontend/
├── backend/
├── docs/
├── scripts/
├── .env.example
└── README.md
```

Проверь локально:

```bash
pwd
find . -maxdepth 2 -type d \( -name frontend -o -name backend -o -name scripts -o -name docs \) -print
git status
git remote -v
```

Если remote еще не настроен:

```bash
git remote add origin git@github.com:d-pascenco/nextpath-ai-navigator.git
```

Если на GitHub сейчас старый frontend-only repo, а локально уже правильный monorepo, нужно заменить содержимое GitHub на monorepo:

```bash
git branch -M main
git push -u origin main --force-with-lease
```

Важно: `--force-with-lease` перезапишет ветку `main` на GitHub. Делай это только если локальный репозиторий действительно содержит актуальный frontend + backend. Старый frontend-only repo у тебя уже сохранен в GitHub history/локальных backup-папках на хосте.

Если не хочешь force-push, создай новый GitHub repo для monorepo и дальше на хосте клонируй его URL вместо старого.

## 4. На хосте: удалить текущий frontend-only clone и склонировать monorepo

После того как GitHub точно содержит monorepo:

```bash
cd /home/ubuntu

# текущий clone frontend-only не удаляем навсегда, а переименовываем
if [ -d /home/ubuntu/nextpath-ai-navigator ]; then
  mv /home/ubuntu/nextpath-ai-navigator /home/ubuntu/nextpath-ai-navigator.frontend-only.$(date +%F-%H%M%S)
fi

git clone https://github.com/d-pascenco/nextpath-ai-navigator.git /home/ubuntu/nextpath-ai-navigator
cd /home/ubuntu/nextpath-ai-navigator

# обязательно должны появиться эти папки
ls
find . -maxdepth 2 -type d \( -name frontend -o -name backend -o -name scripts -o -name docs \) -print
```

Ожидаемо:

```text
./frontend
./backend
./scripts
./docs
```

Если этих папок нет — на GitHub все еще не monorepo, deploy продолжать нельзя.

## 5. Создать общий `.env` на хосте

```bash
cd /home/ubuntu/nextpath-ai-navigator
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

## 6. Nginx: точная минимальная правка

Текущий файл сайта уже найден:

```text
/etc/nginx/sites-enabled/nextpath.su
```

В первом HTTPS `server { ... }` добавь `location /api/` перед `location /`:

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

    # Certbot SSL строки ниже оставить как есть
}
```

Проверка:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Создать backend systemd service

```bash
sudo tee /etc/systemd/system/nextpath-backend.service >/dev/null <<'EOF'
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
EOF

sudo systemctl daemon-reload
sudo systemctl enable nextpath-backend
```

## 8. Запустить deploy

```bash
cd /home/ubuntu/nextpath-ai-navigator
bash scripts/deploy_host.sh
```

Скрипт должен:

- собрать `frontend/`;
- скопировать `frontend/dist` в `/var/www/html`;
- создать `backend/venv`;
- поставить backend requirements;
- применить SQL;
- запустить/restart `nextpath-backend`;
- проверить и reload Nginx.

## 9. Проверки

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

Проверка БД:

```bash
psql -h 127.0.0.1 -U nextpath_app -d nextpath -c "SELECT id, full_name, target_profession, created_at FROM user_forms ORDER BY id DESC LIMIT 5;"
```

## 10. Настроить дальнейший deploy

После правильного clone monorepo дальнейший deploy будет коротким:

```bash
cd /home/ubuntu/nextpath-ai-navigator
git pull --ff-only
bash scripts/deploy_host.sh
```

Если хочешь прямой push на host, используй раздел про `git push prod main` из `docs/CURRENT_HOST_NEXT_STEPS.md`.
