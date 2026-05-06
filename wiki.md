# Полный воркфлоу создания и развертывания проекта с нуля

## Overview

В рамках проекта был создан сайт (фронтенд) на платформе https://lovable.dev, развёрнут хост на Oracle Cloud Free Tier, SSH, подключён Cloudflare (проксирование трафика), база данных и бэкенд на python.
Ниже описана подробная последовательность действий команды, возникшие ошибки и способы их устранения.

## 1. Создание инстанса в Oracle Cloud

### 1.1 Создание инстанса
В Oracle Cloud Console:
- `Compute`
- `Instances`
- `Create Instance`

### 1.2 Параметры инстанса
При создании были выбраны следующие параметры:
- **Shape:** `VM.Standard.E2.1.Micro`
- **Image:** `Canonical Ubuntu 24.04`
- **Public IP:** включён
- **SSH key:** загружен при создании инстанса

## 2. Настройка сети Oracle Cloud
После создания нового инстанса потребовалась ручная проверка сетевой конфигурации.

### 2.1 Security List
В Security List были настроены входящие правила.

#### Ingress Rules
| Source     | Protocol | Destination Port | Назначение       |
|------------|----------|------------------|------------------|
| 0.0.0.0/0  | TCP      | 22               | SSH (для команды)|
| 0.0.0.0/0  | TCP      | 80               | HTTP             |
| 0.0.0.0/0  | TCP      | 443              | HTTPS            |
| 0.0.0.0/0  | TCP      | 5432             | postgres db      |

В дальнейшем на хосте открыть вышеперечисленные порты можно через следюущие команды: 
```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
```
И проверка внутри:
```bash
sudo iptables -L -n
```
- в секции INPUT должен быть правило с ACCEPT для вашего порта выше строки REJECT icmp-host-prohibited

Проверка снаружи:
```bash
ncat -zv наш_ip 80
```
- ответ будет что-то вроде Ncat: Connected to ваш_ip:80.

### 2.2 Проверка подсети
Подсеть из коробки имела параметры:
- тип: `Public Subnet`
- CIDR: `10.0.0.0/24`
Это означало, что инстанс может использовать публичный доступ, но только при наличии правильного маршрута через Internet Gateway.

### 2.3 Internet Gateway
Для VCN был создан Internet Gateway.
Путь в интерфейсе:
- `Networking`
- `Virtual Cloud Networks`
- выбрать VCN
- `Internet Gateway`
- `Create Internet Gateway`

### 2.4 Route Table
В `Default Route Table` было добавлено правило:
- **Destination CIDR block:** `0.0.0.0/0`
- **Target Type:** `Internet Gateway`
Без этого правила внешний трафик до инстанса не доходил.

## 3. Первая диагностика SSH-доступа
После создания инстанса была попытка подключения по SSH.

### 3.1 Подключение по SSH
а. Linux. 
- Установка ssh-клиента (если нету):
```bash
sudo apt update && sudo apt install ssh
```
- Подключаемся:
```bash
ssh -i /путь/к/ssh-ключу/ssh-key-2026-04-12.key ubuntu@публичный_айпи_адрес_инстанса
```
б. Windows
- Установка ssh клиента:
«Пуск» → «Параметры» → «Приложения» → «Дополнительные компоненты» → «Добавить компонент» → найти OpenSSH Client → установить.
`Settings` - `Apps` - `Optional Features` - `Add a feature` - выбрать `OpenSSH Client` - установить
- Затем открываем powershell и подключаемся:
```bash
ssh -i C:\путь\к\ssh-ключу\ssh-key-2026-04-12.key ubuntu@публичный_айпи_адрес_инстанса
```

### 3.2 Ошибка прав на приватный ключ
```text
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions 0644 for '/home/что-то там/ssh-key-2026-04-12.key' are too open.
This private key will be ignored.
Load key "/home/что-то там/ssh-key-2026-04-12.key": bad permissions
ubuntu@адрес_хоста: Permission denied (publickey).
```
- Решение:
Были изменены права на приватный ключ:
```bash
chmod 600 /путь к ключу/ssh-key-2026-04-12.key
```

