#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/packages/database
npx prisma migrate deploy --config ./dist/prisma.config.js

echo "Starting application..."
cd /app/apps/backend
exec node dist/main.js
