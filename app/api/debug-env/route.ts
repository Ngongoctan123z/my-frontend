import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET() {
  let ctxError = '';
  let envKeys: string[] = [];
  const processEnvKeys = Object.keys(process.env);
  let dbExists = false;
  let authGoogleId = '';
  let authSecret = '';

  try {
    const { env } = await getCloudflareContext();
    if (env) {
      envKeys = Object.keys(env);
      dbExists = !!(env as any).DB;
      authGoogleId = (env as any).AUTH_GOOGLE_ID || 'MISSING';
      authSecret = (env as any).AUTH_SECRET ? 'PRESENT' : 'MISSING';
    }
  } catch (e: any) {
    ctxError = e.message;
  }

  return NextResponse.json({
    processEnvKeys: processEnvKeys.filter(k => k.includes('AUTH') || k === 'DB'),
    ctxError,
    envKeys,
    dbExists,
    authGoogleId,
    authSecret,
    processEnvDb: !!process.env.DB
  });
}
