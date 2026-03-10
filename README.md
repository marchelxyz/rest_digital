# Rest Digital

SaaS-платформа для небольших заведений общепита (кафе, рестораны). Мультиарендная архитектура с тремя уровнями доступа:

1. **Клиентское мини-приложение** — меню, доставка, лояльность, геймификация
2. **Кабинет ресторана** — управление заказами, меню, CRM, AI-рассылки
3. **Главный админ-кабинет** — управление тенантами, конструктор приложений, интеграции

## Стек

- Next.js (App Router), React, TypeScript, Tailwind CSS, Zustand
- PostgreSQL + Prisma ORM
- Деплой: Railway

## Быстрый старт

```bash
npm install
cp .env.example .env   # настроить DATABASE_URL
npm run db:migrate     # применить миграции
npm run db:seed        # создать admin + demo tenant
npm run dev
```

**Тестовые аккаунты (после db:seed):**
- Superadmin: `admin@rest.digital` / `admin123`
- Ресторан: заведение «Демо-кафе», `manager@demo.local` / `manager123`

## Документация

- [Деплой на Railway](DEPLOY.md)
