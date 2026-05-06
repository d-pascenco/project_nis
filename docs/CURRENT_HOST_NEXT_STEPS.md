# Следующие команды для текущего хоста `mnad-projest`

Этот план основан на фактическом выводе с хоста:

- пользователь: `ubuntu`;
- OS: Ubuntu 24.04.4 LTS;
- Nginx активен, `nginx -t` проходит;
- текущий статический сайт лежит в `/var/www/html/index.html`;
- старый repo-каталог есть в `/home/ubuntu/nextpath-ai-navigator`;
- Node.js `v18.19.1`, npm `9.2.0`, Python `3.12.3`, PostgreSQL `16.13` уже установлены;
- backend-service `nextpath-backend` еще не создан;
- PostgreSQL сейчас слушает `0.0.0.0:5432` и `[::]:5432`.

## 1. Еще одна быстрая проверка Nginx

Команда `find /etc/nginx/sites-enabled -type f` ничего не показала, потому что конфиг может быть symlink или лежать не в `sites-enabled`. Перед правкой выполни:

```bash
sudo nginx -T | sed -n '1,260p'
sudo find -L /etc/nginx/sites-enabled /etc/nginx/conf.d -maxdepth 1 -type f -print -exec sed -n '1,220p' {} \;
```

Нужно найти `server { ... }`, который отвечает за `nextpath.su` и уже содержит SSL-настройки Certbot/Cloudflare. Его не удаляем, только добавляем `location /api/` и SPA fallback.

## 2. Backup текущего состояния

```bash
sudo mkdir -p /home/ubuntu/backups
sudo tar -czf /home/ubuntu/backups/www-html-$(date +%F-%H%M%S).tar.gz /var/www/html
sudo tar -czf /home/ubuntu/backups/nginx-$(date +%F-%H%M%S).tar.gz /etc/nginx
pg_dump -h 127.0.0.1 -U nextpath_app -d nextpath --schema-only > /home/ubuntu/backups/nextpath-schema-$(date +%F-%H%M%S).sql || true
```

## 3. Заменить старый repo новым monorepo

Старую папку не удаляем — переименовываем для rollback:

```bash
cd /home/ubuntu
mv /home/ubuntu/nextpath-ai-navigator /home/ubuntu/nextpath-ai-navigator.old.$(date +%F-%H%M%S)
git clone https://github.com/d-pascenco/nextpath-ai-navigator.git /home/ubuntu/nextpath-ai-navigator
cd /home/ubuntu/nextpath-ai-navigator
```

Если репозиторий приватный, GitHub попросит token или нужно будет настроить SSH deploy key.

## 4. Создать backend `.env`

```bash
cd /home/ubuntu/nextpath-ai-navigator/backend
cp .env.example .env
nano .env
```

Пример содержимого:

```env
DATABASE_URL=postgresql://nextpath_app:REAL_PASSWORD@127.0.0.1:5432/nextpath
APP_HOST=127.0.0.1
APP_PORT=8000
FRONTEND_ORIGINS=https://nextpath.su,https://www.nextpath.su
CREATE_TABLES_ON_STARTUP=true
```

Замени `REAL_PASSWORD` на реальный пароль роли `nextpath_app`.

## 5. Создать systemd-service backend

```bash
sudo tee /etc/systemd/system/nextpath-backend.service >/dev/null <<'EOF'
[Unit]
Description=NextPath FastAPI Backend
After=network.target postgresql.service

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/nextpath-ai-navigator/backend
EnvironmentFile=/home/ubuntu/nextpath-ai-navigator/backend/.env
ExecStart=/home/ubuntu/nextpath-ai-navigator/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable nextpath-backend
```

Пока не страшно, если сервис еще не стартует: сначала нужно поставить backend-зависимости через deploy script.

## 6. Nginx: оставить `/var/www/html` и добавить API

Так как текущий сайт уже отдается из `/var/www/html`, самый безопасный путь — оставить этот web root.

В SSL `server { ... }` для `nextpath.su` должны быть такие блоки:

```nginx
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
```

Проверка после правки:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Первый деплой

```bash
cd /home/ubuntu/nextpath-ai-navigator
bash scripts/deploy_host.sh
```

Скрипт по умолчанию копирует frontend-сборку в `/var/www/html`, обновляет backend venv, применяет SQL, рестартит `nextpath-backend` и reload'ит Nginx.

## 8. Проверки после деплоя

```bash
sudo systemctl status nextpath-backend --no-pager
curl http://127.0.0.1:8000/api/health
curl https://nextpath.su/api/health
curl -I https://nextpath.su/onboarding
```

Проверка формы:

```bash
curl -X POST https://nextpath.su/api/forms \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Deploy Test","age":"21","currentStatus":"student","targetProfession":"Data Scientist","hoursPerWeek":10,"technicalSkills":["Python","SQL"],"languages":[{"name":"English","level":70}]}'
```

Проверка БД:

```bash
psql -h 127.0.0.1 -U nextpath_app -d nextpath -c "SELECT id, full_name, target_profession, created_at FROM user_forms ORDER BY id DESC LIMIT 5;"
```

## 9. Настроить push с локального repo на хост

### Вариант проще: GitHub + pull на хосте

Локально:

```bash
git push origin main
```

На хосте:

```bash
cd /home/ubuntu/nextpath-ai-navigator
git pull --ff-only
bash scripts/deploy_host.sh
```

### Вариант удобнее: `git push prod main`

На хосте:

```bash
mkdir -p /home/ubuntu/git
git init --bare /home/ubuntu/git/nextpath.git
cat > /home/ubuntu/git/nextpath.git/hooks/post-receive <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

BRANCH="main"
WORK_TREE="/home/ubuntu/nextpath-ai-navigator"
GIT_DIR="/home/ubuntu/git/nextpath.git"

while read oldrev newrev refname; do
  if [ "$refname" = "refs/heads/$BRANCH" ]; then
    mkdir -p "$WORK_TREE"
    git --work-tree="$WORK_TREE" --git-dir="$GIT_DIR" checkout -f "$BRANCH"
    cd "$WORK_TREE"
    bash scripts/deploy_host.sh
  fi
done
EOF
chmod +x /home/ubuntu/git/nextpath.git/hooks/post-receive
```

Локально:

```bash
git remote add prod ubuntu@YOUR_SERVER_PUBLIC_IP:/home/ubuntu/git/nextpath.git
git push prod main
```

Если локальная ветка не `main`:

```bash
git push prod HEAD:main
```

## 10. После того как backend заработает — закрыть PostgreSQL наружу

Сейчас PostgreSQL слушает `0.0.0.0:5432`, то есть наружу. После проверки backend лучше вернуть PostgreSQL на localhost:

```bash
sudo nano /etc/postgresql/16/main/postgresql.conf
```

Поменять:

```conf
listen_addresses = 'localhost'
```

Потом в `pg_hba.conf` оставить localhost-доступ:

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

После правки:

```bash
sudo systemctl restart postgresql
sudo ss -tulnp | grep 5432
```

Ожидаемо должно быть `127.0.0.1:5432`, а не `0.0.0.0:5432`.
