#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/dike-services}"
APP_NAME="${APP_NAME:-dike-services}"
IMAGE_NAME="${IMAGE_NAME:-dike-services}"
NEXT_NAME="${APP_NAME}-candidate"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1:4000/health}"

cd "$APP_DIR"

git fetch --prune origin
git checkout main
git pull --ff-only origin main

docker build -t "$IMAGE_NAME" .

docker rm -f "$NEXT_NAME" >/dev/null 2>&1 || true

docker run -d \
  --name "$NEXT_NAME" \
  --env-file "$APP_DIR/.env" \
  -p 4001:4000 \
  "$IMAGE_NAME"

for attempt in $(seq 1 30); do
  if curl --fail --silent --show-error http://127.0.0.1:4001/health >/dev/null; then
    docker rm -f "$APP_NAME" >/dev/null 2>&1 || true
    docker rm -f "$NEXT_NAME" >/dev/null 2>&1 || true
    docker run -d \
      --name "$APP_NAME" \
      --restart unless-stopped \
      --env-file "$APP_DIR/.env" \
      -p 4000:4000 \
      "$IMAGE_NAME"
    docker container prune -f >/dev/null
    docker image prune -f >/dev/null
    for post_attempt in $(seq 1 15); do
      if curl --fail --silent --show-error "$HEALTHCHECK_URL" >/dev/null; then
        exit 0
      fi
      sleep 2
    done
    echo "Switchover completed but primary health endpoint did not recover."
    docker logs --tail=200 "$APP_NAME" || true
    exit 1
  fi

  if ! docker ps --format '{{.Names}}' | grep -Fxq "$NEXT_NAME"; then
    echo "Candidate container exited before becoming healthy."
    docker logs --tail=200 "$NEXT_NAME" || true
    exit 1
  fi

  sleep 2
done

echo "Candidate container did not become healthy in time."
docker logs --tail=200 "$NEXT_NAME" || true
docker rm -f "$NEXT_NAME" >/dev/null 2>&1 || true
exit 1
