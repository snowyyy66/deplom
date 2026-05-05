# Look Restaurant — Backend API

REST API ресторана Look на базе **NestJS 11** + **Prisma 5**. Написан на чистом **JavaScript** (без TypeScript), компилируется через **SWC**. Все эндпоинты доступны по префиксу `/api`.

---

## Стек

| Библиотека | Назначение |
|---|---|
| NestJS 11 | Фреймворк (модули, DI, guards, pipes) |
| SWC | Быстрый компилятор JS (заменяет tsc) |
| Prisma 5 | ORM, миграции |
| PostgreSQL | БД (prod); SQLite (`dev.db`) — для разработки |
| bcryptjs | Хеширование паролей |
| nodemailer | Отправка email (восстановление пароля) |
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
DATABASE_URL="file:./prisma/dev.db"

# PostgreSQL (для продакшена)
# DATABASE_URL="postgresql://user:password@localhost:5432/look_db"

# Gmail для отправки писем восстановления пароля
GMAIL_ADDRESS="your@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
```

### База данных

```bash
# Применить схему (создать таблицы)
npm run db:push

# Заполнить меню 18-ю блюдами
npm run db:seed
```

> Если уже есть готовый `dev.db` — этот шаг можно пропустить.

### Запуск

```bash
npm run start:dev   # dev-режим с hot reload (порт 8000)
npm run build       # компиляция JS → dist/ через SWC
npm run start:prod  # запуск скомпилированного dist/main.js
```

---

## Структура проекта

```
backend/
├── src/
│   ├── main.js                  # Точка входа
│   ├── app.module.js            # Корневой модуль
│   ├── common/
│   │   ├── db.utils.js          # ilike() для SQLite/Postgres совместимости
│   │   └── http-exception.filter.js
│   ├── config/
│   │   └── constants.js         # MAX_TABLES, MIN_RUNNER_SCORE
│   ├── prisma/
│   │   ├── prisma.module.js
│   │   └── prisma.service.js
│   └── modules/
│       ├── auth/                # Регистрация, логин, сброс пароля
│       ├── menu/                # Меню (GET публичный)
│       ├── orders/              # Заказы + валидация промокодов
│       ├── reservations/        # Бронирования
│       ├── reviews/             # Отзывы
│       ├── promos/              # promo-status, easter egg, runner-reward
│       ├── contact/             # Форма обратной связи
│       └── admin/               # Все admin-эндпоинты (x-admin-key)
├── prisma/
│   ├── schema.prisma            # PostgreSQL (prod)
│   ├── schema.sqlite.prisma     # SQLite (dev)
│   ├── seed.js                  # Заполнение меню (CommonJS, node напрямую)
│   └── dev.db                   # SQLite база (dev)
├── .swcrc                       # Конфиг SWC-компилятора
└── .env                         # Переменные окружения (не в репо)
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
| POST | `/api/register` | Регистрация: `{ name, email, phone, password }` |
| POST | `/api/login` | Вход: `{ email, password }` |
| POST | `/api/forgot-password` | Запрос кода сброса: `{ email }` |
| POST | `/api/reset-password` | Сброс пароля: `{ email, code, new_password }` |

### Меню

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/menu` | Список всех блюд |
| POST | `/api/menu` | Добавить блюдо |

### Заказы

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/orders` | Создать заказ (валидация промокода на сервере) |
| GET | `/api/orders` | Все заказы |
| GET | `/api/orders/user/:id` | Заказы конкретного пользователя |

### Бронирования

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/reservations` | Создать бронирование |
| GET | `/api/reservations` | Все бронирования |
| GET | `/api/reservations/user/:id` | Брони пользователя |
| GET | `/api/reservations/availability` | Занятые столики: `?date=YYYY-MM-DD&time=HH:mm` |
| PATCH | `/api/reservations/:id/cancel` | Отмена бронирования |

### Отзывы

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/reviews` | Все отзывы |
| POST | `/api/reviews` | Добавить отзыв |
| GET | `/api/reviews/user/:id` | Отзывы пользователя |

