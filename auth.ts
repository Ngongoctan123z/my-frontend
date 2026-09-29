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
  if (!dbBinding) {
    throw new Error("Missing DB binding for NextAuth");
  }

  const db = drizzle(dbBinding, { schema });

  return {
    trustHost: true,
    adapter: DrizzleAdapter(db),
    providers: [
      Google({
        clientId: envObj.AUTH_GOOGLE_ID,
        clientSecret: envObj.AUTH_GOOGLE_SECRET,
      }),
      Credentials({
        name: "Email và Mật khẩu",
        credentials: {
          email: { label: "Email", type: "text", placeholder: "ngongoctan282005@gmail.com" },
          password: { label: "Mật khẩu", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null
          
          const userRecords = await db.select().from(schema.users).where(eq(schema.users.email, credentials.email as string))
          if (userRecords.length === 0) return null

          const user = userRecords[0]
          
          // Kiểm tra mật khẩu (đơn giản, lưu plain-text theo yêu cầu)
          if (user.password === credentials.password) {
            return { id: user.id, name: user.name, email: user.email, image: user.image }
          }
          return null
        }
      })
    ],
    secret: envObj.AUTH_SECRET,
    session: {
      strategy: "jwt",
    },
    callbacks: {
      async session({ session, token }) {
        if (session.user && token.sub) {
          session.user.id = token.sub;
        }
        return session;
      },
    },
  }
})
