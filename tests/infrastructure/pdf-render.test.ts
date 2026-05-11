// PDF render smoke tests — confirms react-pdf wiring renders to a non-empty
// PDF buffer. We don't try to parse the PDF here; we check the magic header
// and minimum size to catch obvious template breakage.

import { describe, expect, it } from "vitest";
import { pdfGenerator } from "@/infrastructure/pdf/pdf";

const PDF_HEADER = Buffer.from("%PDF-");

describe("PDF generator — react-pdf templates", () => {
  it("monthly report renders to a PDF buffer", async () => {
    const buffer = await pdfGenerator.monthlyReport({
      traineeName: "Trainee Ahmed",
      groupName: "Boxing — Beginners (Mon/Wed)",
      periodLabel: "May 2026",
      attendance: {
        total: 8,
        present: 6,
        late: 1,
        absent: 1,
        excused: 0,
        rate: 0.875,
      },
      averageEffort: 8.4,
      narrative: "Solid month. Sharp footwork, jab-cross consistency improving.",
      milestones: [
        { type: "belt", label: "Boxing belt promoted to A", date: "2026-05-04" },
        { type: "championship", label: "Confirmed for Egyptian MMA Cup", date: "2026-05-07" },
      ],
    });
    expect(buffer.byteLength).toBeGreaterThan(1024);
    expect(buffer.subarray(0, 5).equals(PDF_HEADER)).toBe(true);
  });

  it("monthly report handles empty milestones + null effort", async () => {
    const buffer = await pdfGenerator.monthlyReport({
      traineeName: "Trainee Layla",
      groupName: "Karate — Kihon",
      periodLabel: "May 2026",
      attendance: { total: 4, present: 3, late: 0, absent: 1, excused: 0, rate: 0.75 },
      averageEffort: null,
      milestones: [],
    });
    expect(buffer.byteLength).toBeGreaterThan(1024);
    expect(buffer.subarray(0, 5).equals(PDF_HEADER)).toBe(true);
  });

  it("certificate renders to a PDF buffer", async () => {
    const buffer = await pdfGenerator.certificate({
      recipientName: "Trainee Ahmed",
      awardTitle: "Best Trainee — Group",
      narrative: "100% attendance with avg effort 9.2/10 across 12 sessions.",
      periodLabel: "May 2026",
      issuedByName: "Captain Saied",
      issuedDate: "11 May 2026",
    });
    expect(buffer.byteLength).toBeGreaterThan(1024);
    expect(buffer.subarray(0, 5).equals(PDF_HEADER)).toBe(true);
  });
});
