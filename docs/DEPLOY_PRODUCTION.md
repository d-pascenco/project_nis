# Production deploy на Oracle Ubuntu для NextPath

Документ описывает безопасный перенос нового monorepo (`frontend/` + `backend/`) на уже настроенный хост, где есть Oracle Cloud, Nginx, Cloudflare, HTTPS, PostgreSQL и домен `nextpath.su`.

Цель: заменить старую статическую сборку сайта новым репозиторием и поднять backend без поломки текущих SSL/DNS/Nginx-настроек.

## 0. Что сначала проверить на хосте

Подключись по SSH и выполни команды ниже. Их вывод можно прислать в чат, чтобы точно понять текущую конфигурацию перед изменениями.

```bash
whoami
hostname -I
pwd
uname -a
cat /etc/os-release | grep PRETTY_NAME

# Nginx и текущий web root
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo find -L /etc/nginx/sites-enabled /etc/nginx/conf.d -maxdepth 1 -type f -print -exec sed -n '1,220p' {} \;
sudo find /var/www -maxdepth 3 -type f \( -name 'index.html' -o -name '*.conf' \) -print

# Что уже лежит в home ubuntu
find /home/ubuntu -maxdepth 2 -type d \( -name '.git' -o -name 'backend' -o -name 'frontend' -o -name 'nextpath*' \) -print

# Node/Python/PostgreSQL
node -v || true
npm -v || true
python3 --version
psql --version
sudo systemctl status postgresql --no-pager
sudo ss -tulnp | grep -E ':(80|443|5432|8000)\b' || true

# Если backend-service уже создавался
systemctl list-units --type=service | grep nextpath || true
sudo systemctl status nextpath-backend --no-pager || true
```

## 1. Рекомендуемая схема production

```text
Пользователь → Cloudflare/HTTPS → Nginx → frontend static files
                                      └── /api/* → FastAPI backend → PostgreSQL localhost
```

Важно:

- Nginx и Certbot/Cloudflare остаются как есть.
- Frontend собирается в `dist/` и копируется в текущий web root. На нашем хосте сейчас найден `/var/www/html`, поэтому deploy script по умолчанию использует именно его.
- Backend запускается локально на `127.0.0.1:8000` через systemd.
- PostgreSQL для backend должен быть доступен через `127.0.0.1:5432`; внешний порт `5432` лучше закрыть после того, как прямой доступ команде больше не нужен.

## 2. Безопасный backup перед заменой сайта

На хосте:

```bash
sudo mkdir -p /home/ubuntu/backups

# backup текущего сайта
sudo tar -czf /home/ubuntu/backups/www-html-$(date +%F-%H%M%S).tar.gz /var/www/html 2>/dev/null || true
sudo tar -czf /home/ubuntu/backups/www-nextpath-$(date +%F-%H%M%S).tar.gz /var/www/nextpath 2>/dev/null || true

# backup nginx-конфигов
sudo tar -czf /home/ubuntu/backups/nginx-$(date +%F-%H%M%S).tar.gz /etc/nginx

# backup структуры БД без данных
pg_dump -h 127.0.0.1 -U nextpath_app -d nextpath --schema-only > /home/ubuntu/backups/nextpath-schema-$(date +%F-%H%M%S).sql || true
```

Если `pg_dump` попросит пароль — введи пароль пользователя `nextpath_app`.

## 3. Вариант A — проще и надежнее: хост делает `git pull` из GitHub

Это рекомендуемый вариант для учебного проекта.

### 3.1 На локальном компьютере

```bash
git status
git add .
git commit -m "Update monorepo with frontend and backend"
git push origin main
```

Если ветка называется не `main`, замени `main` на свою ветку.

### 3.2 На хосте: первый деплой нового repo

```bash
cd /home/ubuntu

# старый каталог не удаляем сразу — переименовываем, чтобы был быстрый rollback
if [ -d /home/ubuntu/nextpath-ai-navigator ]; then
  mv /home/ubuntu/nextpath-ai-navigator /home/ubuntu/nextpath-ai-navigator.old.$(date +%F-%H%M%S)
fi

git clone https://github.com/d-pascenco/nextpath-ai-navigator.git /home/ubuntu/nextpath-ai-navigator
cd /home/ubuntu/nextpath-ai-navigator
```

Если GitHub private и попросит доступ — используй GitHub token или SSH deploy key.

### 3.3 На хосте: последующие деплои

```bash
cd /home/ubuntu/nextpath-ai-navigator
git pull --ff-only
bash scripts/deploy_host.sh
```

## 4. Вариант B — push-to-prod напрямую по SSH

Этот вариант удобен, если хочется делать `git push prod main` с локального компьютера. На хосте создается bare-репозиторий и hook, который обновляет рабочую папку и запускает deploy script.

