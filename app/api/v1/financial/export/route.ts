// FR-FIN-12: financial transactions exportable to CSV/Excel.
// Admin-only.

import { auth } from "@/auth";
import { listPayments } from "@/application/payments/service";

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(req.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const revenueType = url.searchParams.get("revenueType") ?? undefined;

  const payments = await listPayments({
    from: fromStr ? new Date(fromStr) : undefined,
    to: toStr ? new Date(toStr) : undefined,
    revenueType,
  });

  const headers = [
    "paid_at",
    "receipt_number",
    "revenue_type",
    "method",
    "payer",
    "gross_egp",
    "net_egp",
    "split_csk",
    "split_venue",
    "split_coach",
    "split_other",
    "notes",
  ];
  const rows = [headers.join(",")];

  for (const p of payments) {
    const splits = p.splits.reduce(
      (acc, s) => {
        switch (s.recipientType) {
          case "CSK":
            acc.csk += Number(s.amount);
            break;
          case "VENUE":
            acc.venue += Number(s.amount);
            break;
          case "COACH":
            acc.coach += Number(s.amount);
            break;
          default:
            acc.other += Number(s.amount);
        }
        return acc;
      },
      { csk: 0, venue: 0, coach: 0, other: 0 },
    );
    rows.push(
      [
        p.paidAt.toISOString(),
        p.receiptNumber,
        p.revenueType,
        p.method,
        p.payerUser.fullNameEn,
        Number(p.amountGross).toFixed(2),
        Number(p.amountNet).toFixed(2),
        splits.csk.toFixed(2),
        splits.venue.toFixed(2),
        splits.coach.toFixed(2),
        splits.other.toFixed(2),
        csvEscape(p.notes ?? ""),
      ].join(","),
    );
  }

  return new Response(rows.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="csk-payments-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
