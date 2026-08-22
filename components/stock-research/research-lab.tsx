import type { ResearchRun } from "@/lib/stock-research/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createResearchRun, reviewResearchRun } from "@/app/(app)/challenges/[slug]/v/[version]/actions";
export function ResearchLab({ runs }: { runs: ResearchRun[] }) {
  return <div className="space-y-8">
    <section className="rounded-xl border bg-card p-6"><h2 className="text-lg font-semibold">Start a source-grounded run</h2><p className="mt-1 text-sm text-muted-foreground">Only replayable public sources and synthetic $1,000 paper positions are used.</p>
      <form action={createResearchRun} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">Ticker<input name="ticker" required pattern="[A-Za-z][A-Za-z0-9.-]{0,9}" placeholder="AAPL" className="h-9 rounded-md border bg-background px-3 uppercase" /></label>
        <label className="grid gap-1 text-sm">Research as of<input name="asOf" required type="date" max={new Date().toISOString().slice(0,10)} defaultValue="2024-11-01" className="h-9 rounded-md border bg-background px-3" /></label>
        <Button type="submit">Queue research</Button>
      </form>
    </section>
    <section className="space-y-3"><h2 className="text-lg font-semibold">Your runs</h2>{runs.length===0 && <p className="text-sm text-muted-foreground">No research runs yet.</p>}{runs.map(run=><article key={run.id} data-testid={`run-${run.id}`} className="rounded-xl border p-4"><div className="flex items-center justify-between"><div><strong>{run.ticker}</strong><p className="text-xs text-muted-foreground">As of {new Date(run.as_of).toLocaleString()}</p></div><Badge>{run.state.replaceAll("_"," ")}</Badge></div>
      {run.failure_reason && <p className="mt-3 text-sm text-destructive">{run.failure_reason}</p>}
      {run.state==="awaiting_approval" && <form action={reviewResearchRun} className="mt-4 flex gap-2"><input type="hidden" name="runId" value={run.id}/><Button name="decision" value="approved">Approve immutable bundle</Button><Button name="decision" value="rejected" variant="destructive">Reject</Button></form>}
    </article>)}</section>
  </div>;
}
