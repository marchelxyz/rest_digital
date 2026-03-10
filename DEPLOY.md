# Деплой Rest Digital на Railway

## 1. Подготовка

- Убедитесь, что `DATABASE_URL` настроен (Railway добавляет его автоматически при добавлении PostgreSQL).
- Все скрипты готовы к автодеплою.

## 2. Развёртывание на Railway

### Вариант A: Через GitHub

1. Подключите репозиторий к Railway: [railway.app](https://railway.app) → New Project → Deploy from GitHub.
2. Выберите репозиторий `rest_digital`.
3. Добавьте сервис PostgreSQL: New → Database → PostgreSQL.
4. Railway подставит `DATABASE_URL` в переменные окружения приложения.
5. При каждом push в `main` будет выполняться:
   - `npm run build` (включает `prisma generate`)
   - `npm run db:migrate` (preDeployCommand)
   - `npm run start`

### Вариант B: Через Railway CLI

```bash
npm i -g @railway/cli
railway login
railway init
railway add --database postgres
railway up
```

## 3. Миграции БД

Миграции применяются автоматически перед каждым деплоем (`preDeployCommand` в `railway.json`).

Для ручного запуска:

```bash
npm run db:migrate
```

Для создания новой миграции (локально, с подключённой БД):

```bash
npm run db:migrate:dev -- --name add_feature_xyz
```

## 4. Скрипты

| Скрипт | Описание |
|--------|----------|
| `npm run db:generate` | Генерация Prisma Client |
| `npm run db:migrate` | Применение миграций (deploy) |
| `npm run db:migrate:dev` | Создание и применение миграции (dev) |
| `npm run db:push` | Синхронизация схемы без миграций (prototyping) |
| `npm run db:studio` | Открыть Prisma Studio |

## 5. Health Check

Railway использует `/api/health` для проверки работоспособности.
