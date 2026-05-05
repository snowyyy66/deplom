# Look Restaurant — Fullstack Web App

Веб-приложение премиального ресторана **Look**: клиентская часть на React, REST API на NestJS, база данных через Prisma ORM.

---

## Стек технологий

| Часть | Технологии |
|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS, Framer Motion, Radix UI |
| **Backend** | NestJS 11, JavaScript (без TypeScript), SWC, Prisma 5 |
| **БД (dev)** | SQLite (`backend/prisma/dev.db`) |
| **БД (prod)** | PostgreSQL (через `DATABASE_URL`) |

---

## Структура репозитория

```
project/
├── frontend/          # React-приложение (Vite)
│   ├── src/
│   │   ├── pages/     # Страницы (Auth, Home, Order, Profile, About, Contacts, Admin)
│   │   ├── components/# Переиспользуемые компоненты (TableMap, ReservationSection, игра)
│   │   ├── lib/       # api.js (HTTP-клиент), utils.js
│   │   └── main.jsx   # Точка входа
│   └── public/        # Статика: изображения блюд, hero-bg.jpg, logo.png
│
├── backend/           # NestJS API (чистый JS, без TypeScript)
│   ├── src/
│   │   ├── modules/   # auth, menu, orders, reservations, reviews, promos, admin, contact
│   │   └── prisma/    # PrismaService
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js    # Первоначальное заполнение меню
│   │   └── dev.db     # SQLite для разработки
│   └── .swcrc         # Конфиг SWC-компилятора
│
└── README.md          # (этот файл)
```

---

## Быстрый старт

### 1. Клонировать и установить зависимости

```bash
git clone <repo-url>
cd project

# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Настроить окружение бэкенда

Создать файл `backend/.env`:

```env
# SQLite (для разработки — уже есть dev.db)
DATABASE_URL="file:./prisma/dev.db"

# PostgreSQL (для продакшена)
# DATABASE_URL="postgresql://user:password@localhost:5432/look_db"

# Gmail для отправки писем восстановления пароля
GMAIL_ADDRESS="your@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
```

### 3. Применить схему и заполнить меню

```bash
cd backend
npm run db:push   # создаёт таблицы из schema.sqlite.prisma
npm run db:seed   # заполняет 18 блюд (node prisma/seed.js)
```

> Если используете SQLite + готовый `dev.db` — этот шаг можно пропустить.

### 4. Запустить

**Терминал 1 — Backend (порт 8000):**
```bash
cd backend
npm run start:dev
```

**Терминал 2 — Frontend (порт 5173):**
```bash
cd frontend
npm run dev
```

Открыть в браузере: **http://localhost:5173**

---

## Переменные окружения

| Переменная | Описание | Пример |
|---|---|---|
| `DATABASE_URL` | Строка подключения к БД | `file:./prisma/dev.db` |
| `GMAIL_ADDRESS` | Gmail для отправки писем | `your@gmail.com` |
| `GMAIL_APP_PASSWORD` | App Password Gmail | `xxxx xxxx xxxx xxxx` |

---

## Доступные адреса

| Адрес | Что |
|---|---|
| http://localhost:5173 | Сайт ресторана |
| http://localhost:5173/admin | Панель администратора |
| http://localhost:8000/api | REST API |

---

## Промокоды

| Код | Скидка | Условие |
|---|---|---|
| `LOOK20` | −20% | Только на первый заказ |
| `LOOK15` | −15% | Секретный (пасхалка в интерфейсе) |
| `LOOKRUN` | −10% | После прохождения мини-игры Delivery Runner (2500 очков) |

---

## Подробная документация

- [frontend/README.md](frontend/README.md) — архитектура фронтенда, страницы, компоненты
- [backend/README.md](backend/README.md) — API-эндпоинты, модули, схема БД, запуск
