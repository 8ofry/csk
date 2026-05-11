// PDF generator interface (NFR-MNT-02). v1 shipped a stub URL; phase 2 wires
// real react-pdf with Tajawal Arabic + CSK black/gold branding. The generator
// only renders to a Buffer — the storage adapter handles persistence so we can
// swap S3/R2 in production without touching the renderer.

export interface MonthlyReportPdfInput {
  traineeName: string;
  groupName: string;
  periodLabel: string; // e.g. "May 2026"
  attendance: { total: number; present: number; late: number; absent: number; excused: number; rate: number };
  averageEffort: number | null;
  narrative?: string;
  milestones: { type: string; label: string; date: string }[];
  bodyMapSnapshot?: Record<string, { score: number; comment?: string }>;
  skillSnapshot?: Record<string, { score: number; comment?: string }>;
}

export interface CertificatePdfInput {
  recipientName: string;
  awardTitle: string;
  narrative: string;
  periodLabel: string;
  issuedByName: string;
  issuedDate: string;
}

export interface PdfGenerator {
  monthlyReport(input: MonthlyReportPdfInput): Promise<Buffer>;
  certificate(input: CertificatePdfInput): Promise<Buffer>;
}

// Dynamic import keeps the heavy react-pdf bundle off the page-render path —
// only loaded when something actually needs to generate a PDF.
class ReactPdfGenerator implements PdfGenerator {
  async monthlyReport(input: MonthlyReportPdfInput): Promise<Buffer> {
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { MonthlyReportDocument } = await import("./monthly-report-template");
    return renderToBuffer(MonthlyReportDocument(input));
  }

  async certificate(input: CertificatePdfInput): Promise<Buffer> {
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { CertificateDocument } = await import("./certificate-template");
    return renderToBuffer(CertificateDocument(input));
  }
}

export const pdfGenerator: PdfGenerator = new ReactPdfGenerator();
