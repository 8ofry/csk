import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getPublicFighterProfile } from "@/application/public/fighter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MatchVideoPlayer } from "@/components/public/match-video-player";

function outcomeBadge(o: string) {
  switch (o) {
    case "WIN":
      return <Badge variant="success">{o}</Badge>;
    case "LOSS":
      return <Badge variant="destructive">{o}</Badge>;
    case "DRAW":
      return <Badge variant="warning">{o}</Badge>;
    default:
      return <Badge variant="secondary">{o}</Badge>;
  }
}

export default async function FighterProfilePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const fighter = await getPublicFighterProfile(id);
  if (!fighter) notFound();

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-6">
        <Link href="/champions" className="text-sm text-csk-gold hover:underline">
          ← All champions
        </Link>
      </div>

      {/* Hero */}
      <div className="mb-8 flex flex-col items-start gap-6 rounded-lg border bg-csk-black p-8 text-white sm:flex-row sm:items-center">
        {fighter.profilePhotoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={fighter.profilePhotoUrl}
            alt={fighter.fullNameEn}
            className="h-32 w-32 rounded-full border-4 border-csk-gold object-cover"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-csk-gold bg-csk-black/40 text-5xl text-csk-gold">
            ⚔
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-4xl font-bold">{fighter.fullNameEn}</h1>
          <p className="text-lg text-white/70">{fighter.fullNameAr}</p>
          {fighter.homeLocationName && (
            <p className="mt-2 text-sm text-white/60">
              Home: <span className="text-csk-gold">{fighter.homeLocationName}</span>
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-5xl font-extrabold text-csk-gold">{fighter.record.display}</div>
          <div className="text-xs uppercase tracking-widest text-white/60">
            W-L-D · {fighter.record.total} fight{fighter.record.total === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {/* Method breakdown */}
      {fighter.record.methods.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Method breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {fighter.record.methods.map((m) => (
                <Badge key={m.method} variant="outline" className="text-sm">
                  {m.method}: {m.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Belt levels */}
      {fighter.beltLevels.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Belt levels</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {fighter.beltLevels.map((b) => (
                <li
                  key={b.discipline}
                  className="rounded-md border border-csk-gold/30 p-3 text-center"
                >
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {b.discipline}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-csk-gold">{b.level}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{b.achievedAt}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Fight history */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Fight history</CardTitle>
        </CardHeader>
        <CardContent>
          {fighter.fights.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recorded fights yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Opponent</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Round / time</TableHead>
                  <TableHead>Video</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fighter.fights.map((f, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs">{f.championshipDate}</TableCell>
                    <TableCell>
                      {f.championshipName}{" "}
                      {f.isOfficial && <Badge variant="outline">official</Badge>}
                    </TableCell>
                    <TableCell>{f.opponentName}</TableCell>
                    <TableCell>{outcomeBadge(f.outcome)}</TableCell>
                    <TableCell>{f.method ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {f.round != null ? `R${f.round}` : "—"}
                      {f.timeInRound ? ` ${f.timeInRound}` : ""}
                    </TableCell>
                    <TableCell>
                      {f.videoUrl ? (
                        <MatchVideoPlayer videoUrl={f.videoUrl} opponentName={f.opponentName} />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Championships participated in */}
      <Card>
        <CardHeader>
          <CardTitle>Championships ({fighter.championships.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {fighter.championships.length === 0 ? (
            <p className="text-sm text-muted-foreground">No championship registrations yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Fights</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fighter.championships.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell className="text-xs">{c.startDate}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === "COACH_CONFIRMED" || c.status === "PAID"
                            ? "success"
                            : c.status === "WITHDREW"
                              ? "destructive"
                              : "warning"
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.weightKg ? `${c.weightKg} kg` : "—"}</TableCell>
                    <TableCell>{c.level ?? "—"}</TableCell>
                    <TableCell>{c.fightCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
