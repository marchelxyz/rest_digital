# Скрипт миграции БД для Railway / CI (Windows)
$ErrorActionPreference = "Stop"
Write-Host "Running database migrations..."
npx prisma migrate deploy
Write-Host "Migrations completed."
