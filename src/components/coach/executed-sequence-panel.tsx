"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateExecutedSequenceAction } from "@/app/actions/sessions";
import type { ExecutedSequenceUnit } from "@/application/sessions/service";

export function ExecutedSequencePanel({
  sessionId,
  initialUnits,
}: {
  sessionId: string;
  initialUnits: ExecutedSequenceUnit[];
}) {
  const [units, setUnits] = useState<ExecutedSequenceUnit[]>(initialUnits);
  const [newTitle, setNewTitle] = useState("");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(next: ExecutedSequenceUnit[]) {
    setUnits(next);
    startTransition(async () => {
      setError(null);
      setSavedMsg(null);
      const res = await updateExecutedSequenceAction(sessionId, next);
      if (res.error) setError(res.error);
      else setSavedMsg("Saved");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Executed Training Sequence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {units.length === 0 ? (
          <p className="text-sm text-muted-foreground">No units logged yet.</p>
        ) : (
          <ul className="space-y-2">
            {units.map((u, i) => (
              <li
                key={`${u.unitId ?? "custom"}-${i}`}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <label className="flex flex-1 items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={u.completed}
                    onChange={(e) => {
                      const next = units.map((item, idx) =>
                        idx === i ? { ...item, completed: e.target.checked } : item,
                      );
                      save(next);
                    }}
                  />
                  <span className={u.completed ? "line-through text-muted-foreground" : ""}>
                    {u.title}
                  </span>
                </label>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => save(units.filter((_, idx) => idx !== i))}
                  className="text-xs text-destructive hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add executed drill or unit..."
            className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            disabled={pending || !newTitle.trim()}
            onClick={() => {
              const title = newTitle.trim();
              if (!title) return;
              setNewTitle("");
              save([...units, { title, completed: true }]);
            }}
            className="rounded-md bg-csk-gold px-3 py-1.5 text-xs font-semibold text-black hover:bg-csk-gold/90 disabled:opacity-50"
          >
            Add Unit
          </button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        {savedMsg && !error && <p className="text-xs text-emerald-500">{savedMsg}</p>}
      </CardContent>
    </Card>
  );
}
