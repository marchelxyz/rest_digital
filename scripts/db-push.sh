#!/usr/bin/env bash
# Разовое создание/обновление таблиц (dev/prototyping)
# Использует prisma db push — не создаёт файлы миграций

set -e
echo "Pushing schema to database..."
npx prisma db push
npx prisma generate
echo "Database schema updated."
