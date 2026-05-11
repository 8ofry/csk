import { describe, expect, it } from "vitest";
import { buildCohortReport, monthsBetween, monthKey } from "@/domain/analytics/cohorts";

describe("monthKey + monthsBetween", () => {
  it("formats Date → YYYY-MM zero-padded", () => {
    expect(monthKey(new Date(2026, 0, 15))).toBe("2026-01");
    expect(monthKey(new Date(2026, 11, 31))).toBe("2026-12");
  });
  it("monthsBetween counts inclusive month delta", () => {
    expect(monthsBetween("2026-05", "2026-01")).toBe(4);
    expect(monthsBetween("2027-01", "2026-12")).toBe(1);
    expect(monthsBetween("2026-05", "2026-05")).toBe(0);
  });
});

describe("buildCohortReport", () => {
  it("groups trainees by their join month", () => {
    const r = buildCohortReport([
      {
        traineeId: "a",
        joinedAt: new Date(2026, 0, 5),
        activeMonths: ["2026-01", "2026-02", "2026-03"],
      },
      {
        traineeId: "b",
        joinedAt: new Date(2026, 0, 10),
        activeMonths: ["2026-01", "2026-02"],
      },
      {
        traineeId: "c",
        joinedAt: new Date(2026, 1, 1), // different cohort
        activeMonths: ["2026-02", "2026-03"],
      },
    ]);
    expect(r.cohorts).toHaveLength(2);
    expect(r.cohorts[0]?.cohortKey).toBe("2026-01");
    expect(r.cohorts[0]?.cohortSize).toBe(2);
    expect(r.cohorts[1]?.cohortKey).toBe("2026-02");
    expect(r.cohorts[1]?.cohortSize).toBe(1);
  });

  it("computes retention correctly", () => {
    const r = buildCohortReport([
      { traineeId: "a", joinedAt: new Date(2026, 0, 1), activeMonths: ["2026-01", "2026-02"] },
      { traineeId: "b", joinedAt: new Date(2026, 0, 1), activeMonths: ["2026-01"] },
    ]);
    const cohort = r.cohorts[0]!;
    // M0 — both active = 100%
    expect(cohort.cells[0]?.retainedPct).toBe(1);
    // M1 — only A active = 50%
    expect(cohort.cells[1]?.retainedPct).toBe(0.5);
  });

  it("ignores active months earlier than the cohort itself", () => {
    const r = buildCohortReport([
      {
        traineeId: "a",
        joinedAt: new Date(2026, 5, 1),
        activeMonths: ["2026-01", "2026-06"],
      },
    ]);
    const cells = r.cohorts[0]!.cells;
    expect(cells[0]?.retainedPct).toBe(1); // only M0 from cohort onwards counts
    expect(cells.length).toBe(1);
  });

  it("respects an explicit maxOffset", () => {
    const r = buildCohortReport(
      [
        {
          traineeId: "a",
          joinedAt: new Date(2026, 0, 1),
          activeMonths: ["2026-01"],
        },
      ],
      { maxOffset: 5 },
    );
    expect(r.cohorts[0]!.cells.length).toBe(6);
    expect(r.cohorts[0]!.cells[5]?.retainedPct).toBe(0);
  });
});
