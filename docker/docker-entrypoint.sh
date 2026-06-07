#!/bin/sh
set -e

# Run database migrations before starting the app.
# This ensures the schema is always up-to-date on container start
# without any manual intervention — works for first run and upgrades.
echo "[entrypoint] Running migrations..."
node /app/docker-migrate.mjs

echo "[entrypoint] Starting Plani..."
exec node apps/web/server.js
