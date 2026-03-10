# Деплой Rest Digital на Railway

## 1. Подготовка

| Переменная | Обязательно | Описание |
|------------|-------------|----------|
| `DATABASE_URL` | Да | Railway добавляет автоматически при подключении PostgreSQL |
| `SUPERADMIN_EMAIL` | Нет | Email суперадмина (по умолчанию: admin@rest.digital) |
| `SUPERADMIN_PASSWORD` | Нет | Пароль суперадмина (по умолчанию: admin123) |
| `OPENAI_API_KEY` | Нет | Для AI-модуля (генерация текстов, анализ отзывов) |
| `YANDEX_S3_BUCKET` | Нет | Бакет Yandex Object Storage для логотипов, обложек, картинок |
| `YANDEX_S3_ACCESS_KEY_ID` | Нет | Access Key ID (Сервисный аккаунт) |
| `YANDEX_S3_SECRET_ACCESS_KEY` | Нет | Secret Access Key |
| `YANDEX_S3_REGION` | Нет | Регион (по умолчанию ru-central1) |
| `YANDEX_S3_ENDPOINT` | Нет | Endpoint (по умолчанию https://storage.yandexcloud.net) |
| `YANDEX_S3_PUBLIC_URL` | Нет | Публичный URL бакета для готовых ссылок на файлы |

Логин и пароль Superadmin задаются в переменных Railway и применяются при `db:seed` (выполняется перед каждым деплоем).
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
| `npm run db:seed` | Создать Superadmin + demo tenant (читает SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD) |

## 5. Health Check

Railway использует `/api/health` для проверки работоспособности.
