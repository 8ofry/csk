import { describe, expect, it } from "vitest";
import {
  deriveStatus,
  nextPeriodAfter,
  periodForMonth,
} from "@/domain/financial/subscription-period";

describe("subscription period + status — FR-FIN-02", () => {
  it("PAID when amount paid covers fee", () => {
    expect(
      deriveStatus({
        monthlyFee: 1000,
        amountPaidInPeriod: 1000,
        periodEnd: new Date(2026, 4, 31),
        now: new Date(2026, 4, 10),
      }),
    ).toBe("PAID");
  });

  it("PARTIAL when amount paid is positive but below fee", () => {
    expect(
      deriveStatus({
        monthlyFee: 1000,
        amountPaidInPeriod: 400,
        periodEnd: new Date(2026, 4, 31),
        now: new Date(2026, 4, 10),
      }),
    ).toBe("PARTIAL");
  });

  it("DUE when nothing paid and period still open", () => {
    expect(
      deriveStatus({
        monthlyFee: 1000,
        amountPaidInPeriod: 0,
        periodEnd: new Date(2026, 4, 31),
        now: new Date(2026, 4, 10),
      }),
    ).toBe("DUE");
  });

  it("OVERDUE when nothing paid and now > period end", () => {
    expect(
      deriveStatus({
        monthlyFee: 1000,
        amountPaidInPeriod: 0,
        periodEnd: new Date(2026, 4, 31),
        now: new Date(2026, 5, 5),
      }),
    ).toBe("OVERDUE");
  });

  it("respects grace period before flipping to OVERDUE", () => {
    expect(
      deriveStatus({
        monthlyFee: 1000,
        amountPaidInPeriod: 0,
        periodEnd: new Date(2026, 4, 31),
        graceDays: 7,
        now: new Date(2026, 5, 5),
      }),
    ).toBe("DUE");
  });

  it("periodForMonth covers the whole calendar month", () => {
    const { start, end } = periodForMonth(2026, 5);
    expect(start.getMonth()).toBe(4); // May (0-indexed)
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(4); // last day still May
    expect(end.getDate()).toBe(31);
  });

  it("nextPeriodAfter rolls into the next month", () => {
    const { start, end } = nextPeriodAfter(new Date(2026, 4, 31, 23, 59, 59));
    expect(start.getMonth()).toBe(5); // June
    expect(start.getDate()).toBe(1);
    expect(end.getDate()).toBe(30); // June has 30 days
  });
});
