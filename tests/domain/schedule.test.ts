import { describe, expect, it } from "vitest";
import {
  combineDateTime,
  iterateOccurrences,
  scheduleIncludes,
  scheduledOccurrence,
  type WeeklySchedule,
} from "@/domain/sessions/schedule";

describe("schedule derivation — FR-GRP-04", () => {
  const monWedSchedule: WeeklySchedule = {
    days: ["mon", "wed"],
    startTime: "18:00",
    endTime: "19:30",
  };

  it("scheduleIncludes returns true on Monday", () => {
    // 2026-05-11 is a Monday
    expect(scheduleIncludes(monWedSchedule, new Date(2026, 4, 11))).toBe(true);
  });

  it("scheduleIncludes returns false on Tuesday", () => {
    // 2026-05-12 is a Tuesday
    expect(scheduleIncludes(monWedSchedule, new Date(2026, 4, 12))).toBe(false);
  });

  it("combineDateTime sets HH:MM on the given date", () => {
    const dt = combineDateTime(new Date(2026, 4, 11), "18:30");
    expect(dt.getHours()).toBe(18);
    expect(dt.getMinutes()).toBe(30);
    expect(dt.getDate()).toBe(11);
  });

  it("scheduledOccurrence returns null on off-days", () => {
    expect(scheduledOccurrence(monWedSchedule, new Date(2026, 4, 12))).toBeNull();
  });

  it("scheduledOccurrence returns start/end on Wednesday", () => {
    const occ = scheduledOccurrence(monWedSchedule, new Date(2026, 4, 13));
    expect(occ).not.toBeNull();
    expect(occ!.start.getHours()).toBe(18);
    expect(occ!.end.getHours()).toBe(19);
    expect(occ!.end.getMinutes()).toBe(30);
  });

  it("iterateOccurrences yields only scheduled days in a 1-week window", () => {
    const start = new Date(2026, 4, 11); // Monday
    const end = new Date(2026, 4, 17); // Sunday
    const days = [...iterateOccurrences(monWedSchedule, start, end)];
    expect(days.map((d) => d.date.getDay())).toEqual([1, 3]); // Mon=1, Wed=3
  });

  it("iterateOccurrences handles a 2-week window", () => {
    const start = new Date(2026, 4, 11);
    const end = new Date(2026, 4, 24); // 2 weeks
    const days = [...iterateOccurrences(monWedSchedule, start, end)];
    expect(days.length).toBe(4); // 2 mondays + 2 wednesdays
  });
});
