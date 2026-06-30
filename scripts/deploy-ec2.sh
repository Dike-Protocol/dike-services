#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/dike-services}"
APP_NAME="${APP_NAME:-dike-services}"
IMAGE_NAME="${IMAGE_NAME:-dike-services}"

cd "$APP_DIR"

git fetch --prune origin
git checkout main
git pull --ff-only origin main

docker build -t "$IMAGE_NAME" .

if docker ps -a --format '{{.Names}}' | grep -Fxq "$APP_NAME"; then
  docker stop "$APP_NAME" >/dev/null || true
  docker rm "$APP_NAME" >/dev/null || true
fi

docker run -d \
  --name "$APP_NAME" \
  --restart unless-stopped \
  --env-file "$APP_DIR/.env" \
  -p 4000:4000 \
  "$IMAGE_NAME"

sleep 5
curl --fail --silent --show-error http://127.0.0.1:4000/health >/dev/null

docker image prune -f >/dev/null
