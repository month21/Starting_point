import { randomInt } from "node:crypto";
import { and, desc, eq, gt, gte, isNull, lte, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  classPeriods,
  movementProfiles,
  movementReminders as alerts,
  timeEntries,
} from "../../drizzle/schema";
import { decide, interval, recommend, summarize } from "../../shared/movement";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

async function database() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "기록 저장소에 연결할 수 없어요.",
    });
  return db;
}
const settings = z.object({
  place: z.enum(["desk", "hall", "home"]),
  situation: z.enum(["quiet", "free"]),
  preference: z.enum(["walk", "ankle", "stretch"]),
});
const identity = z.object({ id: z.number().int().positive() });

export const movementRouter = router({
  report: protectedProcedure.query(async ({ ctx }) => {
    const db = await database();
    const uid = ctx.user.id;
    const now = new Date();
    const [profiles, rows, classes] = await Promise.all([
      db
        .select()
        .from(movementProfiles)
        .where(eq(movementProfiles.userId, uid)),
      db
        .select()
        .from(alerts)
        .where(eq(alerts.userId, uid))
        .orderBy(desc(alerts.id)),
      db
        .select()
        .from(classPeriods)
        .where(and(eq(classPeriods.userId, uid), gt(classPeriods.end, now)))
        .orderBy(classPeriods.start),
    ]);
    return {
      profile: profiles[0] ?? null,
      classes,
      history: rows.slice(0, 30),
      ...summarize(rows, now, profiles[0]?.createdAt ?? now),
    };
  }),
  configure: protectedProcedure
    .input(settings)
    .mutation(async ({ ctx, input }) => {
      const db = await database();
      await db
        .insert(movementProfiles)
        .values({ userId: ctx.user.id, ...input })
        .onDuplicateKeyUpdate({ set: input });
    }),
  addClass: protectedProcedure
    .input(
      z
        .object({ start: z.date(), end: z.date() })
        .refine(
          v => v.end > v.start && v.end > new Date(),
          "종료 시각을 확인하세요."
        )
    )
    .mutation(async ({ ctx, input }) => {
      await (await database())
        .insert(classPeriods)
        .values({ userId: ctx.user.id, ...input });
    }),
  removeClass: protectedProcedure
    .input(identity)
    .mutation(async ({ ctx, input }) => {
      await (await database())
        .delete(classPeriods)
        .where(
          and(
            eq(classPeriods.userId, ctx.user.id),
            eq(classPeriods.id, input.id)
          )
        );
    }),
  evaluate: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await database();
    const uid = ctx.user.id;
    return db.transaction(async tx => {
      // Serialize decisions for this user across tabs and reconnects.
      const [profile] = await tx
        .select()
        .from(movementProfiles)
        .where(eq(movementProfiles.userId, uid))
        .for("update");
      if (!profile) return null;
      const now = new Date();
      const since = new Date(+now - interval);
      const [seat] = await tx
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.userId, uid),
            eq(timeEntries.type, "seat"),
            eq(timeEntries.status, "running")
          )
        )
        .orderBy(desc(timeEntries.id))
        .limit(1);
      const [lesson] = await tx
        .select()
        .from(classPeriods)
        .where(
          and(
            eq(classPeriods.userId, uid),
            lte(classPeriods.start, now),
            gt(classPeriods.end, now)
          )
        )
        .orderBy(desc(classPeriods.end))
        .limit(1);
      const [recent] = await tx
        .select({ id: alerts.id })
        .from(alerts)
        .where(and(eq(alerts.userId, uid), gt(alerts.shownAt, since)))
        .limit(1);
      const pending = await tx
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.userId, uid),
            isNull(alerts.response),
            or(
              eq(alerts.decision, "defer"),
              and(eq(alerts.decision, "send"), gte(alerts.decidedAt, since)),
              and(eq(alerts.decision, "send"), isNull(alerts.shownAt))
            )
          )
        )
        .orderBy(desc(alerts.id));
      const elapsed = seat?.runningStartedAt
        ? seat.elapsedSeconds * 1000 + (+now - +seat.runningStartedAt)
        : 0;
      const slot = Math.floor(elapsed / interval);
      const custom = recommend(
        profile.place,
        profile.situation,
        profile.preference
      );
      for (const row of pending) {
        if (row.shownAt) {
          if (seat?.id === row.seatId && !lesson && +row.shownAt > +since)
            return row;
          continue;
        }
        const active =
          seat?.id === row.seatId &&
          (row.decision === "defer" || row.decidedAt >= since);
        const decision = decide(active, lesson?.end, !!recent);
        const exercise = row.mode === "fixed" ? "ankle" : custom;
        if (
          decision.decision !== row.decision ||
          (lesson?.end.getTime() !== row.deferredUntil?.getTime() &&
            decision.decision === "defer") ||
          exercise !== row.exercise
        ) {
          await tx
            .update(alerts)
            .set({
              ...decision,
              exercise,
              decidedAt: now,
              deferredUntil: lesson?.end ?? row.deferredUntil,
            })
            .where(eq(alerts.id, row.id));
        }
        if (decision.decision === "send")
          return { ...row, ...decision, exercise };
        if (decision.decision === "defer") return null;
      }
      if (!seat || slot < 1) return null;
      const [existing] = await tx
        .select({ id: alerts.id })
        .from(alerts)
        .where(
          and(
            eq(alerts.userId, uid),
            eq(alerts.seatId, seat.id),
            eq(alerts.slot, slot)
          )
        );
      if (existing) return null;
      const mode = randomInt(2) ? "custom" : "fixed";
      const decision = decide(true, lesson?.end, !!recent);
      const exercise = mode === "custom" ? custom : "ankle";
      const [key] = await tx
        .insert(alerts)
        .values({
          userId: uid,
          seatId: seat.id,
          slot,
          mode,
          ...decision,
          exercise,
          createdAt: now,
          decidedAt: now,
          deferredUntil: lesson?.end,
        });
      if (decision.decision !== "send") return null;
      const [row] = await tx
        .select()
        .from(alerts)
        .where(eq(alerts.id, key.insertId));
      return row;
    });
  }),
  shown: protectedProcedure.input(identity).mutation(async ({ ctx, input }) => {
    await (
      await database()
    )
      .update(alerts)
      .set({ shownAt: new Date() })
      .where(
        and(
          eq(alerts.userId, ctx.user.id),
          eq(alerts.id, input.id),
          eq(alerts.decision, "send"),
          isNull(alerts.shownAt)
        )
      );
  }),
  respond: protectedProcedure
    .input(identity.extend({ response: z.enum(["done", "dismiss"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await database();
      const now = new Date();
      await db
        .update(alerts)
        .set({ response: input.response, respondedAt: now })
        .where(
          and(
            eq(alerts.id, input.id),
            eq(alerts.userId, ctx.user.id),
            eq(alerts.decision, "send"),
            isNull(alerts.response),
            gt(alerts.shownAt, new Date(+now - interval))
          )
        );
      const [row] = await db
        .select({ response: alerts.response })
        .from(alerts)
        .where(and(eq(alerts.id, input.id), eq(alerts.userId, ctx.user.id)));
      if (row?.response !== input.response)
        throw new TRPCError({
          code: "CONFLICT",
          message: "응답 시간이 지났거나 이미 처리한 알림이에요.",
        });
    }),
});
