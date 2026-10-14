# Look Restaurant — Fullstack Web App

Веб-приложение премиального ресторана **Look**: клиентская часть на React, REST API на NestJS, база данных через Prisma ORM. Поддерживает запуск как локально (SQLite), так и через Docker (PostgreSQL).

---

## Содержание

- [Стек технологий](#стек-технологий)
- [Что нужно установить](#что-нужно-установить-один-раз)
- [Установка проекта](#установка-проекта)
- [Запуск через Docker](#запуск-через-docker-самый-простой-способ)
- [Локальный запуск без Docker](#локальный-запуск-без-docker)
- [Переменные окружения](#переменные-окружения)
- [Структура репозитория](#структура-репозитория)
- [Доступные адреса](#доступные-адреса)
- [Полезные команды](#полезные-команды)
- [Промокоды](#промокоды)
- [API — основные эндпоинты](#api--основные-эндпоинты)

---

## Стек технологий

| Часть | Технологии |
|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS, Framer Motion, Radix UI |
| **Backend** | NestJS 11, JavaScript (без TypeScript), SWC, Prisma 5 |
| **БД (dev)** | SQLite (`backend/prisma/dev.db`) |
| **БД (prod)** | PostgreSQL 16 (Docker) |
| **Инфраструктура** | Docker Compose (postgres + api + web) |

---

## Что нужно установить (один раз)

| Инструмент | Зачем | Ссылка |
|---|---|---|
| **Git** | Клонирование репозитория | https://git-scm.com/downloads |
| **Node.js 20+ LTS** | Запуск backend и frontend | https://nodejs.org/ |
| **Docker Desktop** | Запуск через `docker compose` (опционально) | https://www.docker.com/products/docker-desktop |

Проверь что всё установлено:

```bash
git --version       # git version 2.x.x
node --version      # v20.x.x или выше
npm --version       # 10.x.x или выше
docker --version    # Docker version 24+
```

---

## Установка проекта

### 1. Клонировать репозиторий

```bash
git clone <URL_РЕПОЗИТОРИЯ>
cd deplom
```

### 2. Скопировать файлы окружения

```bash
# Linux / macOS / Git Bash
cp .env.example .env
cp backend/.env.example backend/.env

# Windows PowerShell
copy .env.example .env
copy backend\.env.example backend\.env
```

### 3. (Опционально) Заполнить креды Gmail

Открой `.env` и `backend/.env` и впиши свой Gmail и App Password, если хочешь чтобы работали:
- письма с кодом восстановления пароля;
- письма с подтверждением заказа.

Без них приложение работает нормально, просто почта не уходит. Как получить App Password — смотри [инструкцию Google](https://support.google.com/accounts/answer/185833).

---

## Запуск через Docker (самый простой способ)

В корне проекта:

```bash
docker compose up --build
```

Эта команда:
1. Скачает образ PostgreSQL 16
2. Соберёт образы backend (NestJS) и frontend (React+Vite)
3. Запустит все 3 контейнера
4. Backend сам применит схему БД (`prisma db push`) и засеет меню + базовые промокоды

После запуска открой в браузере: **http://localhost:5173**

### Запуск в фоне

```bash
docker compose up --build -d   # -d = detached, без логов в терминале
docker compose logs -f         # посмотреть логи
docker compose down            # остановить всё
```

### Пересборка после изменений в коде

```bash
docker compose up --build
```

Если меняешь только frontend код — он перезагружается автоматически (Vite HMR). Backend (NestJS) тоже работает с watch-режимом.

---

## Локальный запуск без Docker

### 1. Установить зависимости

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

> При первой установке backend может ругнуться на `better-sqlite3` — это нормально, он не обязателен (нужен только для скрипта миграции SQLite → PostgreSQL).

### 2. Создать БД и заполнить меню

```bash
cd backend
npm run db:push    # создаёт таблицы из schema.sqlite.prisma → backend/prisma/dev.db
npm run db:seed    # заполняет 18 блюд + базовые промокоды LOOK20/LOOK15/LOOKRUN
```

### 3. Запустить два терминала

**Терминал 1 — Backend (порт 8000):**
```bash
cd backend
npm run start:dev   # NestJS с hot reload
```

**Терминал 2 — Frontend (порт 5173):**
```bash
cd frontend
npm run dev         # Vite dev-сервер с HMR
```

Открой **http://localhost:5173**.

### Альтернатива: одной командой через `concurrently`

В корне проекта:

```bash
npm install         # ставит concurrently
npm run dev         # запускает backend и frontend параллельно
```

---

## Переменные окружения

### `backend/.env` (для локальной разработки)

```env
DATABASE_URL=file:./dev.db
JWT_SECRET=change_me_to_a_random_secret
ADMIN_PASSWORD=admin123
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

GMAIL_ADDRESS=your@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
```

### `.env` в корне (для `docker compose`)

```env
GMAIL_ADDRESS=your@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
JWT_SECRET=change_me_to_a_random_secret
ADMIN_PASSWORD=admin123
```

### Объяснение полей

| Переменная | Описание |
|---|---|
| `DATABASE_URL` | Строка подключения. Локально — `file:./dev.db`, в Docker — `postgresql://...` (выставляется автоматически в docker-compose) |
| `JWT_SECRET` | Любая случайная строка, используется для подписи JWT-токенов |
| `ADMIN_PASSWORD` | Пароль входа в `/admin` |
| `PORT` | Порт backend (по умолчанию 8000) |
| `ALLOWED_ORIGINS` | Белый список origins для CORS (через запятую) |
| `GMAIL_ADDRESS` | Gmail-адрес отправителя (опционально) |
| `GMAIL_APP_PASSWORD` | App Password Gmail, 16 символов без пробелов (опционально) |

---

## Структура репозитория

```
deplom/
├── frontend/                # React-приложение (Vite)
│   ├── src/
│   │   ├── pages/           # Auth, Home, Order, Profile, About, Contacts, Admin
│   │   ├── components/      # TableMap, ReservationSection, RestaurantRunnerGame…
│   │   ├── lib/             # api.js (HTTP-клиент), utils.js
│   │   └── main.jsx
│   ├── public/              # Статика: изображения блюд, hero-bg.jpg, logo.png
│   └── Dockerfile
│
├── backend/                 # NestJS API (чистый JS, без TypeScript)
│   ├── src/
│   │   ├── modules/         # auth, menu, orders, reservations, reviews, promos, admin, contact
│   │   ├── common/          # guards, mailer, decorators, utils
│   │   └── prisma/          # PrismaService
│   ├── prisma/
│   │   ├── schema.prisma         # PostgreSQL-схема (Docker/prod)
│   │   ├── schema.sqlite.prisma  # SQLite-схема (локальная разработка)
│   │   ├── seed.js               # Меню + промокоды
│   │   └── dev.db                # SQLite-база (в репо не лежит)
│   ├── scripts/
│   │   └── migrate-to-pg.js      # Перенос данных SQLite → PostgreSQL
│   └── Dockerfile
│
├── docker-compose.yml       # Оркестрация: postgres + api + web
├── .env.example             # Шаблон env-переменных для Docker
└── package.json             # Скрипты-обёртки (npm run dev / setup)
```

---

## Доступные адреса

| Адрес | Что |
|---|---|
| http://localhost:5173 | Сайт ресторана |
| http://localhost:5173/admin | Панель администратора (пароль из `ADMIN_PASSWORD`) |
| http://localhost:8000/api | REST API |
| http://localhost:8000/docs | Swagger UI |

---

## Полезные команды

### Корень проекта

```bash
npm run setup    # установить deps backend+frontend + создать БД + засеять
npm run dev      # запустить backend и frontend параллельно (concurrently)
npm start        # docker compose up --build
npm stop         # docker compose down
```

### Backend (`cd backend`)

```bash
npm run start:dev     # запуск с hot reload
npm run build         # сборка JS → dist/ через SWC
npm run start:prod    # запуск собранного билда
npm run db:push       # применить схему к SQLite
npm run db:seed       # заполнить меню + промокоды
npm test              # unit-тесты
npm run lint          # ESLint
```

### Frontend (`cd frontend`)

```bash
npm run dev           # Vite dev-сервер
npm run build         # production-сборка в dist/
npm run preview       # предпросмотр production-сборки
npm run lint          # ESLint
```

### Docker

```bash
docker compose up --build         # запустить с пересборкой
docker compose up -d              # запустить в фоне
docker compose logs -f            # логи всех сервисов
docker compose logs -f api        # логи только API
docker compose down               # остановить
docker compose down -v            # остановить + удалить volume с БД
docker exec -it look_postgres psql -U postgres look    # подключиться к БД
```

---

## Промокоды

| Код | Скидка | Условие |
|---|---|---|
| `LOOK20` | −20% | Только на первый заказ |
| `LOOK15` | −15% | Секретный (пасхалка в интерфейсе) |
| `LOOKRUN` | −10% | После прохождения мини-игры «Спринт шефа» (2500 очков) |
| Любой кастомный | Задаётся в админке | Создаётся через `/admin` → Промокоды |

---

## API — основные эндпоинты

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/api/register` | Регистрация |
| `POST` | `/api/login` | Вход |
| `POST` | `/api/forgot-password` | Отправка кода сброса пароля |
| `POST` | `/api/reset-password` | Сброс пароля по коду |
| `GET` | `/api/menu` | Список блюд |
| `POST` | `/api/orders` | Создать заказ |
| `GET` | `/api/promo-status` | Доступность системных промокодов |
| `GET` | `/api/promo/lookup?code=X` | Проверка произвольного промокода |
| `POST` | `/api/reservations` | Забронировать столик |
| `POST` | `/api/reviews` | Оставить отзыв |
| `POST` | `/api/admin/login` | Вход в админку |

Полный список — в [backend/README.md](backend/README.md) и в Swagger UI (`/docs`).
