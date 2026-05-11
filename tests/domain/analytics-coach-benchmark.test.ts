import { describe, expect, it } from "vitest";
import { rankCoaches, scoreCoachBenchmark } from "@/domain/analytics/coach-benchmark";

describe("Coach benchmark scoring", () => {
  it("perfect inputs = 100", () => {
    const r = scoreCoachBenchmark({
      coachId: "c1",
      fullNameEn: "Coach Perfect",
      sessionsDelivered: 30,
      uniqueTrainees: 10,
      retainedTrainees: 10,
      averageEffortScore: 10,
      reportsTotal: 12,
      reportsApprovedFirstTry: 12,
    });
    expect(r.score).toBe(100);
    expect(r.retentionRate).toBe(1);
    expect(r.reportTimelinessRate).toBe(1);
  });

  it("session count saturates", () => {
    const a = scoreCoachBenchmark({
      coachId: "a",
      fullNameEn: "A",
      sessionsDelivered: 30,
      uniqueTrainees: 5,
      retainedTrainees: 5,
      averageEffortScore: 10,
      reportsTotal: 10,
      reportsApprovedFirstTry: 10,
    });
    const b = scoreCoachBenchmark({
      coachId: "b",
      fullNameEn: "B",
      sessionsDelivered: 100,
      uniqueTrainees: 5,
      retainedTrainees: 5,
      averageEffortScore: 10,
      reportsTotal: 10,
      reportsApprovedFirstTry: 10,
    });
    expect(a.score).toBe(b.score);
  });

  it("zero report data → that bucket contributes 0", () => {
    const r = scoreCoachBenchmark({
      coachId: "c1",
      fullNameEn: "C",
      sessionsDelivered: 30,
      uniqueTrainees: 10,
      retainedTrainees: 10,
      averageEffortScore: 10,
      reportsTotal: 0,
      reportsApprovedFirstTry: 0,
    });
    // 30 (sessions) + 30 (retention) + 20 (effort) + 0 = 80
    expect(r.score).toBe(80);
  });

  it("missing avg effort → that bucket contributes 0", () => {
    const r = scoreCoachBenchmark({
      coachId: "c1",
      fullNameEn: "C",
      sessionsDelivered: 30,
      uniqueTrainees: 10,
      retainedTrainees: 10,
      averageEffortScore: null,
      reportsTotal: 10,
      reportsApprovedFirstTry: 10,
    });
    // 30 + 30 + 0 + 20 = 80
    expect(r.score).toBe(80);
  });

  it("rankCoaches drops zero-session coaches and sorts by score desc", () => {
    const ranked = rankCoaches([
      {
        coachId: "active",
        fullNameEn: "Active",
        sessionsDelivered: 10,
        uniqueTrainees: 5,
        retainedTrainees: 5,
        averageEffortScore: 8,
        reportsTotal: 5,
        reportsApprovedFirstTry: 5,
      },
      {
        coachId: "idle",
        fullNameEn: "Idle",
        sessionsDelivered: 0,
        uniqueTrainees: 0,
        retainedTrainees: 0,
        averageEffortScore: null,
        reportsTotal: 0,
        reportsApprovedFirstTry: 0,
      },
    ]);
    expect(ranked.map((r) => r.coachId)).toEqual(["active"]);
  });
});
