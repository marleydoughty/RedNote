#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/backend/server/.env"
SCHEMA_FILE="$ROOT_DIR/backend/database/schema.sql"
DATA_FILE="$ROOT_DIR/backend/database/data.sql"

if [ ! -f "$ENV_FILE" ]; then
  echo "no .env file found at $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set in $ENV_FILE"
  exit 1
fi

psql "$DATABASE_URL" -f "$SCHEMA_FILE"
psql "$DATABASE_URL" -f "$DATA_FILE"

echo "Database import complete."