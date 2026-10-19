import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
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

export const bankTransactions = sqliteTable("bank_transaction", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  transactionId: text("transactionId").unique(),
  bank: text("bank"),
  direction: text("direction"), // 'IN', 'OUT'
  amount: integer("amount").notNull(),
  currency: text("currency").default("VND").notNull(),
  content: text("content"),
  referenceCode: text("referenceCode"),
  receivedAt: integer("receivedAt", { mode: "timestamp_ms" }),
  syncedAt: integer("syncedAt", { mode: "timestamp_ms" }).notNull(),
  status: text("status").default("unmatched").notNull(), // 'unmatched', 'matched', 'ignored'
  matchedUserId: text("matchedUserId"), // To store which user got the upgrade
})

// ─── Speaking Feature ───────────────────────────────────────────────────────

export const speakingSessions = sqliteTable("speaking_session", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  examType: text("examType").notNull(), // 'IELTS_SPEAKING' | 'TOEIC_SPEAKING'
  part: text("part").notNull(), // Canonical IELTS PART_1/2/3 and TOEIC Q1_2/Q3_4/Q5_7/Q8_10/Q11
  promptEn: text("promptEn").notNull(),
  promptVi: text("promptVi").notNull(),
  transcript: text("transcript"), // raw STT output
  transcriptWithPauses: text("transcriptWithPauses"), // with ... markers
  fluencyData: text("fluencyData"), // JSON: wpm, pause_count etc
  aiResult: text("aiResult"), // JSON: full AI response
  confirmedWords: text("confirmedWords"), // JSON: user-confirmed mishear corrections
  audioDurationMs: integer("audioDurationMs"),
  speechDurationMs: integer("speechDurationMs"),
  status: text("status").default("pending").notNull(), // 'pending' | 'transcribed' | 'analyzed' | 'error'
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const speakingSubmissions = sqliteTable('speaking_submission', {
  id: text('id').primaryKey(), email: text('email').notNull(), fingerprint: text('fingerprint').notNull(),
  examType: text('examType').notNull(), mode: text('mode').notNull(), feedbackLang: text('feedbackLang').notNull(),
  manifest: text('manifest').notNull(), quotaDate: text('quotaDate').notNull(), status: text('status').notNull(),
  createdAt: integer('createdAt').notNull(),
}, table => [index('speaking_submission_owner_created').on(table.email, table.createdAt)])

export const speakingRecordings = sqliteTable('speaking_recording', {
  id: text('id').primaryKey(), submissionId: text('submissionId').notNull(), itemIndex: integer('itemIndex').notNull(),
  contentHash: text('contentHash').notNull(), transcript: text('transcript'), result: text('result'),
  status: text('status').default('pending').notNull(), leaseToken: text('leaseToken'), leaseUntil: integer('leaseUntil'),
  error: text('error'), chatLog: text('chatLog'), updatedAt: integer('updatedAt').notNull(),
}, table => [index('speaking_recording_submission').on(table.submissionId, table.itemIndex)])

export const speakingAudio = sqliteTable('speaking_audio', {
  recordingId: text('recordingId').primaryKey(), objectKey: text('objectKey').notNull(),
  mimeType: text('mimeType').notNull(), byteSize: integer('byteSize').notNull(),
  createdAt: integer('createdAt').notNull(),
})

export const speakingPrompts = sqliteTable("speaking_prompt", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  examType: text("examType").notNull(), // 'IELTS_SPEAKING' | 'TOEIC_SPEAKING'
  part: text("part").notNull(), // Canonical IELTS PART_1/2/3 and TOEIC Q1_2/Q3_4/Q5_7/Q8_10/Q11
  topic: text("topic").notNull(),
  questionEn: text("questionEn").notNull(),
  questionVi: text("questionVi").notNull(),
  cueCard: text("cueCard"), // For IELTS Part 2
  subQuestions: text("subQuestions"), // JSON array
  suggestedVocabulary: text("suggestedVocabulary"), // JSON array
  imageUrl: text("imageUrl"), // For TOEIC Q3 picture / Q7-9 chart
  prepTimeSec: integer("prepTimeSec").default(0).notNull(),
  speakTimeSec: integer("speakTimeSec").default(45).notNull(),
  startGraceSec: integer("startGraceSec").default(0).notNull(),
  criteria: text("criteria"), // JSON array
  difficulty: text("difficulty").default("medium").notNull(), // 'easy' | 'medium' | 'hard'
  setId: text("setId"), // For linking Part 2 and Part 3 sets
  isPublished: integer("isPublished", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const speakingChats = sqliteTable("speaking_chat", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("sessionId").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
})



