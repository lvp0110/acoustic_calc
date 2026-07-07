#!/bin/bash
# Обновляет nginx-конфиг acoustic-calc из репозитория и делает reload.
# Вызывается из CI: sudo /path/to/repo/deploy/scripts/reload-nginx.sh /path/to/repo
set -euo pipefail

REPO_DIR="${1:?usage: reload-nginx.sh <repo-dir>}"
NGINX_CONF="${REPO_DIR}/deploy/nginx/acoustic-calc.conf"

if [ ! -f "$NGINX_CONF" ]; then
  echo "nginx config not found: $NGINX_CONF" >&2
  exit 1
fi

cp "$NGINX_CONF" /etc/nginx/sites-available/acoustic-calc.conf
ln -sf /etc/nginx/sites-available/acoustic-calc.conf /etc/nginx/sites-enabled/acoustic-calc.conf
nginx -t
systemctl reload nginx

echo "nginx reloaded OK"
