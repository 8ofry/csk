// Monthly time-series helpers — pure logic.
// Bucket payments + attendance into month-keys and surface trends.

export interface TimedAmount {
  date: Date;
  amount: number;
  /** Optional slice key — discipline / location / revenue type. */
  sliceKey?: string;
}

export interface MonthlyBucket {
  monthKey: string;
  total: number;
  count: number;
}

export interface MonthlySeriesBySlice {
  /** "All" if no slice was supplied. */
  sliceKey: string;
  monthKey: string;
  total: number;
  count: number;
}

function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthlyTotals(rows: TimedAmount[]): MonthlyBucket[] {
  const buckets = new Map<string, { total: number; count: number }>();
  for (const r of rows) {
    const k = monthKey(r.date);
    const cur = buckets.get(k) ?? { total: 0, count: 0 };
    cur.total += r.amount;
    cur.count += 1;
    buckets.set(k, cur);
  }
  return [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([k, v]) => ({ monthKey: k, total: round2(v.total), count: v.count }));
}

export function monthlyTotalsBySlice(rows: TimedAmount[]): MonthlySeriesBySlice[] {
  const buckets = new Map<string, Map<string, { total: number; count: number }>>();
  for (const r of rows) {
    const slice = r.sliceKey ?? "All";
    const k = monthKey(r.date);
    const sliceMap = buckets.get(slice) ?? new Map<string, { total: number; count: number }>();
    const cur = sliceMap.get(k) ?? { total: 0, count: 0 };
    cur.total += r.amount;
    cur.count += 1;
    sliceMap.set(k, cur);
    buckets.set(slice, sliceMap);
  }
  const out: MonthlySeriesBySlice[] = [];
  for (const [sliceKey, m] of buckets) {
    for (const [monthKey, v] of m) {
      out.push({ sliceKey, monthKey, total: round2(v.total), count: v.count });
    }
  }
  return out.sort((a, b) =>
    a.monthKey === b.monthKey
      ? a.sliceKey < b.sliceKey
        ? -1
        : 1
      : a.monthKey < b.monthKey
        ? -1
        : 1,
  );
}

/** Generate the calendar of N months ending now (inclusive), oldest first. */
export function lastNMonths(n: number, now: Date = new Date()): string[] {
  const out: string[] = [];
  const d = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(monthKey(m));
  }
  return out;
}

/** Backfill missing months in a series with zero totals. */
export function densify(series: MonthlyBucket[], months: string[]): MonthlyBucket[] {
  const map = new Map(series.map((s) => [s.monthKey, s]));
  return months.map((mk) => map.get(mk) ?? { monthKey: mk, total: 0, count: 0 });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
