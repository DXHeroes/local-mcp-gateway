#!/bin/sh
set -e

echo "Running database migrations..."
MAX_RETRIES=15
RETRY_INTERVAL=2
cd /app/packages/database
for i in $(seq 1 $MAX_RETRIES); do
  if pnpm exec prisma migrate deploy --config ./dist/prisma.config.js; then
    echo "Migrations applied successfully."
    break
  fi
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "Failed to apply migrations after $MAX_RETRIES attempts."
    exit 1
  fi
  echo "Retrying in ${RETRY_INTERVAL}s... (attempt $i/$MAX_RETRIES)"
  sleep $RETRY_INTERVAL
done

echo "Starting application..."
cd /app/apps/backend
exec node dist/main.js
