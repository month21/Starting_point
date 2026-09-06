import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const timeEntries = mysqlTable(
  "timeEntries",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", ["seat", "focus"]).notNull(),
    label: varchar("label", { length: 120 }),
    startedAt: timestamp("startedAt").notNull(),
    endedAt: timestamp("endedAt"),
    runningStartedAt: timestamp("runningStartedAt"),
    elapsedSeconds: int("elapsedSeconds", { unsigned: true }).notNull().default(0),
    status: mysqlEnum("status", ["running", "paused", "completed"]).notNull().default("completed"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("timeEntries_user_started_idx").on(table.userId, table.startedAt),
    index("timeEntries_user_status_idx").on(table.userId, table.status),
  ],
);

export const stepEntries = mysqlTable(
  "stepEntries",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    dateKey: varchar("dateKey", { length: 10 }).notNull(),
    steps: int("steps", { unsigned: true }).notNull(),
    source: mysqlEnum("source", ["manual", "import"]).notNull().default("manual"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("stepEntries_user_date_unique").on(table.userId, table.dateKey),
    index("stepEntries_user_date_idx").on(table.userId, table.dateKey),
  ],
);

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = typeof timeEntries.$inferInsert;
export type StepEntry = typeof stepEntries.$inferSelect;
export type InsertStepEntry = typeof stepEntries.$inferInsert;
