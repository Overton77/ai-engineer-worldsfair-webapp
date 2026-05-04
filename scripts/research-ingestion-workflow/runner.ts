/// <reference types="node" />

import { resolve } from "node:path";

import type { CliOptions, WorkflowContext, WorkflowNode } from "./types";
import { exists, outputHashes, pathSummary, writeJsonAtomic } from "./fs-utils";
import { findCatalogRecord } from "./catalog";
import { loadOrCreateState, makePaths, nodeInputHash, saveRunInputs, saveState, shouldSkipNode } from "./state";
import { assertModelAvailable } from "./sdk-agent";
import { buildNodes, inspectOutputs } from "./nodes";

async function buildContext(config: WorkflowContext["config"], options: CliOptions): Promise<WorkflowContext> {
  const found = await findCatalogRecord(config.vaultRoot, config.videoId, config.bucket);
  const bucket = config.bucket ?? found.bucket;
  const paths = makePaths({ ...config, bucket }, bucket);
  const apply = options.apply || config.safety.allowSupabaseWrites;
  const state = await loadOrCreateState(config, paths, bucket, apply);
  return {
    config: { ...config, bucket },
    paths,
    video: found.video,
    bucket,
    apply,
    state,
  };
}

export async function doctor(config: WorkflowContext["config"], options: CliOptions): Promise<void> {
  const context = await buildContext(config, options);
  const checks: Array<[string, boolean, string]> = [];
  const add = async (label: string, path: string) => {
    checks.push([label, await exists(path), path]);
  };

  await add("vault root", context.paths.vaultRoot);
  await add("catalog root", resolve(context.paths.vaultRoot, "04_catalogs", "youtube"));
  await add("inbox dir", context.paths.inboxDir);
  await add("project template", resolve(context.paths.vaultRoot, "_templates", "_project.md"));
  await add("summary template", resolve(context.paths.vaultRoot, "_templates", "summary.md"));
  await add("entities schema", resolve(context.paths.vaultRoot, "_templates", "entities.schema.md"));
  await add("vault ops skill", resolve(context.paths.aiwikiRoot, ".agents", "skills", "aiwiki-vault-ops", "SKILL.md"));
  await add("youtube transcript skill", resolve(context.paths.aiwikiRoot, ".agents", "skills", "youtube-transcript", "SKILL.md"));
  await add("chunk script", resolve(context.paths.pythonEnvRoot, "scripts", "chunk_video_artifacts.py"));
  await add("inspect script", resolve(context.paths.appRoot, "scripts", "inspect-corpus.ts"));
  await add("upsert entities script", resolve(context.paths.appRoot, "scripts", "upsert-entities.ts"));
  await add("upsert chunks script", resolve(context.paths.appRoot, "scripts", "upsert-chunks.ts"));

  let modelCount = 0;
  try {
    modelCount = await assertModelAvailable(context);
    checks.push(["cursor sdk model", true, `${context.config.runtime.model} (${modelCount} visible models)`]);
  } catch (error) {
    checks.push(["cursor sdk model", false, error instanceof Error ? error.message : String(error)]);
  }

  const envNames = [
    "CURSOR_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "AWS_BEARER_TOKEN_BEDROCK",
  ];
  for (const name of envNames) {
    checks.push([`env ${name}`, Boolean(process.env[name]), process.env[name] ? "set" : "missing"]);
  }

  console.log(`# research workflow doctor\n`);
  for (const [label, ok, detail] of checks) {
    console.log(`${ok ? "OK" : "WARN"} ${label}: ${detail}`);
  }

  const hardFailures = checks.filter(([label, ok]) =>
    !ok && ["vault root", "catalog root", "project template", "cursor sdk model"].includes(label),
  );
  if (hardFailures.length) {
    throw new Error(`Doctor failed ${hardFailures.length} hard checks`);
  }
}

export async function printPlan(config: WorkflowContext["config"], options: CliOptions): Promise<void> {
  const context = await buildContext(config, options);
  const nodes = buildNodes(context);
  console.log(`# ${context.config.workflow}`);
  console.log(`video: ${context.config.videoId}`);
  console.log(`bucket: ${context.bucket}`);
  console.log(`title: ${context.video.title}`);
  console.log(`runDir: ${context.paths.runDir}`);
  console.log(`apply: ${context.apply}`);
  console.log(`model: ${context.config.runtime.model}`);
  console.log("");
  for (const node of nodes) {
    console.log(`- ${node.id} [${node.kind}]`);
    console.log(`  dependsOn: ${node.dependsOn.length ? node.dependsOn.join(", ") : "-"}`);
    console.log(`  outputs: ${node.outputs.length ? node.outputs.join(", ") : "-"}`);
  }
}

