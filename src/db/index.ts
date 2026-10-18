import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

import { getCloudflareContext } from '@opennextjs/cloudflare';

// NOTE: Không cache cachedDb ở module scope trên Cloudflare Workers.
// getCloudflareContext() phải được gọi per-request để nhận đúng D1 binding.
// drizzle() chỉ là thin wrapper, không có connection pool — tạo mới mỗi request là OK.

// Optional metadata can fall back when D1 is unavailable during prerender.
// Required API/database consumers must continue using getDb below.
export async function getOptionalDb() {
  let dbBinding = process.env.DB as any;
  
  if (!dbBinding) {
    try {
      const { env } = await getCloudflareContext();
      dbBinding = (env as any).DB;
    } catch (e) {
      // ignore — đang chạy local dev không có CF context
    }
  }

  if (!dbBinding) return null;

  return drizzle(dbBinding, { schema });
}

export async function getDb() {
  const db = await getOptionalDb();
  if (!db) throw new Error('Database binding "DB" not found');
  return db;
}

