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

### 1.3 Выбор образа OS
Из доступных образов был выбран обычный Ubuntu-образ:
- `Canonical Ubuntu 24.04`

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

В дальнейшем на хосте открыть нужные порты можно через следюущие команды: 

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
Permissions 0644 for '/home/pd/Downloads/ssh-key-2026-04-12.key' are too open.
This private key will be ignored.
Load key "/home/pd/Downloads/ssh-key-2026-04-12.key": bad permissions
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
https://github.com/d-pascenco/nextpath-ai-navigator.git

### 7.1 Переходим в домашнюю папку и клонируем проект из репозитория:
```bash
cd ~
git clone https://github.com/d-pascenco/nextpath-ai-navigator.git
```
Гит попросит логин и токен.

Проект сайта находится в следующей директории:

```
/home/ubuntu/nextpath-ai-navigator
```

### 7.2 Заходим в скаченеую папку, устанавливаем зависимости (библиотеки из [package.json](https://github.com/d-pascenco/nextpath-ai-navigator/blob/main/package.json)) в node_modules)

```bash
cd nextpath-ai-navigator
npm i
npm run build
```
Возможно еще понадобятся команды:
`npm run dev` - Start the development server with auto-reloading and an instant preview.

### 7.3 После установки Nginx настроен на /var/www/html (дефолтная конфигурация nginx).
Поэтому при выкатке обновлений на сайт нужно будет длеать следующее:

```bash
cd ~/app
git pull
npm install      # если обновились зависимости
npm run build
```

Деплой:

```bash
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo systemctl reload nginx
```

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

Замените root в server { ... } на путь к твоему сайту:

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

## 10. Что дальше планируется добавить

Следующие этапы проекта:

- подключение базы данных
- реализация backend
- подключение backend к frontend
- настройка production-конфигурации nginx
- настройка HTTPS
- автоматизация деплоя
- добавление Docker / Docker Compose
- оформление CI/CD
