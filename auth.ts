import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { drizzle } from "drizzle-orm/d1"
import * as schema from "./src/db/schema"
import { eq, and } from "drizzle-orm"
import { checkRateLimit } from "./src/lib/rateLimit"
import { hashPassword, verifyPassword, isPasswordHash } from "./src/lib/passwords"

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

  if (envObj.AUTH_GOOGLE_ID && envObj.AUTH_GOOGLE_SECRET) providers.push(
    Google({ clientId: envObj.AUTH_GOOGLE_ID, clientSecret: envObj.AUTH_GOOGLE_SECRET })
  )

  providers.push(
    Credentials({
      name: "Tài khoản (Email)",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@vndocs.net" },
        password: { label: "Mật khẩu", type: "password" }
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        if (typeof credentials.email !== 'string' || typeof credentials.password !== 'string' || credentials.email.length > 320 || credentials.password.length > 1024) return null
        const ip = request.headers.get('cf-connecting-ip') || 'unknown'
        if (!checkRateLimit(`login:ip:${ip}`, 20, 60000).allowed || !checkRateLimit(`login:account:${credentials.email.toLowerCase()}`, 8, 60000).allowed) return null
        // The emergency administrator account requires an explicitly configured password.
        if (credentials.email === "admin@vndocs.net" && envObj.WEB_ADMIN_PASSWORD && await verifyPassword(envObj.WEB_ADMIN_PASSWORD, credentials.password)) {
          return { id: "admin-id", name: "Admin Manager", email: "admin@vndocs.net", role: "admin" }
        }

        // 2. Kiểm tra tài khoản trong Database D1
        if (dbBinding) {
          const db = drizzle(dbBinding, { schema });
          const user = await db.select().from(schema.users).where(eq(schema.users.email, credentials.email as string)).get();
          // Verify a salted hash; migrate ordinary legacy accounts after authentication.
          if (user && user.password && await verifyPassword(user.password, credentials.password)) {
             // Never accept a legacy plaintext password for a privileged account.
             if (!isPasswordHash(user.password) && (user.role === 'admin' || user.email === envObj.ADMIN_EMAIL || user.email === 'admin@vndocs.net' || user.email === 'ngongoctan282005@gmail.com')) return null
             if (!isPasswordHash(user.password)) await db.update(schema.users).set({ password: await hashPassword(credentials.password) }).where(and(eq(schema.users.id, user.id), eq(schema.users.password, user.password)))
             return { id: user.id, name: user.name, email: user.email, role: user.role }
          }
        }
        
        return null;
      }
    })
  )

  return {
    trustHost: true,
    adapter: adapter,
    providers: providers,
    secret: envObj.AUTH_SECRET,
    session: {
      strategy: "jwt",
    },
    pages: {
      signIn: '/login',
      error: '/login',
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
          let role = (user as any).role || 'user';
          // Tự động cấp quyền admin nếu đăng nhập bằng Google bằng email admin
          if (user.email === envObj?.ADMIN_EMAIL || user.email === 'admin@vndocs.net' || user.email === 'ngongoctan282005@gmail.com') {
            role = 'admin';
          }
          token.role = role;
        }
        return token;
      }
    },
    debug: false,
  }
})

