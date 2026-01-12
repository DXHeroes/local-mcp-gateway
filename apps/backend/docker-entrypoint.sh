#!/bin/sh
set -e

# Apply pending database migrations (production-safe)
echo "Running database migrations..."
cd /app/packages/database
npx prisma migrate deploy

# Start the application
echo "Starting application..."
cd /app/apps/backend
exec node dist/main.js
