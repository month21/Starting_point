import { describe, it, expect } from "vitest";
import { decide, recommend, summarize, day } from "../shared/movement";

describe("movement coaching", () => {
  const now = new Date("2026-11-24T15:05:00Z");
  it("rechecks deferred opportunities against seat state and cooldown", () => {
    expect(decide(true, now, false).decision).toBe("defer");
    expect(decide(true, undefined, false).decision).toBe("send");
    expect(decide(false, undefined, false).decision).toBe("skip");
    expect(decide(true, undefined, true).decision).toBe("skip");
  });
  it("filters exercises by setting before honoring preference", () => {
    expect(recommend("hall", "quiet", "walk")).toBe("ankle");
    expect(recommend("desk", "free", "walk")).toBe("stretch");
    expect(recommend("hall", "free", "walk")).toBe("walk");
  });
  it("uses previous Korean dates for goals and actual impressions for rates", () => {
    const yesterday = new Date(+now - 600000);
    const r = {
      shownAt: yesterday,
      respondedAt: now,
      response: "done",
      mode: "custom",
      exercise: "walk",
    } as const;
    const rows = [
      r,
      { ...r, response: null, respondedAt: null },
      { ...r, shownAt: null, response: null },
      { ...r, respondedAt: yesterday },
    ];
    const report = summarize(rows, now, new Date(+now - 7 * day));
    expect(report.goal).toBe(2);
    expect(report.count).toBe(1);
    expect(report.score).toBe(50);
    expect(report.groups.mode["맞춤"]).toEqual({ sent: 3, done: 2 });
    expect(summarize(rows, now, yesterday).goal).toBe(8);
  });
});
