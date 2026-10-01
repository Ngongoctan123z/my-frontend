import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

import { getCloudflareContext } from '@opennextjs/cloudflare';

let cachedDb: ReturnType<typeof drizzle> | null = null;

// Helper to get D1 database instance
export async function getDb() {
  if (cachedDb) return cachedDb;

  let dbBinding = process.env.DB as any;
  
  if (!dbBinding) {
    try {
      const { env } = await getCloudflareContext();
      dbBinding = (env as any).DB;
    } catch (e) {
      // ignore
    }
  }

  if (!dbBinding) {
    throw new Error('Database binding "DB" not found');
  }
  
  cachedDb = drizzle(dbBinding, { schema });
  return cachedDb;
}
