import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  createTimeEntry: vi.fn(),
  getTimeEntryForUser: vi.fn(),
  listStepEntries: vi.fn(),
  listTimeEntries: vi.fn(),
  updateTimeEntry: vi.fn(),
  upsertStepEntry: vi.fn(),
}));

import * as db from "./db";
import { appRouter } from "./routers";

const user = {
  id: 7,
  openId: "rhythm-user",
  name: "Rhythm User",
  email: "rhythm@example.com",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date("2026-09-01T00:00:00Z"),
  updatedAt: new Date("2026-09-01T00:00:00Z"),
  lastSignedIn: new Date("2026-09-06T00:00:00Z"),
};

const ctx = { user, req: {}, res: {} } as unknown as TrpcContext;

describe("tracking router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.listTimeEntries).mockResolvedValue([]);
    vi.mocked(db.listStepEntries).mockResolvedValue([]);
  });

  it("starts a labeled focus timer under the signed-in user", async () => {
    vi.mocked(db.createTimeEntry).mockResolvedValue({ id: 31 } as never);
    const caller = appRouter.createCaller(ctx);

    await caller.tracking.start({ type: "focus", label: "논문 읽기" });

    expect(db.listTimeEntries).toHaveBeenCalledWith(user.id);
    expect(db.createTimeEntry).toHaveBeenCalledWith(expect.objectContaining({
      userId: user.id,
      type: "focus",
      label: "논문 읽기",
      elapsedSeconds: 0,
      status: "running",
    }));
  });

  it("pauses an owned seat timer and accumulates elapsed time", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-06T10:30:00Z"));
    vi.mocked(db.getTimeEntryForUser).mockResolvedValue({
      id: 21,
      userId: user.id,
      type: "seat",
      label: "좌석 기록",
      startedAt: new Date("2026-09-06T10:00:00Z"),
      runningStartedAt: new Date("2026-09-06T10:10:00Z"),
      elapsedSeconds: 300,
      status: "running",
    } as never);
    vi.mocked(db.updateTimeEntry).mockResolvedValue({ id: 21 } as never);
    const caller = appRouter.createCaller(ctx);

    await caller.tracking.pause({ id: 21 });

    expect(db.updateTimeEntry).toHaveBeenCalledWith(user.id, 21, expect.objectContaining({
      elapsedSeconds: 1500,
      runningStartedAt: null,
      status: "paused",
    }));
    vi.useRealTimers();
  });

  it("updates only the current user's completed calendar record", async () => {
    vi.mocked(db.getTimeEntryForUser).mockResolvedValue({
      id: 44,
      userId: user.id,
      type: "focus",
      label: "기존 라벨",
      startedAt: new Date("2026-09-06T08:00:00Z"),
      endedAt: new Date("2026-09-06T09:00:00Z"),
      runningStartedAt: null,
      elapsedSeconds: 3600,
      status: "completed",
    } as never);
    vi.mocked(db.updateTimeEntry).mockResolvedValue({ id: 44 } as never);
    const caller = appRouter.createCaller(ctx);

    await caller.tracking.updatePlacement({
      id: 44,
      label: "오전 집중",
      startedAtMs: new Date("2026-09-06T11:00:00Z").getTime(),
      endedAtMs: new Date("2026-09-06T12:30:00Z").getTime(),
    });

    expect(db.getTimeEntryForUser).toHaveBeenCalledWith(user.id, 44);
    expect(db.updateTimeEntry).toHaveBeenCalledWith(user.id, 44, expect.objectContaining({
      label: "오전 집중",
      elapsedSeconds: 5400,
    }));
  });

  it("finishes a running seat timer with its final elapsed time", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-06T11:00:00Z"));
    vi.mocked(db.getTimeEntryForUser).mockResolvedValue({
      id: 52,
      userId: user.id,
      type: "seat",
      label: "좌석 기록",
      startedAt: new Date("2026-09-06T10:00:00Z"),
      runningStartedAt: new Date("2026-09-06T10:20:00Z"),
      elapsedSeconds: 600,
      status: "running",
    } as never);
    vi.mocked(db.updateTimeEntry).mockResolvedValue({ id: 52 } as never);
    const caller = appRouter.createCaller(ctx);

    await caller.tracking.finish({ id: 52 });

    expect(db.updateTimeEntry).toHaveBeenCalledWith(user.id, 52, expect.objectContaining({
      elapsedSeconds: 3000,
      runningStartedAt: null,
      status: "completed",
    }));
    vi.useRealTimers();
  });

  it("stores manual steps and imports a bounded set of daily step entries", async () => {
    const caller = appRouter.createCaller(ctx);

    await caller.tracking.steps.upsert({ dateKey: "2026-09-06", steps: 6420 });
    await caller.tracking.steps.import([
      { dateKey: "2026-09-04", steps: 4200 },
      { dateKey: "2026-09-05", steps: 7310 },
    ]);

    expect(db.upsertStepEntry).toHaveBeenNthCalledWith(1, {
      userId: user.id,
      dateKey: "2026-09-06",
      steps: 6420,
      source: "manual",
    });
    expect(db.upsertStepEntry).toHaveBeenNthCalledWith(2, {
      userId: user.id,
      dateKey: "2026-09-04",
      steps: 4200,
      source: "import",
    });
    expect(db.upsertStepEntry).toHaveBeenNthCalledWith(3, {
      userId: user.id,
      dateKey: "2026-09-05",
      steps: 7310,
      source: "import",
    });
  });

  it("rejects invalid step input before attempting storage", async () => {
    const caller = appRouter.createCaller(ctx);

    await expect(caller.tracking.steps.upsert({ dateKey: "2026-09-06", steps: -1 })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(db.upsertStepEntry).not.toHaveBeenCalled();
  });

  it("rejects empty and out-of-range imported step data before storage", async () => {
    const caller = appRouter.createCaller(ctx);

    await expect(caller.tracking.steps.import([])).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.tracking.steps.import([{ dateKey: "2026-09-06", steps: 200001 }])).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(db.upsertStepEntry).not.toHaveBeenCalled();
  });

  it("rejects finishing a timer that does not belong to the signed-in user", async () => {
    vi.mocked(db.getTimeEntryForUser).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.tracking.finish({ id: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.updateTimeEntry).not.toHaveBeenCalled();
  });

  it("returns an already completed timer without changing its stored record", async () => {
    const completedEntry = {
      id: 72,
      userId: user.id,
      type: "focus" as const,
      label: "완료된 세션",
      startedAt: new Date("2026-09-06T08:00:00Z"),
      endedAt: new Date("2026-09-06T09:00:00Z"),
      runningStartedAt: null,
      elapsedSeconds: 3600,
      status: "completed" as const,
    };
    vi.mocked(db.getTimeEntryForUser).mockResolvedValue(completedEntry as never);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.tracking.finish({ id: 72 })).resolves.toEqual(completedEntry);
    expect(db.updateTimeEntry).not.toHaveBeenCalled();
  });
});
