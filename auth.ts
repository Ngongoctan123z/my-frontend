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

  const providers: any[] = [
    Credentials({
      name: "Email và Mật khẩu",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "ngongoctan282005@gmail.com" },
        password: { label: "Mật khẩu", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        if (!dbBinding) {
          console.error("Missing DB binding, cannot authorize")
          return null
        }

        const db = drizzle(dbBinding, { schema })
        const userRecords = await db.select().from(schema.users).where(eq(schema.users.email, credentials.email as string))
        if (userRecords.length === 0) return null

        const user = userRecords[0]
        
        // Kiểm tra mật khẩu (đơn giản, lưu plain-text theo yêu cầu)
        if (user.password === credentials.password) {
          return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role }
        }
        return null
      }
    })
  ]

  if (envObj.AUTH_GOOGLE_ID && envObj.AUTH_GOOGLE_SECRET) {
    providers.unshift(
      Google({
        clientId: envObj.AUTH_GOOGLE_ID,
        clientSecret: envObj.AUTH_GOOGLE_SECRET,
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
