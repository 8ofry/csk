import { describe, expect, it } from "vitest";
import { aggregateFightRecord } from "@/domain/championships/fight-record";

describe("fight record aggregation — FR-CH-06", () => {
  it("empty record", () => {
    const r = aggregateFightRecord([]);
    expect(r.display).toBe("0-0-0");
    expect(r.total).toBe(0);
  });

  it("counts wins/losses/draws/no-contest", () => {
    const r = aggregateFightRecord([
      { outcome: "WIN", method: "KO" },
      { outcome: "WIN", method: "DECISION" },
      { outcome: "LOSS", method: "TKO" },
      { outcome: "DRAW" },
      { outcome: "NO_CONTEST" },
    ]);
    expect(r.wins).toBe(2);
    expect(r.losses).toBe(1);
    expect(r.draws).toBe(1);
    expect(r.noContest).toBe(1);
    expect(r.total).toBe(5);
    expect(r.display).toBe("2-1-1");
  });

  it("method breakdown is sorted by frequency", () => {
    const r = aggregateFightRecord([
      { outcome: "WIN", method: "KO" },
      { outcome: "WIN", method: "KO" },
      { outcome: "WIN", method: "KO" },
      { outcome: "WIN", method: "DECISION" },
      { outcome: "LOSS", method: "SUBMISSION" },
    ]);
    expect(r.methods[0]?.method).toBe("KO");
    expect(r.methods[0]?.count).toBe(3);
  });

  it("ignores fights without a method in method count", () => {
    const r = aggregateFightRecord([
      { outcome: "DRAW" },
      { outcome: "WIN", method: "KO" },
    ]);
    expect(r.methods).toEqual([{ method: "KO", count: 1 }]);
  });
});