### 3.3 Передача доступа команде
В проекте использовался не отдельный пользователь для каждого участника, а более простой вариант:
- участникам команды был передан один и тот же SSH-ключ
#### 3.3.1 Недостатки такого подхода
Этот способ работает, но имеет ограничения:
- отсутствует разграничение доступа
- нельзя выборочно отозвать доступ у одного участника
- при компрометации ключа скомпрометирован весь доступ к серверу
- действия всех участников выполняются под одним и тем же пользователем

Для учебного проекта такой способ использовался как самый быстрый.

## 4. Проверка характеристик системы
После успешного входа по SSH были выполнены команды для получения информации о системе.

### 4.1 Команды
```bash
uname -a
cat /etc/os-release
lscpu
cat /proc/meminfo | grep MemTotal
df -h
hostname -I
```

### 4.2 Полученные характеристики

По выводу системы:
- **OS:** Ubuntu 24.04.4 LTS
- **CPU:** 2 vCPU
- **RAM:** около 1 GB
- **Disk:** около 48 GB доступного пространства на корневом разделе

Можно одной командой:
```bash
echo "=== OS ===" && cat /etc/os-release | grep -E "PRETTY_NAME|VERSION" && echo "=== CPU ===" && lscpu | grep -E "Model name|CPU\(s\)" && echo "=== RAM ===" && cat /proc/meminfo | grep MemTotal && echo "=== DISK ===" && df -h
```

## 5. Обновление системы
После входа на сервер была выполнена базовая подготовка системы.

### 5.1 Обновление списка пакетов
```bash
sudo apt update
```

### 5.2 Установка обновлений
```bash
sudo apt upgrade -y
```

### 5.3 Установленные пакеты
На сервер были установлены базовые пакеты, необходимые для дальнейшей работы.
```bash
sudo apt install -y nginx
sudo apt install -y curl git
```
- `nginx` — веб-сервер
- `curl` — выполнение HTTP-запросов из консоли
- `git` — клонирование и обновление репозитория проекта
Также установлены:
- `nano` — текстовый редактор

Команды, которые помогут в навигации:
- `dpkg -l` — все существующие установленные пакеты и их назначение
- `apt-mark showmanual` — пользовательские, без авто

## 6. Настройка и запуск Nginx
Nginx — это веб-сервер, который быстро отдает статические файлы сайта (HTML, картинки) и работает как прокси: принимает запросы от пользователей и пересылает на другие серверы (балансировка нагрузки).
Альтернатива Apache: быстрее на статике, асинхронный. Конфиг в /etc/nginx/nginx.conf.

