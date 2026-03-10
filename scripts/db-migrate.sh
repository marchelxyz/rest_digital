#!/usr/bin/env bash
# Скрипт миграции БД для Railway / CI
# Запускается перед стартом приложения (preDeployCommand)

set -e
echo "Running database migrations..."
npx prisma migrate deploy
echo "Migrations completed."
