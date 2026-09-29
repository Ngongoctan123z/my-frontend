import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { drizzle } from "drizzle-orm/d1"
import * as schema from "./src/db/schema"
import { eq } from "drizzle-orm"

import { getCloudflareContext } from "@opennextjs/cloudflare"

export const { handlers, signIn, signOut, auth } = NextAuth(async (req) => {
  let envObj: any = process.env;
  try {
    const { env } = await getCloudflareContext();
    if (env) {
      envObj = { ...process.env, ...env };
    }
  } catch(e) {
    // ignore
  }

  const dbBinding = envObj.DB;
  const adapter = dbBinding ? DrizzleAdapter(drizzle(dbBinding, { schema })) : undefined;

  const providers: any[] = []

  if (envObj.AUTH_GOOGLE_ID || process.env.AUTH_GOOGLE_ID) {
    providers.push(
      Google({
        clientId: (envObj.AUTH_GOOGLE_ID || process.env.AUTH_GOOGLE_ID) as string,
        clientSecret: (envObj.AUTH_GOOGLE_SECRET || process.env.AUTH_GOOGLE_SECRET) as string,
      })
    )
  } else {
    // Fallback to avoid crashing with 0 providers, though login will fail with 401
    providers.push(
      Google({
        clientId: 'dummy',
        clientSecret: 'dummy',
      })
    )
  }

  return {
    trustHost: true,
    adapter: adapter,
    providers: providers,
    secret: envObj.AUTH_SECRET || 'VNDOCS_SECRET_KEY_123456789_DEFAULT_LONG_ENOUGH',
    session: {
      strategy: "jwt",
    },
    callbacks: {
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.sub as string;
          (session.user as any).role = token.role as string || 'user';
        }
        return session;
      },
      async jwt({ token, user }) {
        if (user) {
          token.role = (user as any).role || 'user';
        }
        return token;
      }
    },
  }
})
