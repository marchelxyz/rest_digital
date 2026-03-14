# Анализ интеграции мини-приложения: MAX, VK, Telegram

> Документ подготовлен по результатам изучения документации платформ и анализа требований Rest Digital.

## 1. Требуемый функционал

| Функция | Приоритет | Описание |
|---------|-----------|----------|
| **Рассылки** | Высокий | Push/уведомления гостям (статус заказа, акции, возврат) |
| **Контакты гостя** | Высокий | Телефон, имя — для оформления заказа и идентификации |
| **Геолокация** | Средний | Автоподстановка адреса доставки |

---

## 2. Сводная матрица возможностей платформ

| Возможность | Telegram | VK | MAX |
|-------------|-----------|-----|-----|
| **Телефон** | `requestContact()` | `getPhoneNumber()` | `requestContact()` |
| **Имя/профиль** | `initData.user` (first_name, last_name, username, photo_url) | initData | `initDataUnsafe.user` |
| **Геолокация** | `LocationManager.getLocation()` (Bot API 8.0+) | `VKWebAppGetGeodata` (есть проблемы с кешем) | Через кнопку `request_geo_location` в чате с ботом |
| **Push/рассылки** | Bot API: sendMessage, sendPhoto и т.д. | VK API + уведомления | Bot API `platform-api.max.ru/messages` |
| **Идентификация** | `user.id` (Telegram) | `user.id` (VK) | `user.id` (MAX) |
| **Хранение данных** | CloudStorage, DeviceStorage, SecureStorage | — | DeviceStorage, SecureStorage |
| **Валидация данных** | HMAC-SHA256 initData | — | HMAC-SHA256 initData |

---

## 3. Детали по каждой платформе

### 3.1. Telegram Mini Apps

