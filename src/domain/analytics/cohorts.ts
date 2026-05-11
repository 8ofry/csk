// Cohort retention matrix — pure logic.
// Groups trainees by their join month (first subscription start) and reports
// what fraction of each cohort is still active N months later.
//
// Used by the Admin Analytics dashboard to spot retention cliffs (e.g. "we
// lose 40% of trainees in their second month — investigate session 4–8").

export interface TraineeCohortInput {
  traineeId: string;
  /** First subscription start date for this trainee. */
  joinedAt: Date;
  /** All months in which this trainee held an active subscription (year + 1-indexed month strings, e.g. "2026-05"). */
  activeMonths: string[];
}

export interface CohortCell {
  /** 0 = the cohort's own join month, 1 = next month, ... */
  monthOffset: number;
  /** How many cohort members were active that month. */
  activeCount: number;
  /** activeCount / cohortSize, in [0,1]. */
  retainedPct: number;
}

export interface Cohort {
  /** "YYYY-MM" of the cohort's join month. */
  cohortKey: string;
  cohortSize: number;
  cells: CohortCell[];
}

export interface CohortReport {
  cohorts: Cohort[];
  /** Maximum month offset observed across all cohorts (column count for the matrix). */
  maxOffset: number;
}

export function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Distance in calendar months between two month-keys (a >= b → non-negative). */
export function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number) as [number, number];
  const [by, bm] = b.split("-").map(Number) as [number, number];
  return (ay - by) * 12 + (am - bm);
}

export function buildCohortReport(
  rows: TraineeCohortInput[],
  options: { maxOffset?: number } = {},
): CohortReport {
  // Bucket trainees by their join month.
  const cohortMap = new Map<string, { traineeIds: Set<string>; perOffset: Map<number, Set<string>> }>();

  for (const row of rows) {
    const cohort = monthKey(row.joinedAt);
    const bucket =
      cohortMap.get(cohort) ?? {
        traineeIds: new Set<string>(),
        perOffset: new Map<number, Set<string>>(),
      };
    bucket.traineeIds.add(row.traineeId);
    for (const ym of row.activeMonths) {
      const offset = monthsBetween(ym, cohort);
      if (offset < 0) continue;
      const seen = bucket.perOffset.get(offset) ?? new Set<string>();
      seen.add(row.traineeId);
      bucket.perOffset.set(offset, seen);
    }
    cohortMap.set(cohort, bucket);
  }

  const cohorts: Cohort[] = [...cohortMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([cohortKey, bucket]) => {
      const size = bucket.traineeIds.size;
      const offsets = [...bucket.perOffset.keys()].sort((a, b) => a - b);
      const max = options.maxOffset ?? (offsets.length > 0 ? offsets[offsets.length - 1]! : 0);
      const cells: CohortCell[] = [];
      for (let off = 0; off <= max; off++) {
        const seen = bucket.perOffset.get(off)?.size ?? 0;
        cells.push({
          monthOffset: off,
          activeCount: seen,
          retainedPct: size === 0 ? 0 : seen / size,
        });
      }
      return { cohortKey, cohortSize: size, cells };
    });

  const maxOffset =
    options.maxOffset ??
    cohorts.reduce(
      (m, c) => Math.max(m, c.cells[c.cells.length - 1]?.monthOffset ?? 0),
      0,
    );
  return { cohorts, maxOffset };
}
