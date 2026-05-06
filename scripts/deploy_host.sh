#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BACKEND_DIR="${BACKEND_DIR:-$APP_DIR/backend}"
WEB_ROOT="${WEB_ROOT:-/var/www/html}"
SERVICE_NAME="${SERVICE_NAME:-nextpath-backend}"
PYTHON_BIN="${PYTHON_BIN:-python3}"

if [ -d "$APP_DIR/frontend" ]; then
  FRONTEND_DIR="${FRONTEND_DIR:-$APP_DIR/frontend}"
elif [ -f "$APP_DIR/package.json" ]; then
  FRONTEND_DIR="${FRONTEND_DIR:-$APP_DIR}"
else
  echo "ERROR: frontend directory was not found. Expected $APP_DIR/frontend or package.json in repo root." >&2
  exit 1
fi

cd "$FRONTEND_DIR"

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

npm run build

if [ ! -d "$FRONTEND_DIR/dist" ]; then
  echo "ERROR: frontend build directory '$FRONTEND_DIR/dist' was not created." >&2
  exit 1
fi

sudo mkdir -p "$WEB_ROOT"
sudo rm -rf "$WEB_ROOT"/*
sudo cp -r "$FRONTEND_DIR/dist"/* "$WEB_ROOT"/
sudo chown -R www-data:www-data "$WEB_ROOT"

cd "$BACKEND_DIR"
$PYTHON_BIN -m venv venv
# shellcheck disable=SC1091
source "$BACKEND_DIR/venv/bin/activate"
pip install --upgrade pip
pip install -r requirements.txt

if [ -f "$BACKEND_DIR/.env" ] && command -v psql >/dev/null 2>&1; then
  set -a
  # shellcheck disable=SC1091
  source "$BACKEND_DIR/.env"
  set +a
  if [ -n "${DATABASE_URL:-}" ] && [ -f "$BACKEND_DIR/sql/001_create_user_forms.sql" ]; then
    psql "$DATABASE_URL" -f "$BACKEND_DIR/sql/001_create_user_forms.sql" || true
  fi
else
  echo "WARN: $BACKEND_DIR/.env or psql not found; skipping SQL migration."
fi

if systemctl list-unit-files | grep -q "^$SERVICE_NAME.service"; then
  sudo systemctl restart "$SERVICE_NAME"
else
  echo "WARN: systemd service '$SERVICE_NAME' is not installed yet; create it from docs/DEPLOY_PRODUCTION.md."
fi

sudo nginx -t
sudo systemctl reload nginx

echo "Deploy finished. Web root: $WEB_ROOT"
