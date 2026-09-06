import { describe, expect, it } from "vitest";
import { pearsonCorrelation, secondsBetween } from "../shared/analytics";

describe("tracking analytics", () => {
  it("calculates elapsed time without allowing negative values", () => {
    expect(secondsBetween(new Date("2026-09-06T09:00:00Z"), new Date("2026-09-06T09:03:42Z"))).toBe(222);
    expect(secondsBetween(new Date("2026-09-06T10:00:00Z"), new Date("2026-09-06T09:00:00Z"))).toBe(0);
  });

  it("returns a correlation only when it is mathematically defined", () => {
    expect(pearsonCorrelation([{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }])).toBeCloseTo(1);
    expect(pearsonCorrelation([{ x: 3, y: 2 }, { x: 3, y: 6 }])).toBeNull();
    expect(pearsonCorrelation([{ x: 1, y: 2 }])).toBeNull();
  });
});
