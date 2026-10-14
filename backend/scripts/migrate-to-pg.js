// Миграция данных из SQLite → PostgreSQL (Docker)
// Запуск: node scripts/migrate-to-pg.js
import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const PG_URL = process.env.PG_URL || 'postgresql://postgres:postgres@localhost:5432/look';

// SQLite хранит даты как Unix-мс или ISO-строки — нормализуем
function toDate(v) {
  if (!v) return null;
  if (typeof v === 'number') return new Date(v).toISOString();
  return v;
}

const sqlite = new Database(DB_PATH, { readonly: true });
const { Pool } = pg;
const pool = new Pool({ connectionString: PG_URL });

async function migrate() {
  console.log('Подключение к PostgreSQL...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Очищаем таблицы перед миграцией (каскадно)
    await client.query('TRUNCATE TABLE order_items, orders, reviews, reservations, contact_messages, password_reset_tokens, promo_codes, users, menu_items RESTART IDENTITY CASCADE');
    console.log('✔ Таблицы очищены');

    // Users
    const users = sqlite.prepare('SELECT * FROM users').all();
    if (users.length) {
      for (const u of users) {
        await client.query(
          `INSERT INTO users (id, name, email, phone, password_hash, role, has_found_easter_egg, runner_promo_eligible, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING`,
          [u.id, u.name, u.email, u.phone, u.password_hash, u.role,
           u.has_found_easter_egg, u.runner_promo_eligible, toDate(u.created_at)]
        );
      }
      await client.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
      console.log(`✔ users: ${users.length}`);
    }

    // Menu items
    const menu = sqlite.prepare('SELECT * FROM menu_items').all();
    if (menu.length) {
      for (const m of menu) {
        await client.query(
          `INSERT INTO menu_items (id, name, price, category, image_url, rating, prep_time, description, tag)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
          [m.id, m.name, m.price, m.category, m.image_url, m.rating, m.prep_time, m.description, m.tag]
        );
      }
      await client.query(`SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items))`);
      console.log(`✔ menu_items: ${menu.length}`);
    }

    // Orders
    const orders = sqlite.prepare('SELECT * FROM orders').all();
    if (orders.length) {
      for (const o of orders) {
        await client.query(
          `INSERT INTO orders (id, user_id, address, phone, recipient_name, email, promo_code, comment, total_amount, status, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
          [o.id, o.user_id, o.address, o.phone, o.recipient_name, o.email,
           o.promo_code, o.comment, o.total_amount, o.status, toDate(o.created_at)]
        );
      }
      await client.query(`SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders))`);
      console.log(`✔ orders: ${orders.length}`);
    }

    // Order items
    const items = sqlite.prepare('SELECT * FROM order_items').all();
    if (items.length) {
      for (const i of items) {
        await client.query(
          `INSERT INTO order_items (id, order_id, menu_item_id, quantity, price)
           VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
          [i.id, i.order_id, i.menu_item_id, i.quantity, i.price]
        );
      }
      await client.query(`SELECT setval('order_items_id_seq', (SELECT MAX(id) FROM order_items))`);
      console.log(`✔ order_items: ${items.length}`);
    }

    // Reservations
    const reservations = sqlite.prepare('SELECT * FROM reservations').all();
    if (reservations.length) {
      for (const r of reservations) {
        await client.query(
          `INSERT INTO reservations (id, user_id, name, phone, date, time, guests_count, table_number, notes, status, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
          [r.id, r.user_id, r.name, r.phone, toDate(r.date), r.time,
           r.guests_count, r.table_number, r.notes, r.status, toDate(r.created_at)]
        );
      }
      await client.query(`SELECT setval('reservations_id_seq', (SELECT MAX(id) FROM reservations))`);
      console.log(`✔ reservations: ${reservations.length}`);
    }

    // Reviews
    const reviews = sqlite.prepare('SELECT * FROM reviews').all();
    if (reviews.length) {
      for (const r of reviews) {
        await client.query(
          `INSERT INTO reviews (id, user_id, author_name, rating, text, created_at)
           VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
          [r.id, r.user_id, r.author_name ?? r.name, r.rating, r.text, toDate(r.created_at)]
        );
      }
      await client.query(`SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews))`);
      console.log(`✔ reviews: ${reviews.length}`);
    }

    // Promo codes
    try {
      const promos = sqlite.prepare('SELECT * FROM promo_codes').all();
      if (promos.length) {
        for (const p of promos) {
          await client.query(
            `INSERT INTO promo_codes (id, code, discount, description, is_active, valid_from, valid_until, usage_limit, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
            [p.id, p.code, p.discount, p.description, p.is_active === 1,
             toDate(p.valid_from), toDate(p.valid_until), p.usage_limit, toDate(p.created_at)]
          );
        }
        await client.query(`SELECT setval('promo_codes_id_seq', (SELECT MAX(id) FROM promo_codes))`);
        console.log(`✔ promo_codes: ${promos.length}`);
      }
    } catch { console.log('promo_codes — пропуск (таблица не найдена в SQLite)'); }

    // Contact messages
    try {
      const msgs = sqlite.prepare('SELECT * FROM contact_messages').all();
      if (msgs.length) {
        for (const m of msgs) {
          await client.query(
            `INSERT INTO contact_messages (id, name, contact, message, created_at)
             VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
            [m.id, m.name, m.contact, m.message, toDate(m.created_at)]
          );
        }
        await client.query(`SELECT setval('contact_messages_id_seq', (SELECT MAX(id) FROM contact_messages))`);
        console.log(`✔ contact_messages: ${msgs.length}`);
      }
    } catch { console.log('contact_messages — пропуск'); }

    await client.query('COMMIT');
    console.log('\n✅ Миграция завершена!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Ошибка:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    sqlite.close();
  }
}

migrate();