### 4.1 На хосте

```bash
mkdir -p /home/ubuntu/git /home/ubuntu/nextpath-ai-navigator
git init --bare /home/ubuntu/git/nextpath.git
```

Создай hook:

```bash
nano /home/ubuntu/git/nextpath.git/hooks/post-receive
```

Вставь:

```bash
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
```

Права:

```bash
chmod +x /home/ubuntu/git/nextpath.git/hooks/post-receive
```

### 4.2 На локальном компьютере

```bash
git remote add prod ubuntu@SERVER_IP:/home/ubuntu/git/nextpath.git
git push prod main
```

Если локальная ветка называется иначе:

```bash
git push prod HEAD:main
```

## 5. Deploy script

В репозитории есть `scripts/deploy_host.sh`. Он делает типовой деплой:

1. Находит frontend в `frontend/` или в корне репозитория.
2. Устанавливает frontend-зависимости через `npm ci` или `npm install`.
3. Собирает frontend через `npm run build`.
4. Копирует `dist/` в web root. По умолчанию это `/var/www/html`, чтобы сохранить текущую настройку хоста.
5. Создает/обновляет backend virtualenv.
6. Устанавливает `backend/requirements.txt`.
7. Применяет SQL `backend/sql/001_create_user_forms.sql`, если `psql` доступен.
8. Перезапускает `nextpath-backend`, если systemd-service уже создан.
9. Проверяет и перезагружает Nginx.

Ручной запуск:

```bash
cd /home/ubuntu/nextpath-ai-navigator
bash scripts/deploy_host.sh
```

Если web root нужно переопределить, можно запустить так:

```bash
WEB_ROOT=/var/www/nextpath bash scripts/deploy_host.sh
```

## 6. Backend `.env` на хосте

Создай файл:

```bash
cd /home/ubuntu/nextpath-ai-navigator/backend
cp .env.example .env
nano .env
```

Пример:

```env
DATABASE_URL=postgresql://nextpath_app:REAL_PASSWORD@127.0.0.1:5432/nextpath
APP_HOST=127.0.0.1
APP_PORT=8000
FRONTEND_ORIGINS=https://nextpath.su,https://www.nextpath.su
CREATE_TABLES_ON_STARTUP=true
```

Пароль нужно заменить на реальный пароль роли `nextpath_app`.

## 7. systemd для backend

Создай сервис:

```bash
sudo nano /etc/systemd/system/nextpath-backend.service
```

Вставь:

```ini
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
```

Запуск:

```bash
sudo systemctl daemon-reload
sudo systemctl enable nextpath-backend
sudo systemctl restart nextpath-backend
sudo systemctl status nextpath-backend --no-pager
```

Логи:

```bash
journalctl -u nextpath-backend -f
```

## 8. Nginx для frontend + API

Если Certbot уже создал HTTPS-конфиг, не удаляй его. Нужно только аккуратно поменять `root` и добавить `/api/`.

Открой текущий конфиг:

```bash
sudo nano /etc/nginx/sites-enabled/default
```

Внутри нужного `server { ... }` для `nextpath.su` должно быть примерно так:

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

Проверка:

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -I https://nextpath.su/onboarding
curl https://nextpath.su/api/health
```

Ожидаемо:

- `/onboarding` возвращает HTML сайта.
- `/api/health` возвращает `{"status":"ok"}`.

## 9. Smoke test формы

```bash
curl -X POST https://nextpath.su/api/forms \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Deploy Test","age":"21","currentStatus":"student","targetProfession":"Data Scientist","hoursPerWeek":10,"technicalSkills":["Python","SQL"],"languages":[{"name":"English","level":70}]}'
```

Проверка в БД:

```bash
psql -h 127.0.0.1 -U nextpath_app -d nextpath -c "SELECT id, full_name, target_profession, created_at FROM user_forms ORDER BY id DESC LIMIT 5;"
```

## 10. Rollback, если что-то пошло не так

### Frontend rollback

Вернуть предыдущий backup web root:

```bash
sudo rm -rf /var/www/html/*
sudo tar -xzf /home/ubuntu/backups/www-html-DATE.tar.gz -C /
sudo nginx -t && sudo systemctl reload nginx
```

Если сайт был перенесен в `/var/www/nextpath`, аналогично восстанови backup `www-nextpath-*.tar.gz`.

### Repo rollback

```bash
cd /home/ubuntu/nextpath-ai-navigator
git log --oneline -5
git reset --hard COMMIT_SHA
bash scripts/deploy_host.sh
```

### Backend rollback

```bash
sudo systemctl stop nextpath-backend
sudo systemctl status nextpath-backend --no-pager
```

Frontend продолжит открываться, но `/api/*` временно не будет работать.
