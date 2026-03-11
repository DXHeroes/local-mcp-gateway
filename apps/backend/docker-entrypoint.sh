#!/bin/sh
set -e

echo "Pushing database schema..."
cd /app/packages/database
pnpm exec prisma db push --config ./dist/prisma.config.js

echo "Starting application..."
cd /app/apps/backend
exec node dist/main.js
