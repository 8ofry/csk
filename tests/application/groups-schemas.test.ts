import { describe, expect, it } from "vitest";
import { groupInputSchema, weeklyScheduleSchema } from "@/application/groups/schemas";

describe("weeklyScheduleSchema", () => {
  it("accepts a valid schedule", () => {
    const result = weeklyScheduleSchema.parse({
      days: ["mon", "wed"],
      startTime: "18:00",
      endTime: "19:30",
    });
    expect(result.days).toEqual(["mon", "wed"]);
  });

  it("rejects invalid time format", () => {
    expect(() =>
      weeklyScheduleSchema.parse({ days: ["mon"], startTime: "6pm", endTime: "7pm" }),
    ).toThrow();
  });

  it("rejects out-of-range hour", () => {
    expect(() =>
      weeklyScheduleSchema.parse({ days: ["mon"], startTime: "25:00", endTime: "26:00" }),
    ).toThrow();
  });

  it("requires at least one day", () => {
    expect(() =>
      weeklyScheduleSchema.parse({ days: [], startTime: "18:00", endTime: "19:00" }),
    ).toThrow();
  });

  it("rejects unknown day", () => {
    expect(() =>
      weeklyScheduleSchema.parse({ days: ["funday"], startTime: "18:00", endTime: "19:00" }),
    ).toThrow();
  });
});

describe("groupInputSchema", () => {
  const baseValid = {
    name: "Boxing Beginners — Mon/Wed",
    locationId: "loc-1",
    disciplineId: "disc-1",
    schedule: { days: ["mon", "wed"], startTime: "18:00", endTime: "19:30" },
    capacity: 20,
    active: true,
  };

  it("parses a valid group", () => {
    const result = groupInputSchema.parse(baseValid);
    expect(result.capacity).toBe(20); // FR-GRP-01 default holds
  });

  it("coerces capacity to number", () => {
    const result = groupInputSchema.parse({ ...baseValid, capacity: "30" });
    expect(result.capacity).toBe(30);
  });

  it("rejects capacity > 200", () => {
    expect(() => groupInputSchema.parse({ ...baseValid, capacity: 250 })).toThrow();
  });

  it("accepts optional age band", () => {
    const result = groupInputSchema.parse({
      ...baseValid,
      ageBandMin: 12,
      ageBandMax: 16,
    });
    expect(result.ageBandMin).toBe(12);
    expect(result.ageBandMax).toBe(16);
  });

  it("requires both location and discipline", () => {
    expect(() => groupInputSchema.parse({ ...baseValid, locationId: "" })).toThrow();
    expect(() => groupInputSchema.parse({ ...baseValid, disciplineId: "" })).toThrow();
  });
});
