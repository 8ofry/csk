import { describe, expect, it } from "vitest";
import {
  scoreCoach,
  scoreTrainee,
  shortlistCoaches,
  shortlistTrainees,
} from "@/domain/certificates/scoring";

describe("Best Trainee scoring — FR-CRT-02", () => {
  it("perfect attendance + perfect effort + 12+ sessions = ~100", () => {
    const s = scoreTrainee({
      traineeId: "t1",
      attendanceRate: 1,
      averageEffort: 10,
      sessionsCompleted: 12,
    });
    expect(s.score).toBe(100);
  });

  it("zero attendance → score driven only by effort + commitment", () => {
    const s = scoreTrainee({
      traineeId: "t1",
      attendanceRate: 0,
      averageEffort: 10,
      sessionsCompleted: 6,
    });
    expect(s.score).toBe(50); // 45 (effort) + 5 (commitment)
  });

  it("missing eval data → no effort credit", () => {
    const s = scoreTrainee({
      traineeId: "t1",
      attendanceRate: 1,
      averageEffort: null,
      sessionsCompleted: 12,
    });
    expect(s.score).toBe(55); // 45 attendance + 10 commitment
  });

  it("commitment saturates at 12 sessions", () => {
    const a = scoreTrainee({
      traineeId: "t1",
      attendanceRate: 1,
      averageEffort: 10,
      sessionsCompleted: 12,
    });
    const b = scoreTrainee({
      traineeId: "t2",
      attendanceRate: 1,
      averageEffort: 10,
      sessionsCompleted: 30,
    });
    expect(a.score).toBe(b.score);
  });

  it("clamps attendance rate above 1", () => {
    const s = scoreTrainee({
      traineeId: "t1",
      attendanceRate: 2,
      averageEffort: 10,
      sessionsCompleted: 12,
    });
    expect(s.score).toBe(100); // doesn't blow past 100
  });
});

describe("Best Trainee shortlist", () => {
  it("ranks by composite score, drops zero-session trainees", () => {
    const ranked = shortlistTrainees([
      { traineeId: "high", attendanceRate: 1, averageEffort: 9, sessionsCompleted: 10 },
      { traineeId: "low", attendanceRate: 0.4, averageEffort: 6, sessionsCompleted: 4 },
      { traineeId: "absent", attendanceRate: 0, averageEffort: null, sessionsCompleted: 0 },
    ]);
    expect(ranked.map((r) => r.traineeId)).toEqual(["high", "low"]);
  });

  it("limits to top N", () => {
    const inputs = Array.from({ length: 8 }).map((_, i) => ({
      traineeId: `t${i}`,
      attendanceRate: 1 - i * 0.1,
      averageEffort: 10 - i,
      sessionsCompleted: 12,
    }));
    const ranked = shortlistTrainees(inputs, 3);
    expect(ranked).toHaveLength(3);
    expect(ranked[0]?.traineeId).toBe("t0");
  });
});

describe("Best Coach scoring", () => {
  it("rewards sessions delivered + effort + report timeliness", () => {
    const c = scoreCoach({
      coachId: "c1",
      sessionsRun: 20,
      averageGroupEffort: 10,
      reportsApprovedFirstTry: 20,
      reportsTotal: 20,
    });
    expect(c.score).toBe(100);
  });

  it("zero sessions → drops out of shortlist", () => {
    const ranked = shortlistCoaches([
      { coachId: "active", sessionsRun: 5, averageGroupEffort: 8, reportsApprovedFirstTry: 5, reportsTotal: 5 },
      { coachId: "idle", sessionsRun: 0, averageGroupEffort: null, reportsApprovedFirstTry: 0, reportsTotal: 0 },
    ]);
    expect(ranked.map((r) => r.coachId)).toEqual(["active"]);
  });

  it("missing effort data still scores via sessions + reports", () => {
    const c = scoreCoach({
      coachId: "c1",
      sessionsRun: 10,
      averageGroupEffort: null,
      reportsApprovedFirstTry: 5,
      reportsTotal: 5,
    });
    // 30 * 0.5 (sessions) + 0 (effort) + 20 (reports) = 35
    expect(c.score).toBe(35);
  });
});
