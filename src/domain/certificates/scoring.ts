// Best Trainee / Best Coach shortlist scoring — pure logic.
// SRS FR-CRT-02 selection criteria: attendance rate + commitment indicators
// + highest evaluation average + Coach pick. The Head Coach reviews the
// system-generated shortlist and confirms final selections.

export interface TraineeScoreInput {
  traineeId: string;
  attendanceRate: number; // 0..1
  averageEffort: number | null; // 1..10 or null
  sessionsCompleted: number; // raw count for tiebreak / commitment signal
}

export interface ScoredTrainee extends TraineeScoreInput {
  score: number; // 0..100 composite
}

/**
 * Composite score:
 *   45% attendance rate
 *   45% average effort (normalized to 1..10)
 *   10% sessions-completed signal (saturates at 12)
 * A trainee with no evals receives only the attendance + commitment portion.
 */
export function scoreTrainee(input: TraineeScoreInput): ScoredTrainee {
  const attendance = clamp01(input.attendanceRate) * 45;
  const effort = input.averageEffort != null ? (input.averageEffort / 10) * 45 : 0;
  const commitment = Math.min(input.sessionsCompleted, 12) / 12 * 10;
  return {
    ...input,
    score: round2(attendance + effort + commitment),
  };
}

export function shortlistTrainees(rows: TraineeScoreInput[], top = 5): ScoredTrainee[] {
  return rows
    .map(scoreTrainee)
    .filter((s) => s.sessionsCompleted > 0)
    .sort((a, b) => b.score - a.score || b.attendanceRate - a.attendanceRate)
    .slice(0, top);
}

export interface CoachScoreInput {
  coachId: string;
  sessionsRun: number;
  averageGroupEffort: number | null; // mean of trainee effort scores
  reportsApprovedFirstTry: number;
  reportsTotal: number;
}

export interface ScoredCoach extends CoachScoreInput {
  score: number;
}

export function scoreCoach(input: CoachScoreInput): ScoredCoach {
  const sessions = Math.min(input.sessionsRun, 20) / 20 * 30;
  const effort = input.averageGroupEffort != null ? (input.averageGroupEffort / 10) * 50 : 0;
  const onTime = input.reportsTotal === 0
    ? 0
    : (input.reportsApprovedFirstTry / input.reportsTotal) * 20;
  return { ...input, score: round2(sessions + effort + onTime) };
}

export function shortlistCoaches(rows: CoachScoreInput[], top = 3): ScoredCoach[] {
  return rows
    .map(scoreCoach)
    .filter((s) => s.sessionsRun > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, top);
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