### Промокоды и игра

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/promo-status` | Статус промокодов: `?email=...` |
| POST | `/api/user/runner-reward` | Разблокировать LOOKRUN: `{ email, score }` (score ≥ 2500) |
| POST | `/api/user/found-easter-egg` | Отметить находку пасхалки: `{ email }` |

### Контакт

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/contact` | Отправить сообщение: `{ name, contact, message }` |

---

## Admin-эндпоинты

Все admin-запросы требуют заголовок:
```
x-admin-key: look-admin-2024
```

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/admin/menu` | Список блюд |
| POST | `/api/admin/menu` | Добавить блюдо |
| PATCH | `/api/admin/menu/:id` | Обновить блюдо |
| DELETE | `/api/admin/menu/:id` | Удалить блюдо |
| GET | `/api/admin/menu/export-csv` | Экспорт меню в CSV |
| GET | `/api/admin/orders` | Все заказы с позициями |
| PATCH | `/api/admin/orders/:id/status` | Сменить статус заказа |
| GET | `/api/admin/reservations` | Все бронирования |
| PATCH | `/api/admin/reservations/:id/status` | Сменить статус брони |
| GET | `/api/admin/reviews` | Все отзывы |
| DELETE | `/api/admin/reviews/:id` | Удалить отзыв |
| GET | `/api/admin/messages` | Сообщения из формы обратной связи |

---

## Логика промокодов

### LOOK20 (−20%)
- Только для первого заказа по email

### LOOK15 (−15%)
- Доступен только если `user.hasFoundEasterEgg = 1`
- Однократное использование

### LOOKRUN (−10%)
- Доступен если `user.runnerPromoEligible = 1` (после прохождения мини-игры)
- После применения флаг сбрасывается в 0

---

## Схема базы данных

### User
| Поле | Тип | Описание |
|---|---|---|
| id | Int PK | Автоинкремент |
| name | String | Имя |
| email | String unique | Email |
| phone | String | Телефон |
| passwordHash | String | bcrypt-хеш |
| hasFoundEasterEgg | Int (0/1) | Нашёл ли пасхалку |
| runnerPromoEligible | Int (0/1) | Доступен ли LOOKRUN |

### MenuItem
| Поле | Тип | Описание |
|---|---|---|
| id | Int PK | — |
| name | String | Название |
| price | Int | Цена в рублях |
| category | String | Основные / Закуски / Десерты / Салаты |
| imageUrl | String | Путь к изображению |
| rating | Float | Рейтинг |
| prepTime | Int | Время приготовления, мин |
| description | String? | Описание |
| tag | String? | Хит / Новинка / Веган / … |

### Order
| Поле | Тип | Описание |
|---|---|---|
| id | Int PK | — |
| userId | Int? FK | Привязка к пользователю |
| address | String | Адрес доставки |
| phone | String | Телефон |
| recipientName | String | Имя получателя |
| totalAmount | Int | Итоговая сумма |
| promoCode | String? | Использованный промокод |
| email | String? | Email |
| status | String | new / preparing / delivering / completed / cancelled |

### Reservation
| Поле | Тип | Описание |
|---|---|---|
| id | Int PK | — |
| userId | Int? FK | Привязка к пользователю |
| name | String | Имя гостя |
| phone | String | Телефон |
| date | DateTime | Дата визита |
| time | String | Время (напр. "19:30") |
| guestsCount | Int | Количество гостей |
| tableNumber | Int? | Номер столика (1–23) |
| notes | String? | Особые пожелания |
| status | String | pending / confirmed / cancelled |

### Review
| Поле | Тип | Описание |
|---|---|---|
| id | Int PK | — |
| userId | Int? FK | Привязка к пользователю |
| authorName | String | Имя автора |
| rating | Int | 1–5 |
| text | String | Текст отзыва |

---

## Запуск тестов

```bash
npm run test        # unit-тесты (Jest + @swc/jest)
npm run test:watch  # watch-режим
npm run test:cov    # покрытие кода
```
