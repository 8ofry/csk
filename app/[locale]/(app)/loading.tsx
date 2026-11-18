export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading page">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-muted" />
          <div className="h-4 w-72 rounded-md bg-muted/70" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-border/60 bg-card/80 p-5">
            <div className="h-3.5 w-24 rounded bg-muted" />
            <div className="mt-4 h-7 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="h-64 rounded-xl border border-border/60 bg-card/80 p-6">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="mt-4 space-y-3">
          <div className="h-4 w-full rounded bg-muted/70" />
          <div className="h-4 w-5/6 rounded bg-muted/70" />
          <div className="h-4 w-2/3 rounded bg-muted/70" />
        </div>
      </div>
    </div>
  );
}