function readyNodes(nodes: WorkflowNode[], finished: Set<string>, started: Set<string>): WorkflowNode[] {
  return nodes.filter(
    (node) =>
      !started.has(node.id) && node.dependsOn.every((dependency) => finished.has(dependency)),
  );
}

async function runNode(context: WorkflowContext, node: WorkflowNode): Promise<void> {
  const inputPaths = node.dependsOn.flatMap((id) => {
    const state = context.state.nodes[id];
    return state?.outputHashes ? Object.keys(state.outputHashes) : [];
  });
  const inputHash = await nodeInputHash(context, node.id, inputPaths);

  if (await shouldSkipNode(context, node.id, inputHash, node.outputs)) {
    console.log(`[skip] ${node.id}`);
    context.state.nodes[node.id] = {
      ...context.state.nodes[node.id],
      id: node.id,
      kind: node.kind,
      status: "skipped",
      inputHash,
      outputHashes: await outputHashes(node.outputs),
      finishedAt: new Date().toISOString(),
    };
    await saveState(context);
    return;
  }

  const startedAt = new Date();
  context.state.nodes[node.id] = {
    id: node.id,
    kind: node.kind,
    status: "running",
    inputHash,
    startedAt: startedAt.toISOString(),
  };
  await saveState(context);

  try {
    console.log(`\n[node] ${node.id}: ${node.label}`);
    await node.run(context, node);
    const finishedAt = new Date();
    context.state.nodes[node.id] = {
      ...context.state.nodes[node.id],
      id: node.id,
      kind: node.kind,
      status: "finished",
      inputHash,
      outputHashes: await outputHashes(node.outputs),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    };
    await saveState(context);
  } catch (error) {
    const finishedAt = new Date();
    context.state.nodes[node.id] = {
      ...context.state.nodes[node.id],
      id: node.id,
      kind: node.kind,
      status: "failed",
      inputHash,
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      error: error instanceof Error ? error.message : String(error),
    };
    await saveState(context);
    throw error;
  }
}

export async function runWorkflow(config: WorkflowContext["config"], options: CliOptions): Promise<void> {
  const context = await buildContext(config, options);
  await saveRunInputs(context);

  const nodes = buildNodes(context);
  await writeJsonAtomic(context.paths.manifestPath, {
    workflow: context.config.workflow,
    videoId: context.config.videoId,
    bucket: context.bucket,
    title: context.video.title,
    runDir: context.paths.runDir,
    apply: context.apply,
    dryRun: !context.apply,
    nodes: nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      dependsOn: node.dependsOn,
      outputs: node.outputs,
    })),
  });

  console.log(`[workflow] runDir=${context.paths.runDir}`);
  console.log(`[workflow] project=${context.paths.videoDir}`);
  console.log(`[workflow] apply=${context.apply}`);

  const finished = new Set(
    Object.values(context.state.nodes)
      .filter((node) => node.status === "finished" || node.status === "skipped")
      .map((node) => node.id),
  );
  const started = new Set(finished);

  while (finished.size < nodes.length) {
    const ready = readyNodes(nodes, finished, started);
    if (!ready.length) {
      const pending = nodes.filter((node) => !finished.has(node.id)).map((node) => node.id);
      throw new Error(`No runnable nodes. Pending: ${pending.join(", ")}`);
    }

    const batch = ready.slice(0, context.config.runtime.maxParallelAgents);
    for (const node of batch) started.add(node.id);
    await Promise.all(
      batch.map(async (node) => {
        await runNode(context, node);
        finished.add(node.id);
      }),
    );
  }

  console.log("\n[workflow] DONE");
  const outputs = await inspectOutputs(nodes);
  for (const [nodeId, hashes] of Object.entries(outputs)) {
    const details = await Promise.all(Object.keys(hashes).map((path) => pathSummary(path)));
    console.log(`${nodeId}: ${details.join("; ") || "no declared outputs"}`);
  }
}
