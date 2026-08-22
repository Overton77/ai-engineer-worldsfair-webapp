import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type { ResearchBundle, RunState } from "./types";

type Client = SupabaseClient<Database>;
export type ResearchRun = { id: string; user_id: string; tenant_id: string; ticker: string; as_of: string; challenge_version: string; state: RunState; failure_reason: string | null; created_at: string; updated_at: string; decided_at: string | null };

// These tables are introduced additively by Mission 001's migration. The cast is isolated
// until database.types.ts can be regenerated against a running local Supabase instance.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = (client: Client, name: string): any => client.from(name as never);

export async function insertRun(client: Client, input: Omit<ResearchRun, "id" | "created_at" | "updated_at" | "decided_at" | "failure_reason">) {
  const { data, error } = await table(client, "stock_research_run").insert(input).select("*").single();
  if (error || !data) throw new Error(error?.message ?? "run insert failed");
  return data as ResearchRun;
}
export async function listRuns(client: Client, userId: string) {
  const { data, error } = await table(client, "stock_research_run").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ResearchRun[];
}
export async function getOwnedRun(client: Client, runId: string, userId: string) {
  const { data, error } = await table(client, "stock_research_run").select("*").eq("id", runId).eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data as ResearchRun | null;
}
export async function getApprovedBundle(client: Client, runId: string, userId: string) {
  const run = await getOwnedRun(client, runId, userId);
  if (!run || run.state !== "approved") return null;
  const { data, error } = await table(client, "stock_research_bundle").select("bundle").eq("run_id", runId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.bundle ?? null) as ResearchBundle | null;
}
export async function decideRun(client: Client, runId: string, decision: "approved" | "rejected") {
  const { data, error } = await (client.rpc as unknown as (name: string, args: object) => Promise<{data: unknown;error: {message:string}|null}>)("stock_research_decide_run", { p_run_id: runId, p_decision: decision });
  if (error) throw new Error(error.message);
  return data as ResearchRun;
}
export async function claimRun(client: Client, runId: string, version: string) {
  const { data, error } = await (client.rpc as unknown as (name: string, args: object) => Promise<{data: unknown;error: {message:string}|null}>)("stock_research_claim_run", { p_run_id: runId, p_version: version });
  if (error) throw new Error(error.message);
  return Boolean(data);
}
export async function completeRun(client: Client, runId: string, bundle: ResearchBundle) {
  const { error } = await (client.rpc as unknown as (name: string, args: object) => Promise<{data: unknown;error: {message:string}|null}>)("stock_research_complete_run", { p_run_id: runId, p_bundle: bundle as unknown as Json });
  if (error) throw new Error(error.message);
}
export async function failRun(client: Client, runId: string, reason: string) {
  await table(client, "stock_research_run").update({ state: "failed", failure_reason: reason.slice(0, 500) }).eq("id", runId).in("state", ["queued", "researching"]);
}
