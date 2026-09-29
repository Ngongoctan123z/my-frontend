import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

import { getCloudflareContext } from '@opennextjs/cloudflare';

// Helper to get D1 database instance
export async function getDb() {
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
  return drizzle(dbBinding, { schema });
}
