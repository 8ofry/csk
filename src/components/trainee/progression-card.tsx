import { Award, Flame, ShieldCheck, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TraineeBadge, TraineeProgression } from "@/application/progression/service";

const BADGE_META: Record<TraineeBadge, { label: string; icon: typeof Award }> = {
  FIRST_SESSION: { label: "First Mat Session", icon: Award },
  STREAK_5: { label: "5-Session Streak", icon: Flame },
  CONSISTENCY_12: { label: "12+ Sessions / 30d", icon: Trophy },
  MEDICALLY_CLEARED: { label: "Medical Cleared", icon: ShieldCheck },
  CHAMPIONSHIP_FIGHTER: { label: "Championship Competitor", icon: Trophy },
};

export function ProgressionCard({
  progression,
  referralCode,
}: {
  progression: TraineeProgression;
  referralCode: string;
}) {
  const pct = Math.min(
    100,
    Math.round((progression.monthAttended / progression.monthlyTarget) * 100),
  );

  return (
    <Card className="border-csk-gold/30">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">Athlete Progression & Milestones</CardTitle>
          {progression.currentBelt && (
            <Badge className="bg-csk-gold text-black">{progression.currentBelt}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-md border p-3">
            <div className="text-2xl font-bold text-csk-gold">{progression.monthAttended}</div>
            <div className="text-xs text-muted-foreground">Sessions (30d)</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-2xl font-bold">{progression.currentStreak}</div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-2xl font-bold">{progression.totalAttended}</div>
            <div className="text-xs text-muted-foreground">Lifetime</div>
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted-foreground">Monthly Target Progress</span>
            <span className="font-medium">
              {progression.monthAttended} / {progression.monthlyTarget} ({pct}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-csk-gold transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {progression.badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {progression.badges.map((b) => {
              const meta = BADGE_META[b];
              const Icon = meta.icon;
              return (
                <Badge key={b} variant="secondary" className="gap-1">
                  <Icon className="h-3 w-3 text-csk-gold" />
                  {meta.label}
                </Badge>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            Refer a training partner (20% off next month):
          </span>
          <code className="rounded bg-background px-2 py-0.5 font-mono font-bold text-csk-gold">
            {referralCode}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