### 6.1 Установка, включение и запуск
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```
Проверка статуса:
```bash
systemctl status nginx
```

### 6.2 Проверка работы сайта по IP
Для проверки того, что веб-сервер реально отдаёт страницу, была создана тестовая HTML-страница.
```bash
echo '<html><body>ok</body></html>' | sudo tee /var/www/html/index.html
```
После этого страница должна открываться в браузере по адресу:
```text
http://<наш_ip_инстанса>
```

## 7. Пулим и собираем проект сайта
Репозиторий:
https://github.com/d-pascenco/project_nis.git

### 7.1 Переходим в домашнюю папку и клонируем проект из репозитория:
```bash
cd ~
git clone https://github.com/d-pascenco/project_nis.git
```
- Гит попросит логин и токен.

Проект находится в следующей директории:
```
/home/ubuntu/project_nis
```

Структура monorepo:
```
project_nis/
├── frontend/
├── backend/
├── scripts/deploy_host.sh
└── docs/
```

### 7.2 Устанавливаем зависимости и собираем frontend
```bash
cd project_nis/frontend
npm install
npm run build
```
Возможно еще понадобятся команды:
`npm run dev` - Start the development server with auto-reloading and an instant preview.

### 7.3 После установки Nginx настроен на /var/www/html (дефолтная конфигурация nginx).
Поэтому при выкатке обновлений на сайт нужно будет делать следующее:
```bash
cd ~/project_nis
git pull --ff-only
bash scripts/deploy_host.sh
```

Скрипт `scripts/deploy_host.sh` автоматически:
- устанавливает зависимости и собирает frontend
- копирует `dist/` в web root
- обновляет Python venv бэкенда
- применяет SQL-миграции
- перезапускает `nextpath-backend`
- проверяет и reload'ит Nginx

### 7.4 Выдаем сайту сертификат через sertbot (переход с http на https)
HTTPS — обязательно для любого сайта с формами/данными. Бесплатно через Let’s Encrypt.
Certbot сам найдёт nginx и добавит SSL в конфиг /etc/nginx/sites-available/наш_сайт.ком

Установка:
```bash
sudo apt install -y certbot python3-certbot-nginx
```
Выдача:
```bash
sudo certbot --nginx -d nextpath.su -d www.nextpath.su
```

Зачем нужны сертификаты:
- Шифрование: данные между браузером и сайтом не перехватываются хакерами (логины, пароли, формы).
- Доверие: зелёный замок в адресной строке — пользователи охотнее заполняют формы, покупают.
- SEO: Google/Yandex повышают сайты с HTTPS в выдаче.
- Браузеры: Chrome/Firefox блокируют/пугают HTTP‑сайты — “Not secure”.

Что будет без них:
- браузеры пишут “Not secure” (как у тебя).
- пользователи закрывают сайт (конверсия падает).
- Google/Yandex опускают в поиске.
- хакеры могут украсть данные.


### 7.5 Если nginx настроен на другую директорию, то изменить можно так:

Откройте конфиг:
```bash
sudo nano /etc/nginx/sites-enabled/default
```

Замените root в server { ... } на путь к нашему сайту:
```
server {
    listen 80;

    root /var/www/mysite;
    index index.html index.htm;

    server_name _;

    location / {
        try_files $uri $uri/ =404;
    }
}
```
После сохранения:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Подключение Cloudflare
После того как сайт стал доступен по IP, был подключён Cloudflare. Это сделано для того, чтобы сайт был доступен из РФ.
Cloudflare использовался для:
- привязки домена к серверу
- маршрутизации трафика через прокси
- дальнейшей настройки HTTPS и DNS-управления

### 8.1 Что было сделано
- добавлен домен в Cloudflare
- создана `A`-запись, указывающая на публичный IP инстанса
- включён proxy Cloudflare

## 9. Итоговое состояние после настройки
После выполнения всех шагов была получена рабочая конфигурация:
- создан Oracle Cloud инстанс на Free Tier
- выбран Ubuntu 24.04
- назначен public IP
- открыт SSH-доступ на порт `22`
- открыт веб-доступ на порты `80` и `443`
- настроен Internet Gateway
- настроен маршрут `0.0.0.0/0`
- выполнено подключение по SSH
- обновлена система
- установлены `nginx`, `curl`, `git`
- запущен `nginx`
- проверена отдача тестовой страницы
- подключён Cloudflare
- доступ к серверу передан команде через SSH-ключ

## 10. Установка и настройка базы данных

### 10.1 Установка
Выбран postgres движок.
Установка:
```bash
sudo apt install postgresql postgresql-contrib -y
```
Проверяем, что сервис запущен:
```bash
sudo systemctl status postgresql
```
Команда входа в СУБД из консоли:
```bash
sudo -u postgres psql
```
### 10.2 Создание базы данных и ролей
Создание базы:
```sql
CREATE DATABASE nextpath;
```
Создание ролей:
```sql
-- backend (postgres юзер, под которым бэк будет выполнять действия)
CREATE USER nextpath_app WITH PASSWORD 'strong_password';

-- юзер для команды (создан один юзер, чтобы проще было управлять доступом)
CREATE USER nextpath_admin WITH PASSWORD 'admin_password';
ALTER USER nextpath_admin WITH SUPERUSER;
```
Выдача доступа:
```sql
GRANT ALL PRIVILEGES ON DATABASE nextpath TO nextpath_app;
GRANT ALL PRIVILEGES ON DATABASE nextpath TO nextpath_admin;
```
### 10.3 Подключение к базе
Помимо программ клиентов для подключения к базе, можно подключаться через консоль:
```bash
\c nextpath
```
#### 10.3.1 Подключение из SQL клиента

Параметры:
```text
Host: публичный адрес нашего инстанса (выдан команде)
Port: 5432
Database: nextpath
User: nextpath_app
Password: наш пароль (выдан команде)
```

### 10.4 Настройка прав

Убираем superuser у backend:
```sql
ALTER USER nextpath_app NOSUPERUSER;
```
Доступ к схеме:
```sql
GRANT USAGE ON SCHEMA public TO nextpath_app;
```
Доступ к таблицам:
sql```
GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA public
TO nextpath_app;
```
Права по умолчанию:
```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLES TO nextpath_app;
```
### 10.5 Разрешение внешних подключений

По умолчанию PostgreSQL слушает только localhost.

Проверяем:
```bash
sudo ss -tulnp | grep 5432
```
Если выдает 127.0.0.1:5432 нужно изменить конфиг.

#### 10.5.1 postgresql.conf

При работе из Arch может прийти ошибка nano (xterm-kitty). Исправить ее можно, задав временно `export TERM=xterm`

Редактируем конфиг.
Открываем:
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```
Находим строку `#listen_addresses = 'localhost'`
Заменяем на `listen_addresses = '*'`

