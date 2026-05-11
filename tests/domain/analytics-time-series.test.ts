import { describe, expect, it } from "vitest";
import {
  densify,
  lastNMonths,
  monthlyTotals,
  monthlyTotalsBySlice,
} from "@/domain/analytics/time-series";

describe("monthlyTotals", () => {
  it("buckets by month, ascending", () => {
    const res = monthlyTotals([
      { date: new Date(2026, 0, 5), amount: 100 },
      { date: new Date(2026, 0, 25), amount: 200 },
      { date: new Date(2026, 1, 1), amount: 50 },
    ]);
    expect(res).toEqual([
      { monthKey: "2026-01", total: 300, count: 2 },
      { monthKey: "2026-02", total: 50, count: 1 },
    ]);
  });
});

describe("monthlyTotalsBySlice", () => {
  it("preserves slice keys + sorts by month then slice", () => {
    const res = monthlyTotalsBySlice([
      { date: new Date(2026, 0, 1), amount: 100, sliceKey: "SUBSCRIPTION" },
      { date: new Date(2026, 0, 1), amount: 50, sliceKey: "MERCHANDISE" },
      { date: new Date(2026, 1, 1), amount: 200, sliceKey: "SUBSCRIPTION" },
    ]);
    expect(res[0]?.monthKey).toBe("2026-01");
    expect(res[0]?.sliceKey).toBe("MERCHANDISE");
    expect(res[1]?.sliceKey).toBe("SUBSCRIPTION");
    expect(res[2]?.monthKey).toBe("2026-02");
  });
});

describe("lastNMonths", () => {
  it("returns N months ending at the given date, oldest first", () => {
    const months = lastNMonths(3, new Date(2026, 4, 15));
    expect(months).toEqual(["2026-03", "2026-04", "2026-05"]);
  });

  it("rolls back across year boundaries", () => {
    const months = lastNMonths(4, new Date(2026, 1, 1));
    expect(months).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});

describe("densify", () => {
  it("backfills missing months with zeros", () => {
    const out = densify(
      [{ monthKey: "2026-01", total: 100, count: 1 }],
      ["2026-01", "2026-02", "2026-03"],
    );
    expect(out).toEqual([
      { monthKey: "2026-01", total: 100, count: 1 },
      { monthKey: "2026-02", total: 0, count: 0 },
      { monthKey: "2026-03", total: 0, count: 0 },
    ]);
  });
});
