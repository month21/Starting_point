import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertStepEntry,
  InsertTimeEntry,
  InsertUser,
  stepEntries,
  timeEntries,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listTimeEntries(userId: number, from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return [];
  const clauses = [eq(timeEntries.userId, userId)];
  if (from) clauses.push(gte(timeEntries.startedAt, from));
  if (to) clauses.push(lte(timeEntries.startedAt, to));
  return db.select().from(timeEntries).where(and(...clauses)).orderBy(desc(timeEntries.startedAt));
}

export async function getTimeEntryForUser(userId: number, entryId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, userId), eq(timeEntries.id, entryId)))
    .limit(1);
  return result[0];
}

export async function createTimeEntry(values: InsertTimeEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(timeEntries).values(values);
  return getTimeEntryForUser(values.userId, Number(result[0].insertId));
}

export async function updateTimeEntry(
  userId: number,
  entryId: number,
  values: Partial<Pick<InsertTimeEntry, "label" | "startedAt" | "endedAt" | "runningStartedAt" | "elapsedSeconds" | "status">>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(timeEntries).set(values).where(and(eq(timeEntries.userId, userId), eq(timeEntries.id, entryId)));
  return getTimeEntryForUser(userId, entryId);
}

export async function listStepEntries(userId: number, from?: string, to?: string) {
  const db = await getDb();
  if (!db) return [];
  const clauses = [eq(stepEntries.userId, userId)];
  if (from) clauses.push(gte(stepEntries.dateKey, from));
  if (to) clauses.push(lte(stepEntries.dateKey, to));
  return db.select().from(stepEntries).where(and(...clauses)).orderBy(stepEntries.dateKey);
}

export async function upsertStepEntry(values: InsertStepEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(stepEntries).values(values).onDuplicateKeyUpdate({
    set: { steps: values.steps, source: values.source ?? "manual", updatedAt: new Date() },
  });
}