#### 10.5.2 pg_hba.conf

```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```
Добавить правила:
```text
host    nextpath    nextpath_app    0.0.0.0/0    md5
host    nextpath    nextpath_admin  0.0.0.0/0    md5
```
И перезапускаем сервис:
```bash
sudo systemctl restart postgresql
```
Проверяем:
```bash
sudo ss -tulnp | grep 5432
```
Ожидаемый результат `0.0.0.0:5432`.












## 00. Что дальше планируется добавить
Следующие этапы проекта:
- AI-генерация персонализированного роудмапа через Claude API
- валидация форм на фронтенде
- добавление Docker / Docker Compose
- оформление CI/CD


## 11. Backend для формы сайта

Backend-сервис принимает данные onboarding-формы с фронтенда и сохраняет их в PostgreSQL.

### 11.1 Какие frontend-поля сохраняем

В `src/pages/Onboarding.tsx` форма состоит из 5 шагов:

| Шаг сайта | Компонент frontend | Поля payload |
|-----------|--------------------|--------------|
| О вас | `BasicInfoStep` | `fullName`, `age`, `location`, `currentStatus` |
| Образование | `EducationStep` | `education`, `university`, `specialization`, `yearsExperience`, `currentRole`, `cvSummary` |
| Цели | `GoalsStep` | `targetProfession`, `targetIndustry`, `timeline`, `motivation`, `priorities` |
| Навыки | `SkillsStep` | `technicalSkills`, `softSkills`, `languages`, `learningStyle` |
| Ограничения | `ConstraintsStep` | `hoursPerWeek`, `budget`, `healthConsiderations`, `preferOnline`, `preferRussian`, `needMentorship`, `additionalInfo` |

Backend принимает именно эти camelCase-ключи, поэтому на фронтенде можно отправлять `JSON.stringify(formData)` без ручного переименования полей.

### 11.2 Что добавлено в репозиторий

В репозитории появился каталог `backend/`:

- `backend/app/main.py` — FastAPI-приложение с endpoint'ами `/api/health` и `/api/forms`.
- `backend/app/database.py` — подключение SQLAlchemy к PostgreSQL через `DATABASE_URL`.
- `backend/app/models.py` — SQLAlchemy-модель таблицы `user_forms`.
- `backend/app/schemas.py` — Pydantic-схемы, которые валидируют реальные поля формы сайта.
- `backend/sql/001_create_user_forms.sql` — SQL-скрипт для ручного создания таблицы и выдачи прав `nextpath_app`.
- `backend/.env.example` — пример переменных окружения для хоста.
- `backend/tests/test_api.py` — базовые тесты API без подключения к реальной базе.

### 11.3 Таблица для onboarding-формы

Backend пишет данные формы в таблицу `user_forms`.

Ключевые поля таблицы:

