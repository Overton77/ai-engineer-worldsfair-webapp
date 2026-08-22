import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getApprovedBundle, getOwnedRun } from "@/lib/stock-research/db";
import { mcpError, mcpRequestSchema } from "@/lib/stock-research/mcp";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const client = await createServerSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json(mcpError(null, -32001, "Unauthorized"), { status: 401 });
  let json: unknown; try { json = await request.json(); } catch { return NextResponse.json(mcpError(null,-32700,"Parse error"),{status:400}); }
  const parsed = mcpRequestSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json(mcpError(null,-32600,"Invalid or disallowed request"),{status:400});
  const { id, method, params } = parsed.data;
  const run = await getOwnedRun(client, params.runId, user.id);
  if (!run) return NextResponse.json(mcpError(id,-32004,"Not found"),{status:404});
  const result = method === "stock_research.status" ? { runId: run.id, state: run.state, ticker: run.ticker, asOf: run.as_of, decidedAt: run.decided_at } : await getApprovedBundle(client, run.id, user.id);
  if (result === null) return NextResponse.json(mcpError(id,-32009,"Bundle is not approved"),{status:409});
  return NextResponse.json({ jsonrpc:"2.0", id, result });
}
export async function GET() { return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } }); }
