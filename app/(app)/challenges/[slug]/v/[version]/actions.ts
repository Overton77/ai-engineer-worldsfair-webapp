"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createServerSupabase } from "@/lib/supabase/server";
import { decideRun, insertRun } from "@/lib/stock-research/db";
import { enqueueResearch } from "@/lib/stock-research/queue";
import { createRunSchema } from "@/lib/stock-research/types";
const PATH = "/challenges/source-grounded-stock-research/v/1.0.0";
export async function createResearchRun(formData: FormData) {
  const user = await requireUser();
  const date = String(formData.get("asOf") ?? "");
  const parsed = createRunSchema.safeParse({ ticker: formData.get("ticker"), asOf: `${date}T23:59:59.000Z`, challengeVersion: "1.0.0" });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid research request");
  const client = await createServerSupabase();
  const run = await insertRun(client, { user_id:user.id, tenant_id:user.id, ticker:parsed.data.ticker, as_of:parsed.data.asOf, challenge_version:parsed.data.challengeVersion, state:"queued" });
  await enqueueResearch(run.id, parsed.data.challengeVersion);
  revalidatePath(PATH); redirect(`${PATH}?run=${run.id}`);
}
export async function reviewResearchRun(formData: FormData) {
  await requireUser();
  const runId = String(formData.get("runId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(runId) || (decision !== "approved" && decision !== "rejected")) throw new Error("Invalid decision");
  await decideRun(await createServerSupabase(), runId, decision);
  revalidatePath(PATH);
}
