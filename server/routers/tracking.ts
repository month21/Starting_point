import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { secondsBetween } from "../../shared/analytics";
import * as db from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const entryType = z.enum(["seat", "focus"]);
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const label = z.string().trim().max(120).optional().nullable();

function requiredEntry(entry: Awaited<ReturnType<typeof db.getTimeEntryForUser>>) {
  if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "기록을 찾을 수 없습니다." });
  return entry;
}

export const trackingRouter = router({
  list: protectedProcedure
    .input(z.object({ fromMs: z.number().optional(), toMs: z.number().optional() }).optional())
    .query(({ ctx, input }) => db.listTimeEntries(ctx.user.id, input?.fromMs ? new Date(input.fromMs) : undefined, input?.toMs ? new Date(input.toMs) : undefined)),
  steps: router({
    list: protectedProcedure
      .input(z.object({ from: dateKey.optional(), to: dateKey.optional() }).optional())
      .query(({ ctx, input }) => db.listStepEntries(ctx.user.id, input?.from, input?.to)),
    upsert: protectedProcedure
      .input(z.object({ dateKey, steps: z.number().int().min(0).max(200000) }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertStepEntry({ userId: ctx.user.id, dateKey: input.dateKey, steps: input.steps, source: "manual" });
        return { success: true };
      }),
    import: protectedProcedure
      .input(z.array(z.object({ dateKey, steps: z.number().int().min(0).max(200000) })).min(1).max(730))
      .mutation(async ({ ctx, input }) => {
        for (const entry of input) {
          await db.upsertStepEntry({ userId: ctx.user.id, ...entry, source: "import" });
        }
        return { success: true, count: input.length };
      }),
  }),
  start: protectedProcedure
    .input(z.object({ type: entryType, label }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const existing = (await db.listTimeEntries(ctx.user.id)).find(entry => entry.type === input.type && entry.status !== "completed");
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "해당 타이머가 이미 진행 중입니다." });
      return db.createTimeEntry({
        userId: ctx.user.id,
        type: input.type,
        label: input.label || null,
        startedAt: now,
        runningStartedAt: now,
        elapsedSeconds: 0,
        status: "running",
      });
    }),
  pause: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const entry = requiredEntry(await db.getTimeEntryForUser(ctx.user.id, input.id));
    if (entry.status !== "running" || !entry.runningStartedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "실행 중인 타이머만 일시정지할 수 있습니다." });
    const now = new Date();
    return db.updateTimeEntry(ctx.user.id, entry.id, { elapsedSeconds: entry.elapsedSeconds + secondsBetween(entry.runningStartedAt, now), runningStartedAt: null, status: "paused" });
  }),
  resume: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const entry = requiredEntry(await db.getTimeEntryForUser(ctx.user.id, input.id));
    if (entry.status !== "paused") throw new TRPCError({ code: "BAD_REQUEST", message: "일시정지된 타이머만 다시 시작할 수 있습니다." });
    return db.updateTimeEntry(ctx.user.id, entry.id, { runningStartedAt: new Date(), status: "running" });
  }),
  finish: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const entry = requiredEntry(await db.getTimeEntryForUser(ctx.user.id, input.id));
    if (entry.status === "completed") return entry;
    const now = new Date();
    const elapsedSeconds = entry.elapsedSeconds + (entry.status === "running" && entry.runningStartedAt ? secondsBetween(entry.runningStartedAt, now) : 0);
    return db.updateTimeEntry(ctx.user.id, entry.id, { elapsedSeconds, endedAt: now, runningStartedAt: null, status: "completed" });
  }),
  createCompleted: protectedProcedure
    .input(z.object({ type: entryType, label, startedAtMs: z.number(), endedAtMs: z.number() }))
    .mutation(({ ctx, input }) => {
      const startedAt = new Date(input.startedAtMs);
      const endedAt = new Date(input.endedAtMs);
      const elapsedSeconds = secondsBetween(startedAt, endedAt);
      if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 60) throw new TRPCError({ code: "BAD_REQUEST", message: "기록은 1분 이상이어야 합니다." });
      return db.createTimeEntry({ userId: ctx.user.id, type: input.type, label: input.label || null, startedAt, endedAt, elapsedSeconds, status: "completed", runningStartedAt: null });
    }),
  updatePlacement: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), startedAtMs: z.number(), endedAtMs: z.number(), label }))
    .mutation(async ({ ctx, input }) => {
      const entry = requiredEntry(await db.getTimeEntryForUser(ctx.user.id, input.id));
      if (entry.status !== "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "진행 중인 기록은 캘린더에서 이동할 수 없습니다." });
      const startedAt = new Date(input.startedAtMs);
      const endedAt = new Date(input.endedAtMs);
      const elapsedSeconds = secondsBetween(startedAt, endedAt);
      if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 60) throw new TRPCError({ code: "BAD_REQUEST", message: "기록은 1분 이상이어야 합니다." });
      return db.updateTimeEntry(ctx.user.id, input.id, { startedAt, endedAt, elapsedSeconds, label: input.label || null });
    }),
});
