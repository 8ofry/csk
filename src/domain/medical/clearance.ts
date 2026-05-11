// Medical clearance — pure logic.
// FR-MED-02..04: docs have issue + expiry; renewed annually; expired/missing docs
// block championship registration (FR-CH-04).
//
// "Required docs" for championship eligibility (per SRS §6.11): clearance is
// the bare minimum. ECG / blood / vision are uploaded but not all gate
// championships — keep them as soft requirements until Captain Saied
// finalizes the list.

export type MedicalDocType = "CLEARANCE" | "ECG" | "BLOOD" | "VISION" | "OTHER";

export interface MedicalDoc {
  id: string;
  documentType: MedicalDocType;
  expiryDate: Date;
  status: "ACTIVE" | "EXPIRED";
}

export const REQUIRED_FOR_CHAMPIONSHIP: MedicalDocType[] = ["CLEARANCE"];

export interface ClearanceCheck {
  cleared: boolean;
  /** Doc types that are missing (no row at all). */
  missing: MedicalDocType[];
  /** Doc IDs that have expired. */
  expired: string[];
  /** Latest expiry per required doc type, if any. */
  latestExpiryByType: Partial<Record<MedicalDocType, Date>>;
}

export function evaluateClearance(docs: MedicalDoc[], now: Date = new Date()): ClearanceCheck {
  const latest: Partial<Record<MedicalDocType, MedicalDoc>> = {};
  for (const d of docs) {
    const cur = latest[d.documentType];
    if (!cur || d.expiryDate > cur.expiryDate) {
      latest[d.documentType] = d;
    }
  }

  const missing: MedicalDocType[] = [];
  const expired: string[] = [];
  const latestExpiryByType: Partial<Record<MedicalDocType, Date>> = {};

  for (const t of REQUIRED_FOR_CHAMPIONSHIP) {
    const d = latest[t];
    if (!d) {
      missing.push(t);
      continue;
    }
    latestExpiryByType[t] = d.expiryDate;
    if (d.expiryDate <= now) expired.push(d.id);
  }

  return {
    cleared: missing.length === 0 && expired.length === 0,
    missing,
    expired,
    latestExpiryByType,
  };
}

/** Days until expiry; negative if already expired. */
export function daysUntilExpiry(expiryDate: Date, now: Date = new Date()): number {
  const ms = expiryDate.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

/** SRS FR-MED-03: alert windows are 30 / 14 / 7 days. */
export const ALERT_WINDOWS_DAYS = [30, 14, 7] as const;

export function alertWindowFor(daysLeft: number): (typeof ALERT_WINDOWS_DAYS)[number] | null {
  // Hits the window only on the exact day boundary so a daily job fires once per window.
  for (const w of ALERT_WINDOWS_DAYS) {
    if (daysLeft === w) return w;
  }
  return null;
}
