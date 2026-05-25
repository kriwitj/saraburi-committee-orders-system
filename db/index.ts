import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | undefined;

/**
 * Lazy initialization — สร้าง Pool เฉพาะตอนใช้งานจริง
 * ทำให้ `next build` ผ่านได้โดยไม่ต้องมี DATABASE_URL ตอน build time
 */
function initDb(): DrizzleDb {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL environment variable is not set');

    const pool = new Pool({
      connectionString: url,
      // เปิด SSL เมื่อ DATABASE_SSL=true (สำหรับ cloud PostgreSQL)
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    _db = drizzle(pool, { schema });
  }
  return _db;
}

// Proxy ให้ใช้งานเหมือนเดิม (db.select, db.insert, ฯลฯ)
// โดยไม่ต้องแก้ไข queries.ts หรือไฟล์อื่น
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_, prop: string | symbol) {
    return initDb()[prop as keyof DrizzleDb];
  },
});
