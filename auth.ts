import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
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

  providers.push(
    Google({
      clientId: envObj.AUTH_GOOGLE_ID || process.env.AUTH_GOOGLE_ID || '828707291275-fnvthfbo2muk10b82lu4kt4uhiohi9d2.apps.googleusercontent.com',
      clientSecret: envObj.AUTH_GOOGLE_SECRET || process.env.AUTH_GOOGLE_SECRET || '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',
    })
  )

  providers.push(
    Credentials({
      name: "Tài khoản (Email)",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@vndocs.net" },
        password: { label: "Mật khẩu", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Kiểm tra tài khoản Admin cứng (Fallback)
        if (credentials.email === "admin@vndocs.net" && credentials.password === (envObj.WEB_ADMIN_PASSWORD || "282005")) {
          return { id: "admin-id", name: "Admin Manager", email: "admin@vndocs.net", role: "admin" }
        }

        // 2. Kiểm tra tài khoản trong Database D1
        if (dbBinding) {
          const db = drizzle(dbBinding, { schema });
          const user = await db.select().from(schema.users).where(eq(schema.users.email, credentials.email as string)).get();
          // So sánh mật khẩu (hiện tại so sánh chuỗi thường, nếu có mã hóa bcrypt thì thêm ở đây)
          if (user && user.password === credentials.password) {
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
          let role = (user as any).role || 'user';
          // Tự động cấp quyền admin nếu đăng nhập bằng Google bằng email admin
          if (user.email === envObj.ADMIN_EMAIL || user.email === 'admin@vndocs.net' || user.email === 'ngongoctan282005@gmail.com') {
            role = 'admin';
          }
          token.role = role;
        }
        return token;
      }
    },
  }
})