**Документация:** [core.telegram.org/bots/webapps](https://core.telegram.org/bots/webapps)

**Подключение:** `<script src="https://telegram.org/js/telegram-web-app.js?61"></script>`

| Метод/объект | Описание |
|--------------|----------|
| `Telegram.WebApp.initDataUnsafe.user` | id, first_name, last_name, username, language_code, photo_url |
| `requestContact(callback)` | Запрос номера телефона в нативном окне |
| `LocationManager.init()` + `getLocation(callback)` | Геолокация (Bot API 8.0+) |
| `CloudStorage` | До 1024 ключей на пользователя |
| `MainButton`, `BackButton` | Управление UI кнопками |
| `themeParams` | Цвета темы (светлая/тёмная) |

**Рассылки:** Через Bot API — бот отправляет сообщения в чат с пользователем. Поддержка push-уведомлений встроена в мессенджер.

**Особенности:**
- Поддержка платежей (openInvoice, Telegram Stars)
- shareToStory — шеринг в сторис
- Fullscreen mode, addToHomeScreen
- Отличная документация и стабильность API

---

### 3.2. VK Mini Apps

**Документация:** [dev.vk.com/ru/mini-apps/overview](https://dev.vk.com/ru/mini-apps/overview)

**Подключение:** VK Bridge, VKUI, VK Mini Apps Deploy

| Метод | Описание |
|-------|----------|
| `VKWebAppGetPhoneNumber` | Запрос номера телефона |
| `VKWebAppGetGeodata` | Геолокация *(есть баги с кешем на Android)* |
| `VKWebAppGetEmail` | Запрос email |
| `VKWebAppOpenContacts` | Открытие контактов |

**Рассылки:** VK API для отправки сообщений; размещение в каталоге даёт до 10 000 уникальных пользователей.

**Особенности:**
- Работа в мобильном приложении, m.vk.com и vk.com
- VK Pay для платежей
- Каталог мини-приложений, фичеринг
- Социальные механики (публикация в сторис, вступление в сообщество)

**Важно:** VKWebAppGetGeodata может возвращать устаревшие координаты — рекомендуется fallback на `navigator.geolocation` при необходимости.

---

### 3.3. MAX Mini Apps

**Документация:** [dev.max.ru/docs/webapps](https://dev.max.ru/docs/webapps), [dev.max.ru/help/miniapps](https://dev.max.ru/help/miniapps)

**Подключение:** `<script src="https://web.max.ru/max-web-app.js"></script>` → `window.WebApp`

| Метод/объект | Описание |
|--------------|----------|
| `WebApp.requestContact()` | Запрос телефона (нативный диалог) |
| `WebApp.initDataUnsafe.user` | id, first_name, last_name, username, language_code, photo_url |
| `DeviceStorage`, `SecureStorage` | Локальное и защищённое хранилище |
| `BiometricManager` | Биометрия для авторизации |

**Геолокация:** В MAX Bridge нет прямого `requestLocation`. Гео доступно через:
- Кнопку клавиатуры бота `request_geo_location` → пользователь отправляет локацию в чат → бот получает через Webhook/Long Polling → передаёт в мини-приложение через start_param или API.

**Рассылки:** Bot API `platform-api.max.ru` — `POST /messages` для отправки сообщений. Лимит 30 rps.

**Особенности:**
- Работает только с чат-ботом (обязательно)
- Диплинки: `https://max.ru/BotName?startapp=promo_summer2025`
- shareContent(), shareMaxContent() — шеринг
- openCodeReader() — QR-код
- HapticFeedback, BackButton

---

## 4. Рекомендуемая архитектура

### 4.1. Унифицированный слой (Bridge Adapter)

Создать абстракцию `lib/mini-apps/bridge.ts`:

```typescript
export type MiniAppPlatform = 'telegram' | 'vk' | 'max' | 'standalone';

export type GuestProfile = {
  platform: MiniAppPlatform;
  platformUserId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  photoUrl?: string;
};

export type BridgeCapabilities = {
  requestContact: boolean;
  getProfile: boolean;
  getLocation: boolean;
  cloudStorage: boolean;
};

export interface MiniAppBridge {
  platform: MiniAppPlatform;
  isAvailable(): boolean;
  getProfile(): GuestProfile | null;
  getCapabilities(): BridgeCapabilities;
  requestContact(): Promise<{ phone: string } | null>;
  requestLocation(): Promise<{ latitude: number; longitude: number } | null>;
  ready(): void;
}
```

### 4.2. Маппинг гостя на Customer

В `Customer` нужно хранить:
- `platform` — telegram | vk | max
- `platformUserId` — id пользователя в платформе
- `phone` — основной идентификатор (уже есть)
- `name` — из профиля или после requestContact

Рекомендуется добавить поля в schema.prisma:
```prisma
model Customer {
  // ...
  platform        String?  // "telegram" | "vk" | "max"
  platformUserId  String?  // внешний id для дедупликации
  @@unique([tenantId, platform, platformUserId])  // опционально
}
```

### 4.3. Рассылки

| Платформа | Как отправлять |
|-----------|----------------|
| **Telegram** | Bot API `sendMessage(chat_id: user.id)` |
| **VK** | VK API `messages.send(user_id)` |
| **MAX** | `POST platform-api.max.ru/messages` с `chat_id` |

Нужно хранить `platform` и `platformUserId`/`chatId` у Customer, чтобы знать, куда отправлять уведомления.

---

## 5. Дополнительные возможности, полезные для Rest Digital

| Возможность | Telegram | VK | MAX | Применение |
|-------------|----------|-----|-----|------------|
| **CloudStorage / DeviceStorage** | ✓ | — | ✓ | Сохранение корзины, адресов, настроек между сессиями |
| **SecureStorage** | ✓ | — | ✓ | Хранение токенов авторизации |
| **Шеринг (рефералка)** | ✓ shareToStory | ✓ | ✓ shareContent | «Пригласи друга» — виральность |
| **QR-сканер** | showScanQrPopup | — | openCodeReader | Сканирование бонусной карты, оплата |
| **Тема (светлая/тёмная)** | themeParams | — | — | Авто-подстройка под настройки пользователя |
| **HapticFeedback** | ✓ | — | ✓ | Тактильный отклик при добавлении в корзину |
| **BackButton** | ✓ | ✓ | ✓ | Навигация «назад» в шапке |
| **MainButton** | ✓ | — | — | Кнопка «Оформить заказ» внизу экрана |
| **Платежи** | openInvoice, Stars | VK Pay | — | Онлайн-оплата заказа |
| **Добавить на главный экран** | addToHomeScreen | — | — | PWA-подобное поведение в Telegram |
| **Геолокация** | LocationManager | GetGeodata* | через бота | Автоадрес доставки |

\* VK GetGeodata — осторожно, возможны проблемы с актуальностью данных.

---

## 6. План внедрения (этапы)

### Этап 1 — Обнаружение платформы и профиль
1. Детектировать платформу по `window.Telegram?.WebApp`, `window.VK`, `window.WebApp` (MAX).
2. Парсить initData и показывать имя/аватар в ClientProfileTab.
3. Валидировать initData на бэкенде (HMAC-SHA256) при первом заказе.

### Этап 2 — Контакты
1. Добавить кнопку «Заполнить из мессенджера» в CartDrawer.
2. Вызывать `requestContact` и подставлять телефон + имя в форму.
3. При создании заказа сохранять `platform`, `platformUserId` в Customer.

### Этап 3 — Геолокация
1. Telegram: использовать LocationManager.
2. VK: использовать GetGeodata с fallback на navigator.geolocation.
3. MAX: показать подсказку «Отправьте геолокацию боту» или реализовать передачу через start_param.

### Этап 4 — Рассылки
1. API-эндпоинт для ресторана: «Отправить уведомление гостю».
2. В зависимости от Customer.platform вызывать соответствующий Bot API.
3. Хранить токены ботов (Telegram, VK, MAX) в TenantSettings.

---

## 7. Ссылки на документацию

- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [VK Mini Apps — Обзор](https://dev.vk.com/ru/mini-apps/overview)
- [VK Bridge](https://dev.vk.com/bridge)
- [MAX — Мини-приложения](https://dev.max.ru/help/miniapps)
- [MAX Bridge](https://dev.max.ru/docs/webapps/bridge)
- [MAX API](https://dev.max.ru/docs-api)
