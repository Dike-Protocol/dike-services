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

for attempt in $(seq 1 30); do
  if curl --fail --silent --show-error http://127.0.0.1:4000/health >/dev/null; then
    docker image prune -f >/dev/null
    exit 0
  fi

  if ! docker ps --format '{{.Names}}' | grep -Fxq "$APP_NAME"; then
    echo "Container exited before becoming healthy."
    docker logs --tail=200 "$APP_NAME" || true
    exit 1
  fi

  sleep 2
done

echo "Container did not become healthy in time."
docker logs --tail=200 "$APP_NAME" || true
exit 1
