// Cohort retention heatmap — triangular table where each row is a join-month
// cohort and each column is months-after-join. Color intensity tracks retention.

import type { CohortReport } from "@/domain/analytics/cohorts";

const GOLD = [
  "#FAF1D5", // 0–10%
  "#F0E0A8", // 10–25
  "#E5CB7A", // 25–40
  "#DAB54D", // 40–55
  "#D4AF37", // 55–70
  "#B89324", // 70–85
  "#8C6F1B", // 85–100
];

function cellFill(pct: number): string {
  if (pct <= 0) return "transparent";
  const idx = Math.min(GOLD.length - 1, Math.floor(pct * GOLD.length));
  return GOLD[idx]!;
}

export function CohortHeatmap({ report }: { report: CohortReport }) {
  if (report.cohorts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Not enough cohort data yet — comes online once trainees have multiple months.
      </p>
    );
  }
  const offsets = Array.from({ length: report.maxOffset + 1 }, (_, i) => i);
  return (
    <div className="overflow-x-auto">
      <table className="text-xs">
        <thead>
          <tr>
            <th className="px-2 py-1 text-start text-muted-foreground">Cohort</th>
            <th className="px-2 py-1 text-end text-muted-foreground">Size</th>
            {offsets.map((o) => (
              <th key={o} className="px-1 py-1 text-center text-muted-foreground">
                M{o}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.cohorts.map((c) => (
            <tr key={c.cohortKey}>
              <td className="px-2 py-1 font-medium">{c.cohortKey}</td>
              <td className="px-2 py-1 text-end">{c.cohortSize}</td>
              {offsets.map((o) => {
                const cell = c.cells[o];
                if (!cell || cell.activeCount === 0) {
                  return <td key={o} className="px-1 py-1" />;
                }
                const pct = Math.round(cell.retainedPct * 100);
                const isHeader = o === 0;
                return (
                  <td
                    key={o}
                    title={`${c.cohortKey} → +${o} mo · ${cell.activeCount}/${c.cohortSize} (${pct}%)`}
                    className="px-1 py-1 text-center"
                    style={{
                      backgroundColor: cellFill(cell.retainedPct),
                      color: pct > 50 ? "#0A0A0A" : undefined,
                      fontWeight: isHeader ? 600 : 400,
                    }}
                  >
                    {pct}%
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
