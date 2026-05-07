# Деплой NextPath на production

**Хост:** Oracle Cloud Free Tier · Ubuntu 24.04 · `mnad-projest`  
**Стек:** Nginx + Cloudflare + Let's Encrypt + PostgreSQL 16 + systemd

## Схема

```
Пользователь → Cloudflare → Nginx
                                ├── nextpath.su    → /var/www/html (SPA)
                                ├── my.nextpath.su → /var/www/html (SPA)
                                └── /api/*         → FastAPI :8000 → PostgreSQL
```

## Первый деплой на чистый хост

```bash
# 1. Клонировать репозиторий
git clone https://github.com/d-pascenco/project_nis.git /home/ubuntu/project_nis
cd /home/ubuntu/project_nis

# 2. Создать .env из шаблона и заполнить секреты
cp .env.example .env
nano .env

# 3. Создать systemd-сервис бэкенда
sudo tee /etc/systemd/system/nextpath-backend.service > /dev/null <<'EOF'
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

# 4. Первый деплой
NODE_OPTIONS="--max-old-space-size=512" bash scripts/deploy_host.sh
```

## Обновление (последующие деплои)

```bash
cd /home/ubuntu/project_nis
git pull origin main
NODE_OPTIONS="--max-old-space-size=512" bash scripts/deploy_host.sh
```

## Nginx

Конфиг: `/etc/nginx/sites-enabled/nextpath.su`

Оба домена (`nextpath.su` и `my.nextpath.su`) отдают один и тот же `/var/www/html`. Роутинг между доменами реализован в самом React-приложении через `IS_CABINET_DOMAIN`.

Обязательные блоки в каждом server:

```nginx
root /var/www/html;
index index.html;

location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

## SSL (Certbot)

```bash
sudo certbot --nginx -d nextpath.su -d www.nextpath.su
sudo certbot --nginx -d my.nextpath.su
```

## iptables — сохранение после перезагрузки

Oracle Cloud сбрасывает iptables при reboot. Сохраняем правила навсегда:

```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 5432 -j ACCEPT   # только если нужен внешний доступ к БД
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

## PostgreSQL

```bash
# Создать БД и роли
sudo -u postgres psql
CREATE DATABASE nextpath;
CREATE USER nextpath_app WITH PASSWORD 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE nextpath TO nextpath_app;

# Применить миграции
psql -h 127.0.0.1 -U nextpath_app -d nextpath -f backend/sql/001_create_user_forms.sql
psql -h 127.0.0.1 -U nextpath_app -d nextpath -f backend/sql/002_create_users.sql
psql -h 127.0.0.1 -U nextpath_app -d nextpath -f backend/sql/003_alter_users_add_progress.sql
psql -h 127.0.0.1 -U nextpath_app -d nextpath -f backend/sql/004_alter_users_add_form_data.sql
```

Далее миграции применяются автоматически при каждом `bash scripts/deploy_host.sh`.

## Диагностика

```bash
# Статус сервисов
sudo systemctl status nextpath-backend nginx postgresql --no-pager

# Логи бэкенда
journalctl -u nextpath-backend -f

# Проверка API
curl -s https://nextpath.su/api/health | python3 -m json.tool

# Маршруты FastAPI
curl -s http://127.0.0.1:8000/openapi.json | python3 -c \
  "import json,sys; [print(p) for p in sorted(json.load(sys.stdin)['paths'])]"

# Данные в БД
psql -h 127.0.0.1 -U nextpath_app -d nextpath \
  -c "SELECT id, name, email, created_at FROM users ORDER BY id DESC LIMIT 5;"
```

## Rollback

```bash
# Откат до конкретного коммита
git reset --hard COMMIT_SHA
NODE_OPTIONS="--max-old-space-size=512" bash scripts/deploy_host.sh

# Только остановить бэкенд (сайт продолжает работать)
sudo systemctl stop nextpath-backend
```