```sql
CREATE TABLE IF NOT EXISTS user_forms (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255),
    age INTEGER,
    location VARCHAR(255),
    current_status VARCHAR(100),
    education VARCHAR(255),
    university VARCHAR(255),
    specialization VARCHAR(255),
    years_experience INTEGER,
    current_role VARCHAR(255),
    cv_summary TEXT,
    target_profession VARCHAR(255),
    target_industry VARCHAR(255),
    timeline VARCHAR(100),
    motivation TEXT,
    priorities JSONB NOT NULL DEFAULT '[]'::jsonb,
    technical_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    soft_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    languages JSONB NOT NULL DEFAULT '[]'::jsonb,
    learning_style VARCHAR(255),
    hours_per_week INTEGER,
    budget VARCHAR(255),
    health_considerations TEXT,
    prefer_online BOOLEAN,
    prefer_russian BOOLEAN,
    need_mentorship BOOLEAN,
    additional_info TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Полный SQL лежит в `backend/sql/001_create_user_forms.sql`.

### 11.4 Локальный запуск backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Проверка, что backend запущен:

```bash
curl http://127.0.0.1:8000/api/health
```

Ожидаемый ответ:

```json
{"status":"ok"}
```

### 11.5 Проверка записи формы

```bash
curl -X POST http://127.0.0.1:8000/api/forms \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Test User","age":"21","currentStatus":"student","targetProfession":"Data Scientist","hoursPerWeek":15,"technicalSkills":["Python","SQL"],"languages":[{"name":"English","level":70}]}'
```

Если PostgreSQL доступен и переменная `DATABASE_URL` настроена правильно, backend вернет `id`, сообщение об успешном сохранении и `created_at`.

Проверка в PostgreSQL:

```sql
SELECT id, full_name, target_profession, hours_per_week, created_at
FROM user_forms
ORDER BY id DESC
LIMIT 5;
```

### 11.6 Переменные окружения для production

На сервере нужно задать:

```bash
DATABASE_URL=postgresql://nextpath_app:REAL_PASSWORD@127.0.0.1:5432/nextpath
APP_HOST=127.0.0.1
APP_PORT=8000
FRONTEND_ORIGINS=https://nextpath.su,https://www.nextpath.su
CREATE_TABLES_ON_STARTUP=true
```

Пароль в `DATABASE_URL` нужно заменить на реальный пароль пользователя `nextpath_app`.

### 11.7 Подключение frontend

При нажатии кнопки «Создать карту» на последнем шаге `src/pages/Onboarding.tsx` отправляет данные формы на backend:

```ts
await fetch("/api/forms", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(formData),
});
```

Backend принимает camelCase-ключи напрямую из `FormData`, поэтому дополнительный маппинг на фронтенде не нужен.

### 11.8 Production-запуск backend через systemd

На хосте backend держится отдельным systemd-сервисом — автоматически перезапускается после падения или перезагрузки сервера.

Файл `/etc/systemd/system/nextpath-backend.service`:

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

[Install]
WantedBy=multi-user.target
```

Команды запуска:

```bash
sudo systemctl daemon-reload
sudo systemctl enable nextpath-backend
sudo systemctl start nextpath-backend
sudo systemctl status nextpath-backend
journalctl -u nextpath-backend -f
```

### 11.9 Nginx reverse proxy для API

В конфиг сайта Nginx нужно добавить проксирование API на локальный backend:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

После изменения конфига:

```bash
sudo nginx -t
sudo systemctl reload nginx
curl https://nextpath.su/api/health
```

### 11.10 Важное замечание по PostgreSQL

После появления backend не нужно держать PostgreSQL открытым наружу на `0.0.0.0/0`, если база и backend находятся на одном сервере.

Лучше схема такая:

```text
Пользователь → HTTPS → nginx → FastAPI backend → PostgreSQL localhost
```

То есть PostgreSQL должен быть доступен backend-у через `127.0.0.1:5432`, а внешний порт `5432` лучше закрыть, если он больше не нужен команде для прямого подключения из SQL-клиентов.

## 12. Деплой monorepo на хост

Проект деплоится как monorepo:

```text
project_nis/
├── frontend/
├── backend/
├── scripts/deploy_host.sh
└── docs/DEPLOY_PRODUCTION.md
```

Подробный production-runbook лежит в `docs/DEPLOY_PRODUCTION.md`. Короткая схема:

1. Клонировать repo в `/home/ubuntu/project_nis`.
2. Создать `.env` из `.env.example` с реальным `DATABASE_URL`.
3. Создать systemd-service `nextpath-backend`.
4. Добавить в Nginx reverse proxy `/api/` на `127.0.0.1:8000` и SPA fallback.
5. Запустить `bash scripts/deploy_host.sh`.
6. Проверить `https://nextpath.su/onboarding` и `https://nextpath.su/api/health`.

### 12.1 Первый деплой на хост

```bash
cd /home/ubuntu
git clone https://github.com/d-pascenco/project_nis.git
cd project_nis
cp .env.example .env
nano .env   # прописать DATABASE_URL и остальные переменные
bash scripts/deploy_host.sh
```

### 12.2 Команды диагностики хоста

```bash
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo systemctl status nextpath-backend --no-pager
sudo ss -tulnp | grep -E ':(80|443|5432|8000)\b'
node -v && npm -v && python3 --version
```

