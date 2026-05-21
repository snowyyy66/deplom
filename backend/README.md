# Look Restaurant — Backend API

REST API ресторана Look на базе **NestJS 11** + **Prisma 5**. Написан на чистом **JavaScript** (без TypeScript), компилируется через **SWC**. Все эндпоинты доступны по префиксу `/api`.

---

## Стек

| Библиотека | Назначение |
|---|---|
| NestJS 11 | Фреймворк (модули, DI, guards, pipes) |
| SWC | Быстрый компилятор JS (заменяет tsc) |
| Prisma 5 | ORM, две схемы: PostgreSQL и SQLite |
| PostgreSQL | БД для Docker/prod |
| SQLite | БД для локальной разработки (`prisma/dev.db`) |
| bcryptjs | Хеширование паролей |
| jsonwebtoken | JWT для аутентификации |
| nodemailer | Отправка email (восстановление пароля + подтверждение заказа) |
| @nestjs/throttler | Rate limiting на чувствительных эндпоинтах |
| class-validator | Валидация входящих данных |
| @nestjs/swagger | Автоматическая Swagger-документация |

---

## Установка и запуск

```bash
cd backend
npm install
```

### Файл окружения `backend/.env`

```env
# SQLite (для разработки)
DATABASE_URL=file:./prisma/dev.db

# PostgreSQL (для Docker)
# DATABASE_URL=postgresql://postgres:postgres@postgres:5432/look?schema=public

# JWT и админка
JWT_SECRET=look-jwt-secret-dev
ADMIN_PASSWORD=look-admin-2024

# CORS и порт
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Gmail SMTP (для писем; не обязательно для базовой работы)
GMAIL_ADDRESS=your@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
```

### База данных

```bash
npm run db:push   # применить SQLite-схему (schema.sqlite.prisma)
npm run db:seed   # заполнить меню (18 блюд) + базовые промокоды
```

### Запуск

```bash
npm run start:dev   # dev-режим с hot reload (порт 8000)
npm run build       # компиляция JS → dist/ через SWC
npm run start:prod  # запуск скомпилированного dist/main.js
```

### Миграция SQLite → PostgreSQL

Если уже работали локально и хотите перенести данные в Docker-PostgreSQL:

```bash
# (после docker compose up с открытым портом 5432:5432)
node scripts/migrate-to-pg.js
```

Скрипт читает `prisma/dev.db` и переносит users / orders / reservations / reviews / promo_codes / contact_messages.

---

## Структура проекта

```
backend/
├── src/
│   ├── main.js                  # Точка входа (CORS, Swagger, ValidationPipe)
│   ├── app.module.js            # Корневой модуль + Throttler + global guards
│   ├── common/
│   │   ├── admin.guard.js       # Guard на admin-эндпоинты (JWT с role=admin)
│   │   ├── jwt-auth.guard.js    # Global JWT guard (с @Public для исключений)
│   │   ├── jwt.utils.js         # signToken / verifyToken
│   │   ├── public.decorator.js  # @Public() — пропуск JWT-проверки
│   │   ├── mailer.service.js    # Nodemailer (Gmail SMTP 465/SSL)
│   │   ├── db.utils.js          # ilike() — совместимость SQLite/Postgres
│   │   └── http-exception.filter.js
│   ├── config/
│   │   └── constants.js         # MAX_TABLES, MIN_RUNNER_SCORE
│   ├── prisma/
│   │   ├── prisma.module.js
│   │   └── prisma.service.js
│   └── modules/
│       ├── auth/                # Регистрация, логин, JWT, сброс пароля
│       ├── menu/                # Меню (публичный GET)
│       ├── orders/              # Заказы + валидация промокодов + email
│       ├── reservations/        # Бронирования
│       ├── reviews/             # Отзывы
│       ├── promos/              # promo-status, promo/lookup, easter egg, runner
│       ├── contact/             # Форма обратной связи
│       └── admin/               # Admin-эндпоинты (JWT с ролью admin)
├── prisma/
│   ├── schema.prisma            # PostgreSQL (Docker / prod)
│   ├── schema.sqlite.prisma     # SQLite (локальная разработка)
│   ├── seed.js                  # Заполнение меню + промокодов
│   └── dev.db                   # SQLite-база для dev (не в git)
├── scripts/
│   └── migrate-to-pg.js         # Перенос данных SQLite → PostgreSQL
├── Dockerfile                   # node:20-alpine + Prisma + Nest build
├── .swcrc                       # Конфиг SWC-компилятора
└── .env                         # Переменные окружения (не в git)
```

