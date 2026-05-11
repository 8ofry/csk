// Career fight-record aggregation — pure logic.
// SRS FR-CH-06: aggregate all results into W-L-D + method breakdown.

export interface FightRow {
  outcome: "WIN" | "LOSS" | "DRAW" | "NO_CONTEST";
  method?: "KO" | "TKO" | "DECISION" | "SUBMISSION" | "DQ" | "OTHER" | null;
}

export interface FightRecord {
  wins: number;
  losses: number;
  draws: number;
  noContest: number;
  total: number;
  methods: { method: string; count: number }[];
  display: string; // "W-L-D" e.g. "12-3-1"
}

export function aggregateFightRecord(rows: FightRow[]): FightRecord {
  let wins = 0,
    losses = 0,
    draws = 0,
    noContest = 0;
  const methodCounts = new Map<string, number>();

  for (const r of rows) {
    if (r.outcome === "WIN") wins++;
    else if (r.outcome === "LOSS") losses++;
    else if (r.outcome === "DRAW") draws++;
    else if (r.outcome === "NO_CONTEST") noContest++;

    if (r.method) {
      methodCounts.set(r.method, (methodCounts.get(r.method) ?? 0) + 1);
    }
  }

  const total = wins + losses + draws + noContest;
  const methods = [...methodCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([method, count]) => ({ method, count }));

  return {
    wins,
    losses,
    draws,
    noContest,
    total,
    methods,
    display: `${wins}-${losses}-${draws}`,
  };
}
