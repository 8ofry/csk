import { describe, expect, it } from "vitest";
import {
  effortTrend,
  monthRange,
  summarize,
  summarizeAttendance,
} from "@/domain/monthly-reports/aggregate";

describe("monthly aggregation — FR-MR-02", () => {
  describe("summarizeAttendance", () => {
    it("counts each status and computes attended rate (present+late)", () => {
      const rows = [
        { status: "PRESENT" as const },
        { status: "PRESENT" as const },
        { status: "LATE" as const },
        { status: "ABSENT" as const },
        { status: "EXCUSED" as const },
      ];
      const summary = summarizeAttendance(rows);
      expect(summary.total).toBe(5);
      expect(summary.present).toBe(2);
      expect(summary.late).toBe(1);
      expect(summary.absent).toBe(1);
      expect(summary.excused).toBe(1);
      expect(summary.rate).toBeCloseTo(0.6, 5); // (2+1)/5
    });

    it("handles empty input", () => {
      const summary = summarizeAttendance([]);
      expect(summary.total).toBe(0);
      expect(summary.rate).toBe(0);
    });
  });

  describe("effortTrend", () => {
    it("buckets by date and averages effort, sorted ascending", () => {
      const rows = [
        { effortScore: 6, createdAt: new Date(2026, 4, 5, 18) },
        { effortScore: 8, createdAt: new Date(2026, 4, 5, 20) },
        { effortScore: 7, createdAt: new Date(2026, 4, 6, 19) },
      ];
      const trend = effortTrend(rows);
      expect(trend).toHaveLength(2);
      expect(trend[0]?.averageEffort).toBe(7); // (6+8)/2
      expect(trend[0]?.count).toBe(2);
      expect(trend[1]?.averageEffort).toBe(7);
      expect(trend[1]?.count).toBe(1);
    });
  });

  describe("summarize end-to-end", () => {
    it("returns averageEffort = null when no quick evals", () => {
      const result = summarize([], []);
      expect(result.averageEffort).toBeNull();
    });

    it("computes averageEffort across all evals", () => {
      const result = summarize(
        [{ status: "PRESENT" as const }],
        [
          { effortScore: 5, createdAt: new Date(2026, 4, 5) },
          { effortScore: 9, createdAt: new Date(2026, 4, 6) },
        ],
      );
      expect(result.averageEffort).toBe(7);
    });
  });

  describe("monthRange", () => {
    it("returns inclusive start and exclusive end (in local TZ)", () => {
      const { start, end } = monthRange(2026, 5);
      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(4); // 0-indexed: May
      expect(start.getDate()).toBe(1);
      expect(end.getFullYear()).toBe(2026);
      expect(end.getMonth()).toBe(5); // June
      expect(end.getDate()).toBe(1);
    });
    it("handles December boundary (rolls year)", () => {
      const { end } = monthRange(2026, 12);
      expect(end.getFullYear()).toBe(2027);
      expect(end.getMonth()).toBe(0); // January
      expect(end.getDate()).toBe(1);
    });
  });
});
