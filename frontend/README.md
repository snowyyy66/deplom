# Look Restaurant — Frontend

React-приложение ресторана Look. Клиентская SPA без роутера — навигация реализована через состояние `currentPage` в `App.jsx`.

---

## Стек

| Библиотека | Версия | Назначение |
|---|---|---|
| React | 19 | UI-фреймворк |
| Vite | 7 | Сборщик и dev-сервер |
| Tailwind CSS | 3 | Утилитарные стили |
| Framer Motion | 12 | Анимации, scroll-эффекты |
| Radix UI | — | Доступные примитивы (Dialog, Popover, Calendar, Label) |
| Lucide React | — | Иконки |
| canvas-confetti | — | Конфетти на экранах успеха |
| Leaflet | 1.9 | Интерактивная карта на странице Контактов |
| date-fns | 4 | Форматирование дат (локаль `ru`) |
| sonner | 2 | Toast-уведомления |

---

## Установка и запуск

```bash
cd frontend
npm install
npm run dev        # dev-сервер → http://localhost:5173
npm run build      # production-сборка → dist/
npm run preview    # предпросмотр production-сборки
npm run lint       # ESLint
```

> Frontend проксирует `/api` → `http://127.0.0.1:8000` через Vite (настройка в `vite.config.js`).  
> Для смены адреса API задайте `VITE_API_URL` в `.env`.

---

## Структура `src/`

```
src/
├── main.jsx                    # Точка входа, монтирование React
├── App.jsx                     # Корень: роутинг по состоянию, корзина, userData
│
├── pages/
│   ├── AuthPage.jsx            # Вход / Регистрация / Восстановление пароля
│   ├── HomePage.jsx            # Главная: hero, меню, отзывы, CTA-баннер
│   ├── OrderPage.jsx           # Доставка + Бронирование (два режима)
│   ├── ProfilePage.jsx         # Профиль, история заказов/броней/отзывов
│   ├── AboutPage.jsx           # О ресторане
│   ├── ContactsPage.jsx        # Контакты, карта, форма обратной связи
│   ├── AdminPage.jsx           # Панель администратора
│   └── AdminLoginPage.jsx      # Страница входа в /admin
│
├── components/
│   ├── ReservationSection.jsx  # Форма бронирования (3 шага: стол → данные → успех)
│   ├── TableMap.jsx            # SVG-карта зала с кликабельными столиками
│   ├── RestaurantRunnerGame.jsx# Мини-игра Delivery Runner (Canvas 2D)
│   ├── MapPickerModal.jsx      # Модальное окно выбора адреса на карте (Leaflet)
│   └── ui/                    # Shadcn/Radix компоненты: button, input, dialog и др.
│
└── lib/
    ├── api.js                  # Все HTTP-запросы к backend
    └── utils.js                # cn() — утилита для классов Tailwind
```

---

## Страницы

### AuthPage `/`
- Вкладки **Вход** / **Регистрация**
- **Восстановление пароля**: email → 6-значный код → новый пароль
- После успешного входа/регистрации — сохранение `userData` в `localStorage` и переход на главную

### HomePage
- **Hero-секция**: фоновое изображение, fade-out при скролле
- **Меню**: фильтрация по категориям, сортировка по цене, добавление в корзину
- **Отзывы**: список + форма добавления отзыва
- **CTA-баннер**: промокод `LOOK20` (−20% на первый заказ)
- **Footer** и мобильная нижняя навигация

### OrderPage — режим `delivery`
1. Список меню с фильтрами по категориям, добавление в корзину
2. Форма оформления: адрес (ввод вручную или выбор на карте), промокод, комментарий
3. Экран успеха «ЗАКАЗ В ПУТИ» с конфетти + кнопка запуска мини-игры

### OrderPage — режим `reservation`
- Шаг 1: выбор столика на SVG-карте зала + дата/время/кол-во гостей
- Шаг 2: подтверждение данных, особые пожелания (теги)
- Шаг 3: экран успеха с конфетти «СТОЛ ЗАБРОНИРОВАН»

### ProfilePage
Четыре вкладки:
- **Профиль** — редактирование имени, email, телефона
- **Доставка** — история заказов со статусами
- **Брони** — список бронирований, кнопка отмены
- **Отзывы** — свои отзывы
- Кнопка **Админ панель** — только для аккаунта `123@123.com`

### AdminPage `/admin`
- Вход по паролю (`ADMIN_KEY` из `.env`, по умолчанию `look-admin-2024`)
- **Дашборд**: счётчики блюд, заказов, броней, отзывов; последние сообщения
- **Меню**: список с редактированием/удалением, добавление блюда, экспорт CSV
- **Заказы**: список с составом и суммой, смена статуса (Новый → Готовится → Доставляется → Выполнен → Отменён)
- **Брони**: список с датой/временем/столиком, смена статуса (Ожидает → Подтверждён → Отменён)
- **Отзывы**: список с рейтингом и датой, удаление
- **Сообщения**: входящие из формы обратной связи

---

## Мини-игра Delivery Runner

Файл: `src/components/RestaurantRunnerGame.jsx`

- Движок: Canvas 2D, рендер через `requestAnimationFrame`
- Управление: клик по зонам канваса (3 полосы) или стрелки ← →  / A / D
- Дистанция: 0 → 5000 м; скорость нарастает со временем
- Препятствия: машины и ямы, случайный спавн
- HP: 100, снижается при столкновениях (−25 машина, −15 яма)
- **2500 м** — разблокируется промокод `LOOKRUN` (−10%), можно забрать даже после гибели
- **5000 м** — финальная анимация доставки (cinematic ending на Canvas)

---

## Система промокодов

| Код | Скидка | Как получить |
|---|---|---|
| `LOOK20` | −20% | Автоматически — только на первый заказ |
| `LOOK15` | −15% | Секретная пасхалка в интерфейсе |
| `LOOKRUN` | −10% | Проехать 2500 м в мини-игре |

Промокод вводится в форме доставки. Валидация — и на фронте (через `promoStatus`), и на бэкенде.

---

## HTTP-клиент (`src/lib/api.js`)

Базовый URL — `/api` (проксируется Vite на `http://127.0.0.1:8000`).  
Все запросы возвращают JSON. Таймаут критичных запросов (логин, регистрация) — 8–10 секунд через `AbortController`.

```js
api.getMenu()                          // GET /api/menu
api.login(email, password)             // POST /api/login
api.register(name, email, phone, pass) // POST /api/register
api.createOrder(data)                  // POST /api/orders
api.createReservation(data)            // POST /api/reservations
api.getPromoStatus(email)              // GET  /api/promo-status
api.claimRunnerReward(email, score)    // POST /api/user/runner-reward
api.submitReview(data)                 // POST /api/reviews
api.getUserOrders(userId)              // GET  /api/orders/user/:id
api.getUserReservations(userId)        // GET  /api/reservations/user/:id
api.cancelReservation(id)              // PATCH /api/reservations/:id/cancel
api.forgotPassword(email)             // POST /api/forgot-password
api.resetPassword(data)               // POST /api/reset-password
```

---

## Конфигурация Vite

`vite.config.js` — прокси `/api` на бэкенд:
```js
proxy: {
  '/api': {
    target: process.env.VITE_API_URL || 'http://127.0.0.1:8000',
    changeOrigin: true,
  }
}
```

Для смены адреса бэкенда — задайте `VITE_API_URL` в `frontend/.env`:
```env
VITE_API_URL=http://my-backend.com
```