---

## Почему JavaScript, а не TypeScript

- Нет оверхеда от компиляции tsc
- SWC компилирует в ~10× быстрее
- NestJS-декораторы работают полностью через явные `@Inject(Token)` — DI не теряется
- Меньше конфигов, меньше зависимостей

---

## API-эндпоинты

### Аутентификация

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/register` | Регистрация: `{ name, email, phone, password }` → `{ user, token }` |
| POST | `/api/login` | Вход: `{ email, password }` → `{ user, token }` |
| POST | `/api/forgot-password` | Запрос кода сброса: `{ email }` (email уходит в фоне) |
| POST | `/api/reset-password` | Сброс пароля: `{ email, code, new_password }` |
| PATCH | `/api/profile` | Обновление профиля (JWT обязателен) |

### Меню

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/menu` | Список всех блюд (публичный) |

### Заказы

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/orders` | Создать заказ (валидация промокода на сервере, email-подтверждение) |
| GET | `/api/orders/user/:id` | Заказы конкретного пользователя (JWT) |

### Бронирования

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/reservations` | Создать бронирование |
| GET | `/api/reservations/user/:id` | Брони пользователя (JWT) |
| GET | `/api/reservations/availability` | Занятые столики: `?date=YYYY-MM-DD&time=HH:mm` |
| PATCH | `/api/reservations/:id/cancel` | Отмена бронирования |

### Отзывы

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/reviews` | Все отзывы (публичный) |
| POST | `/api/reviews` | Добавить отзыв |
| GET | `/api/reviews/user/:id` | Отзывы пользователя |

### Промокоды и игра

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/promo-status?email=…` | Статус системных промокодов для пользователя |
| GET | `/api/promo/lookup?code=…` | Проверка произвольного промокода (для кастомных из админки) |
| POST | `/api/user/runner-reward` | Разблокировать LOOKRUN: `{ score }` (score ≥ 2500) |
| POST | `/api/user/found-easter-egg` | Отметить находку пасхалки |

### Контакт

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/contact` | Отправить сообщение: `{ name, contact, message }` |

---

## Admin-эндпоинты

Авторизация по JWT с `role=admin` (получается через `POST /api/admin/login` с паролем из `ADMIN_PASSWORD`).

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/admin/login` | Вход в админку: `{ password }` → `{ token }` (TTL 8ч) |
| GET / POST / PATCH / DELETE | `/api/admin/menu[/:id]` | CRUD блюд |
| GET | `/api/admin/menu/export-csv` | Экспорт меню в CSV |
| GET | `/api/admin/orders` | Все заказы |
| PATCH | `/api/admin/orders/:id/status` | Сменить статус |
| GET | `/api/admin/reservations` | Все бронирования |
| PATCH | `/api/admin/reservations/:id/status` | Сменить статус брони |
| GET / DELETE | `/api/admin/reviews[/:id]` | Список и удаление отзывов |
| GET | `/api/admin/messages` | Сообщения из формы обратной связи |
| GET / POST / PATCH / DELETE | `/api/admin/promos[/:id]` | CRUD промокодов |

---

## Промокоды

### Системные (зашиты в логику)

| Код | Скидка | Условие |
|---|---|---|
| `LOOK20` | −20% | Только первый заказ |
| `LOOK15` | −15% | После находки пасхалки в интерфейсе |
| `LOOKRUN` | −10% | После 2500 очков в мини-игре «Спринт шефа» |

### Кастомные

Создаются через админку (`POST /api/admin/promos`). Поля:
- `code` (uppercase, уникален), `discount` (1–100)
- `description?`, `isActive` (по умолчанию `true`)
- `validFrom?`, `validUntil?`, `usageLimit?`

Проверяются через `GET /api/promo/lookup?code=...`, применяются автоматически на сервере при создании заказа.

---

## Безопасность

- **Throttler**: 5 register / 10 login / 3 forgot-password / 5 reset-password / 5 admin-login запросов в минуту
- **JWT** — глобальный guard (с `@Public()` для исключений)
- **Validation pipe** — `whitelist + transform`, отсечение лишних полей
- **bcrypt** — все пароли и одноразовые коды восстановления
- **CORS** — белый список из `ALLOWED_ORIGINS`

---

## Запуск тестов

```bash
npm run test        # unit-тесты (Jest + @swc/jest)
npm run test:watch  # watch-режим
npm run test:cov    # покрытие кода
```
