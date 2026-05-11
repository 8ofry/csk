// Lifetime value (LTV) — pure logic.
// Per trainee: total net revenue / months active.
// Per cohort: average LTV across the cohort.
// Per discipline: net revenue / unique trainees who paid.

export interface PaymentRowForLtv {
  traineeId: string;
  amountNet: number;
  paidAt: Date;
  /** Optional taxonomy for slice-by-discipline. */
  disciplineKey?: string;
  /** Cohort the trainee belongs to (e.g. "2026-05"). Computed by the caller. */
  cohortKey: string;
}

export interface TraineeLtv {
  traineeId: string;
  cohortKey: string;
  totalNet: number;
  monthsActive: number;
  ltvPerMonth: number;
}

export interface CohortLtv {
  cohortKey: string;
  trainees: number;
  totalNet: number;
  averageLtv: number; // mean of trainees' totalNet
  averageLtvPerMonth: number; // mean of ltvPerMonth
}

export interface DisciplineLtv {
  disciplineKey: string;
  trainees: number;
  totalNet: number;
  averageLtv: number;
}

export interface LtvReport {
  perTrainee: TraineeLtv[];
  perCohort: CohortLtv[];
  perDiscipline: DisciplineLtv[];
  globalAverageLtv: number;
}

function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function buildLtvReport(rows: PaymentRowForLtv[]): LtvReport {
  // Per trainee
  const byTrainee = new Map<string, { cohortKey: string; total: number; months: Set<string> }>();
  for (const r of rows) {
    const cur = byTrainee.get(r.traineeId) ?? {
      cohortKey: r.cohortKey,
      total: 0,
      months: new Set<string>(),
    };
    cur.total += r.amountNet;
    cur.months.add(monthKey(r.paidAt));
    byTrainee.set(r.traineeId, cur);
  }

  const perTrainee: TraineeLtv[] = [...byTrainee.entries()].map(([traineeId, v]) => {
    const months = v.months.size || 1;
    return {
      traineeId,
      cohortKey: v.cohortKey,
      totalNet: round2(v.total),
      monthsActive: months,
      ltvPerMonth: round2(v.total / months),
    };
  });

  // Per cohort
  const byCohort = new Map<string, TraineeLtv[]>();
  for (const t of perTrainee) {
    const list = byCohort.get(t.cohortKey) ?? [];
    list.push(t);
    byCohort.set(t.cohortKey, list);
  }
  const perCohort: CohortLtv[] = [...byCohort.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([cohortKey, list]) => {
      const totalNet = sum(list.map((t) => t.totalNet));
      return {
        cohortKey,
        trainees: list.length,
        totalNet: round2(totalNet),
        averageLtv: round2(totalNet / list.length),
        averageLtvPerMonth: round2(sum(list.map((t) => t.ltvPerMonth)) / list.length),
      };
    });

  // Per discipline
  const byDisc = new Map<string, { total: number; trainees: Set<string> }>();
  for (const r of rows) {
    const key = r.disciplineKey ?? "—";
    const cur = byDisc.get(key) ?? { total: 0, trainees: new Set<string>() };
    cur.total += r.amountNet;
    cur.trainees.add(r.traineeId);
    byDisc.set(key, cur);
  }
  const perDiscipline: DisciplineLtv[] = [...byDisc.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .map(([disciplineKey, v]) => ({
      disciplineKey,
      trainees: v.trainees.size,
      totalNet: round2(v.total),
      averageLtv: round2(v.total / v.trainees.size),
    }));

  const globalAverageLtv =
    perTrainee.length === 0
      ? 0
      : round2(sum(perTrainee.map((t) => t.totalNet)) / perTrainee.length);

  return { perTrainee, perCohort, perDiscipline, globalAverageLtv };
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
