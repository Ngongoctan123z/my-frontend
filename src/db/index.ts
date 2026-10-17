import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

import { getCloudflareContext } from '@opennextjs/cloudflare';

// NOTE: Không cache cachedDb ở module scope trên Cloudflare Workers.
// getCloudflareContext() phải được gọi per-request để nhận đúng D1 binding.
// drizzle() chỉ là thin wrapper, không có connection pool — tạo mới mỗi request là OK.

// Helper to get D1 database instance
export async function getDb() {
  let dbBinding = process.env.DB as any;
  
  if (!dbBinding) {
    try {
      const { env } = await getCloudflareContext();
      dbBinding = (env as any).DB;
    } catch (e) {
      // ignore — đang chạy local dev không có CF context
    }
  }

  if (!dbBinding) {
    throw new Error('Database binding "DB" not found');
  }
  
  return drizzle(dbBinding, { schema });
}
