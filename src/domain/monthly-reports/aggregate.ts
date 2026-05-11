// Pure aggregation logic for monthly performance reports (FR-MR-02).
// Inputs come from the persistence layer; output is what the report PDF + UI render.

export interface AttendanceRow {
  status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";
}

export interface QuickEvalRow {
  effortScore: number;
  createdAt: Date;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  /** Attended = present + late, divided by total (0..1). */
  rate: number;
}

export interface EffortTrendPoint {
  date: string; // YYYY-MM-DD
  averageEffort: number; // 1..10
  count: number;
}

export interface MonthlySummary {
  attendance: AttendanceSummary;
  effortTrend: EffortTrendPoint[];
  averageEffort: number | null;
}

export function summarizeAttendance(rows: AttendanceRow[]): AttendanceSummary {
  const total = rows.length;
  const present = rows.filter((r) => r.status === "PRESENT").length;
  const late = rows.filter((r) => r.status === "LATE").length;
  const absent = rows.filter((r) => r.status === "ABSENT").length;
  const excused = rows.filter((r) => r.status === "EXCUSED").length;
  const attended = present + late;
  const rate = total === 0 ? 0 : attended / total;
  return { total, present, late, absent, excused, rate };
}

export function effortTrend(rows: QuickEvalRow[]): EffortTrendPoint[] {
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const key = isoDate(r.createdAt);
    const b = buckets.get(key) ?? { sum: 0, count: 0 };
    b.sum += r.effortScore;
    b.count += 1;
    buckets.set(key, b);
  }
  return [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, { sum, count }]) => ({
      date,
      averageEffort: round2(sum / count),
      count,
    }));
}

export function summarize(
  attendances: AttendanceRow[],
  quickEvals: QuickEvalRow[],
): MonthlySummary {
  const attendance = summarizeAttendance(attendances);
  const trend = effortTrend(quickEvals);
  const totalEvals = quickEvals.length;
  const averageEffort =
    totalEvals === 0
      ? null
      : round2(quickEvals.reduce((s, r) => s + r.effortScore, 0) / totalEvals);
  return { attendance, effortTrend: trend, averageEffort };
}

/** Returns [start, exclusiveEnd] for the calendar month containing the given date. */
export function monthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

function isoDate(d: Date): string {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
