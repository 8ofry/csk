import { describe, expect, it } from "vitest";
import { buildLtvReport } from "@/domain/analytics/ltv";

describe("LTV report", () => {
  it("aggregates payments per trainee", () => {
    const r = buildLtvReport([
      {
        traineeId: "a",
        amountNet: 1000,
        paidAt: new Date(2026, 0, 1),
        cohortKey: "2026-01",
        disciplineKey: "Boxing",
      },
      {
        traineeId: "a",
        amountNet: 1000,
        paidAt: new Date(2026, 1, 1),
        cohortKey: "2026-01",
        disciplineKey: "Boxing",
      },
    ]);
    const t = r.perTrainee.find((x) => x.traineeId === "a")!;
    expect(t.totalNet).toBe(2000);
    expect(t.monthsActive).toBe(2);
    expect(t.ltvPerMonth).toBe(1000);
  });

  it("groups per cohort + averages", () => {
    const r = buildLtvReport([
      { traineeId: "a", amountNet: 100, paidAt: new Date(2026, 0, 1), cohortKey: "2026-01" },
      { traineeId: "b", amountNet: 300, paidAt: new Date(2026, 0, 1), cohortKey: "2026-01" },
      { traineeId: "c", amountNet: 50, paidAt: new Date(2026, 1, 1), cohortKey: "2026-02" },
    ]);
    const jan = r.perCohort.find((c) => c.cohortKey === "2026-01")!;
    expect(jan.trainees).toBe(2);
    expect(jan.totalNet).toBe(400);
    expect(jan.averageLtv).toBe(200);
    const feb = r.perCohort.find((c) => c.cohortKey === "2026-02")!;
    expect(feb.averageLtv).toBe(50);
  });

  it("groups per discipline + sorts by total revenue desc", () => {
    const r = buildLtvReport([
      { traineeId: "a", amountNet: 100, paidAt: new Date(), cohortKey: "x", disciplineKey: "Karate" },
      { traineeId: "b", amountNet: 500, paidAt: new Date(), cohortKey: "x", disciplineKey: "Boxing" },
      { traineeId: "c", amountNet: 200, paidAt: new Date(), cohortKey: "x", disciplineKey: "Boxing" },
    ]);
    expect(r.perDiscipline[0]?.disciplineKey).toBe("Boxing");
    expect(r.perDiscipline[0]?.trainees).toBe(2);
    expect(r.perDiscipline[0]?.totalNet).toBe(700);
    expect(r.perDiscipline[1]?.disciplineKey).toBe("Karate");
  });

  it("globalAverageLtv = mean of trainee totals", () => {
    const r = buildLtvReport([
      { traineeId: "a", amountNet: 100, paidAt: new Date(), cohortKey: "x" },
      { traineeId: "b", amountNet: 300, paidAt: new Date(), cohortKey: "x" },
    ]);
    expect(r.globalAverageLtv).toBe(200);
  });

  it("zero rows → zero global LTV", () => {
    expect(buildLtvReport([]).globalAverageLtv).toBe(0);
  });
});