### 12.3 Как настроить push с локального repo на production

Есть два варианта:

- проще: пушить в GitHub, а на хосте делать `git pull --ff-only && bash scripts/deploy_host.sh`;
- удобнее: создать bare repo `/home/ubuntu/git/project_nis.git` на хосте и добавить локальный remote `prod`, чтобы `git push prod main` запускал deploy hook.

Подробные команды для обоих вариантов описаны в `docs/DEPLOY_PRODUCTION.md`.

### 12.4 `.env` и Nginx-конфиг

Секреты хранятся в корневом `.env` (игнорируется Git). Файл создаётся из `.env.example`:

```bash
cp .env.example .env
```

Минимальное содержимое:

```env
DATABASE_URL=postgresql://nextpath_app:PASSWORD@127.0.0.1:5432/nextpath
APP_HOST=127.0.0.1
APP_PORT=8000
FRONTEND_ORIGINS=https://nextpath.su,https://www.nextpath.su
CREATE_TABLES_ON_STARTUP=true
```

Nginx-конфиг сайта: `/etc/nginx/sites-enabled/nextpath.su`. В нём SSL от Certbot и SPA fallback. Нужный блок для API:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
}
```

## 14. Подключение фронтенда к бэкенду

### 14.1 Проблема

После реализации backend кнопка «Создать карту» на последнем шаге формы не отправляла никаких данных. В `src/pages/Onboarding.tsx` функция `handleNext()` просто вызывала `setShowRoadmap(true)` без fetch-запроса.

Проверка подтвердила — в задеплоенном JS-бандле строка `api/forms` не встречается:

```bash
grep -c 'api/forms' /var/www/html/assets/*.js
# 0
```

### 14.2 Добавление fetch

В `Onboarding.tsx` добавлена асинхронная функция `submitForm()`, которая отправляет данные формы перед показом роудмапа:

```ts
const submitForm = async () => {
  setIsSubmitting(true);
  try {
    await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
  } catch {
    // не блокируем пользователя при сетевой ошибке
  } finally {
    setIsSubmitting(false);
  }
  setShowRoadmap(true);
};
```

### 14.3 Ошибка 422: пустые строки в числовых полях

После добавления fetch форма стала отправляться, но backend возвращал `422 Unprocessable Entity`. Причина: поля `age` и `yearsExperience` в `FormData` имеют тип `string` и при пустом значении отправляются как `""`. Backend ожидает `int | None`, и Pydantic v2 не может сконвертировать пустую строку в число.

Исправление в `backend/app/schemas.py` — добавлен валидатор:

```python
@field_validator("age", "years_experience", "hours_per_week", mode="before")
@classmethod
def coerce_empty_string_to_none(cls, value: Any) -> Any:
    if value == "" or value is None:
        return None
    return value
```

### 14.4 Диагностика production

Последовательность диагностики при проблемах с API:

```bash
# статус сервиса и логи
sudo systemctl status nextpath-backend --no-pager
journalctl -u nextpath-backend -n 50 --no-pager

# бэкенд слушает порт
sudo ss -tulnp | grep 8000

# health check напрямую и через nginx
curl -s http://127.0.0.1:8000/api/health
curl -s https://nextpath.su/api/health

# изменения попали в сборку
grep -c 'api/forms' /var/www/html/assets/*.js

# данные в базе
psql -h 127.0.0.1 -U nextpath_app -d nextpath -c \
  "SELECT id, full_name, target_profession, created_at FROM user_forms ORDER BY id DESC LIMIT 5;"
```

## 15. Валидация формы на фронтенде

### 15.1 Обязательные поля

Не все поля формы обязательны — только те, без которых нельзя построить роудмап:

| Шаг | Обязательные поля |
|-----|-------------------|
| О вас | Полное имя, Текущий статус |
| Образование | Уровень образования |
| Цели | Желаемая профессия, Срок достижения |
| Навыки | — |
| Ограничения | — |

### 15.2 Реализация

В `Onboarding.tsx` добавлена функция `isCurrentStepValid()`, которая проверяет наличие обязательных полей для текущего шага. При нажатии «Далее» с незаполненными полями переход не происходит, появляется сообщение «Заполните обязательные поля, отмеченные *».

Обязательные поля в шагах помечены `*` красным цветом. Сообщение об ошибке сбрасывается при изменении любого поля или при переходе назад.
