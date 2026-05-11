// Pure logic for deriving scheduled session occurrences from a group's recurring weekly schedule.
// SRS FR-GRP-04: schedules are fixed weekly recurring; per-session overrides handled separately.

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface WeeklySchedule {
  days: DayKey[];
  startTime: string; // HH:MM 24h
  endTime: string;
}

const DAY_INDEX: Record<DayKey, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const INDEX_TO_DAY: Record<number, DayKey> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

function parseHHMM(s: string): { h: number; m: number } {
  const [h, m] = s.split(":").map((p) => Number(p));
  return { h: h ?? 0, m: m ?? 0 };
}

/** Return the YYYY-MM-DD key for a Date in the local TZ (used for de-duping with persisted Sessions). */
export function dateKey(d: Date): string {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Combine a calendar date (year/month/day) with HH:MM into a Date. */
export function combineDateTime(date: Date, hhmm: string): Date {
  const { h, m } = parseHHMM(hhmm);
  const out = new Date(date);
  out.setHours(h, m, 0, 0);
  return out;
}

/** Does this group's recurring schedule include the given calendar date? */
export function scheduleIncludes(schedule: WeeklySchedule, date: Date): boolean {
  const dayKey = INDEX_TO_DAY[date.getDay()];
  return !!dayKey && schedule.days.includes(dayKey);
}

/** Derive scheduled start/end Date for a date that the schedule covers. */
export function scheduledOccurrence(
  schedule: WeeklySchedule,
  date: Date,
): { start: Date; end: Date } | null {
  if (!scheduleIncludes(schedule, date)) return null;
  return {
    start: combineDateTime(date, schedule.startTime),
    end: combineDateTime(date, schedule.endTime),
  };
}

/** Iterate all scheduled occurrences in a date window (inclusive both ends). */
export function* iterateOccurrences(
  schedule: WeeklySchedule,
  windowStart: Date,
  windowEnd: Date,
): Generator<{ date: Date; start: Date; end: Date }> {
  const cursor = new Date(windowStart);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(windowEnd);
  end.setHours(23, 59, 59, 999);
  while (cursor <= end) {
    const occ = scheduledOccurrence(schedule, cursor);
    if (occ) {
      yield { date: new Date(cursor), start: occ.start, end: occ.end };
    }
    cursor.setDate(cursor.getDate() + 1);
  }
}

export const __INTERNAL = { DAY_INDEX, INDEX_TO_DAY };
