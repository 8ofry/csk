// Coach performance benchmark — pure logic.
// Composite: 30% sessions delivered + 30% trainee retention + 20% avg effort
// + 20% on-time daily reports. Normalized to 0..100 using sane caps.

export interface CoachBenchmarkInput {
  coachId: string;
  fullNameEn: string;
  sessionsDelivered: number;
  /** Distinct trainees who attended ≥1 session this period. */
  uniqueTrainees: number;
  /** Distinct trainees who attended in the *current* month. */
  retainedTrainees: number;
  averageEffortScore: number | null; // 1..10
  reportsTotal: number;
  reportsApprovedFirstTry: number;
}

export interface ScoredCoachBenchmark extends CoachBenchmarkInput {
  retentionRate: number; // retainedTrainees / uniqueTrainees, 0..1
  reportTimelinessRate: number; // reportsApprovedFirstTry / reportsTotal, 0..1
  score: number; // 0..100
}

const SESSIONS_CAP = 30; // saturate at 30 sessions/period

export function scoreCoachBenchmark(input: CoachBenchmarkInput): ScoredCoachBenchmark {
  const sessionsScore = Math.min(input.sessionsDelivered, SESSIONS_CAP) / SESSIONS_CAP * 30;
  const retentionRate =
    input.uniqueTrainees === 0 ? 0 : input.retainedTrainees / input.uniqueTrainees;
  const retentionScore = retentionRate * 30;
  const effortScore = input.averageEffortScore != null ? (input.averageEffortScore / 10) * 20 : 0;
  const timelinessRate =
    input.reportsTotal === 0 ? 0 : input.reportsApprovedFirstTry / input.reportsTotal;
  const timelinessScore = timelinessRate * 20;
  const score = round2(sessionsScore + retentionScore + effortScore + timelinessScore);
  return {
    ...input,
    retentionRate: round4(retentionRate),
    reportTimelinessRate: round4(timelinessRate),
    score,
  };
}

export function rankCoaches(rows: CoachBenchmarkInput[]): ScoredCoachBenchmark[] {
  return rows
    .map(scoreCoachBenchmark)
    .filter((r) => r.sessionsDelivered > 0)
    .sort((a, b) => b.score - a.score);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}
