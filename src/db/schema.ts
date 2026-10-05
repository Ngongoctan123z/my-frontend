import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core"
import type { AdapterAccountType } from "next-auth/adapters"

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  role: text("role").default("user").notNull(),
  status: text("status").default("active").notNull(), // 'active', 'blocked'
  password: text("password"),
  plan: text("plan").default("free").notNull(), // 'free', 'plus', 'pro'
  planExpiresAt: integer("planExpiresAt", { mode: "timestamp_ms" }),
})

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
})

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
)

export const prompts = sqliteTable("prompt", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: text("type").notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const systemConfigs = sqliteTable("system_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
})

export const apiUsages = sqliteTable(
  "api_usage",
  {
    userId: text("userId").notNull(),
    date: text("date").notNull(), // format YYYY-MM-DD
    count: integer("count").default(0).notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({ columns: [table.userId, table.date] }),
  })
)

export const chatMessages = sqliteTable("chat_message", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  isAdmin: integer("isAdmin", { mode: "boolean" }).default(false).notNull(),
  content: text("content").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  isRead: integer("isRead", { mode: "boolean" }).default(false).notNull(),
})

export const sharedExams = sqliteTable("shared_exam", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  creatorId: text("creatorId").notNull(),
  examType: text("examType").notNull(), // e.g. IELTS_TASK_1
  content: text("content").notNull(), // The prompt content
  imageUrl: text("imageUrl"), // Optional image URL for Task 1
  imageDescription: text("imageDescription"), // Custom image description by Pro user
  requirePhone: integer("requirePhone", { mode: "boolean" }).default(false).notNull(),
  requireEmail: integer("requireEmail", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
})

export const sharedExamSubmissions = sqliteTable("shared_exam_submission", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sharedExamId: text("sharedExamId").notNull(),
  studentName: text("studentName").notNull(),
  studentPhone: text("studentPhone"),
  studentEmail: text("studentEmail"),
  studentEssay: text("studentEssay").notNull(),
  gradingResult: text("gradingResult").notNull(), // JSON string
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
})

export const essayHistory = sqliteTable("essay_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  examType: text("examType").notNull(),
  prompt: text("prompt").notNull(),
  essay: text("essay").notNull(),
  result: text("result").notNull(), // JSON string
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
})
