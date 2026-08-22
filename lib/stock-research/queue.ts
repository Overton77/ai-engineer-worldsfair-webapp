import "server-only";
import { send } from "@vercel/queue";
import { createServiceClient } from "@/lib/supabase/admin";
import { claimRun, completeRun, failRun } from "./db";
import { replayFixture } from "./fixtures";
import { queueMessageSchema } from "./types";

export const STOCK_RESEARCH_TOPIC = "stock-research-run";
export async function enqueueResearch(runId: string, challengeVersion: "1.0.0") {
  return send(STOCK_RESEARCH_TOPIC, { runId, challengeVersion }, { idempotencyKey: `${runId}:${challengeVersion}` });
}
export async function processResearchMessage(raw: unknown) {
  const message = queueMessageSchema.parse(raw);
  const client = createServiceClient();
  if (!(await claimRun(client, message.runId, message.challengeVersion))) return;
  try {
    const { data, error } = await (client.from("stock_research_run" as never) as unknown as {select:(columns:string)=>{eq:(column:string,value:string)=>{single:()=>Promise<{data:{ticker:string;as_of:string}|null;error:{message:string}|null}>}}}).select("ticker, as_of").eq("id", message.runId).single();
    if (error || !data) throw new Error(error?.message ?? "run not found");
    const bundle = replayFixture(data.ticker, data.as_of);
    await completeRun(client, message.runId, bundle);
    return;
  } catch (error) {
    await failRun(client, message.runId, error instanceof Error ? error.message : "research failed");
    throw error;
  }
}
