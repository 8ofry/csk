import { describe, expect, it } from "vitest";
import {
  ALERT_WINDOWS_DAYS,
  alertWindowFor,
  daysUntilExpiry,
  evaluateClearance,
  type MedicalDoc,
} from "@/domain/medical/clearance";

const NOW = new Date(2026, 4, 11);

function doc(
  partial: Partial<MedicalDoc> & { documentType: MedicalDoc["documentType"]; expiryDate: Date },
): MedicalDoc {
  return {
    id: partial.id ?? `doc-${Math.random()}`,
    status: "ACTIVE",
    ...partial,
  };
}

describe("medical clearance — FR-MED + FR-CH-04", () => {
  it("not cleared when no documents", () => {
    expect(evaluateClearance([], NOW).cleared).toBe(false);
  });

  it("cleared when CLEARANCE active and not expired", () => {
    const c = evaluateClearance(
      [doc({ documentType: "CLEARANCE", expiryDate: new Date(2027, 0, 1) })],
      NOW,
    );
    expect(c.cleared).toBe(true);
    expect(c.missing).toHaveLength(0);
    expect(c.expired).toHaveLength(0);
  });

  it("not cleared when CLEARANCE expired", () => {
    const c = evaluateClearance(
      [doc({ documentType: "CLEARANCE", expiryDate: new Date(2026, 3, 1) })],
      NOW,
    );
    expect(c.cleared).toBe(false);
    expect(c.expired.length).toBeGreaterThan(0);
  });

  it("uses the latest CLEARANCE expiry when multiple exist", () => {
    const c = evaluateClearance(
      [
        doc({ documentType: "CLEARANCE", expiryDate: new Date(2026, 3, 1) }), // expired
        doc({ documentType: "CLEARANCE", expiryDate: new Date(2027, 0, 1) }), // valid
      ],
      NOW,
    );
    expect(c.cleared).toBe(true);
  });

  it("ECG/BLOOD/VISION are not gating in v1", () => {
    const c = evaluateClearance(
      [
        doc({ documentType: "CLEARANCE", expiryDate: new Date(2027, 0, 1) }),
        doc({ documentType: "ECG", expiryDate: new Date(2026, 3, 1) }), // expired but not gating
      ],
      NOW,
    );
    expect(c.cleared).toBe(true);
  });
});

describe("daysUntilExpiry & alert windows — FR-MED-03", () => {
  it("counts days correctly", () => {
    const expiry = new Date(NOW.getTime() + 10 * 24 * 60 * 60 * 1000);
    expect(daysUntilExpiry(expiry, NOW)).toBe(10);
  });

  it("negative when expired", () => {
    const expiry = new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000);
    expect(daysUntilExpiry(expiry, NOW)).toBeLessThan(0);
  });

  it("alertWindowFor matches only on the exact 30/14/7 day boundary", () => {
    expect(alertWindowFor(30)).toBe(30);
    expect(alertWindowFor(14)).toBe(14);
    expect(alertWindowFor(7)).toBe(7);
    expect(alertWindowFor(15)).toBeNull();
    expect(alertWindowFor(0)).toBeNull();
    expect(alertWindowFor(-1)).toBeNull();
  });

  it("ALERT_WINDOWS_DAYS matches SRS spec", () => {
    expect(ALERT_WINDOWS_DAYS).toEqual([30, 14, 7]);
  });
});
