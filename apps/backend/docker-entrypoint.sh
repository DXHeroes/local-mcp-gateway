#!/bin/sh
set -e

echo "Pushing database schema..."
cd /app/packages/database
npx prisma db push --skip-generate --config ./dist/prisma.config.js

echo "Starting application..."
cd /app/apps/backend
exec node dist/main.js
