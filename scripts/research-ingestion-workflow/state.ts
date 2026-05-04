/// <reference types="node" />

import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import type {
  WorkflowConfig,
  WorkflowContext,
  WorkflowPaths,
  WorkflowState,
} from "./types";
import {
  ensureDir,
  exists,
  outputHashes,
  readJson,
  sha256Text,
} from "./fs-utils";

async function writeRunJson(path: string, value: unknown): Promise<void> {
  await ensureDir(dirname(path));
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function makePaths(config: WorkflowConfig, bucket: string): WorkflowPaths {
  const appRoot = process.cwd();
  const repoRoot = resolve(appRoot, "..");
  const vaultRoot = resolve(appRoot, config.vaultRoot);
  const aiwikiRoot = resolve(vaultRoot, "..", "..");
  const pythonEnvRoot = resolve(aiwikiRoot, "pythonenv");
  const videoDir = resolve(vaultRoot, "01_buckets", bucket, "videos", config.videoId);
  const runDir =
    config.resume?.runDir ??
    resolve(
      appRoot,
      ".runs",
      "research",
      `${new Date().toISOString().replace(/[:.]/g, "-")}-${bucket}-${config.videoId}`,
    );

  return {
    appRoot,
    repoRoot,
    vaultRoot,
    aiwikiRoot,
    pythonEnvRoot,
    videoDir,
    queriesDir: resolve(videoDir, "queries"),
    inboxDir: resolve(vaultRoot, "00_inbox"),
    runDir,
    statePath: resolve(runDir, "workflow-state.json"),
    manifestPath: resolve(runDir, "manifest.json"),
    configPath: resolve(runDir, "workflow-config.json"),
  };
}

export async function loadOrCreateState(
  config: WorkflowConfig,
  paths: WorkflowPaths,
  bucket: string,
  apply: boolean,
): Promise<WorkflowState> {
  await ensureDir(dirname(paths.statePath));

  if (await exists(paths.statePath)) {
    return readJson<WorkflowState>(paths.statePath);
  }

  return {
    workflow: config.workflow,
    videoId: config.videoId,
    bucket,
    runDir: paths.runDir,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    apply,
    nodes: {},
  };
}

export async function saveState(context: WorkflowContext): Promise<void> {
  context.state.updatedAt = new Date().toISOString();
  await writeRunJson(context.paths.statePath, context.state);
}

export async function saveRunInputs(context: WorkflowContext): Promise<void> {
  await ensureDir(context.paths.runDir);
  await writeRunJson(context.paths.configPath, context.config);
  await writeRunJson(context.paths.manifestPath, {
    workflow: context.config.workflow,
    videoId: context.config.videoId,
    bucket: context.bucket,
    runDir: context.paths.runDir,
    apply: context.apply,
    video: context.video,
    createdAt: context.state.createdAt,
  });
}

export async function nodeInputHash(
  context: WorkflowContext,
  nodeId: string,
  inputs: string[] = [],
): Promise<string> {
  const hashes = await outputHashes(inputs);
  return sha256Text(
    JSON.stringify({
      nodeId,
      videoId: context.config.videoId,
      bucket: context.bucket,
      mission: context.config.mission,
      model: context.config.runtime.model,
      inputs: hashes,
    }),
  );
}

export async function shouldSkipNode(
  context: WorkflowContext,
  nodeId: string,
  inputHash: string,
  outputs: string[],
): Promise<boolean> {
  if (context.config.resume?.policy !== "skip_completed") return false;
  const previous = context.state.nodes[nodeId];
  if (!previous || previous.status !== "finished") return false;
  if (previous.inputHash !== inputHash) return false;
  const hashes = await outputHashes(outputs);
  return outputs.every((output) => hashes[output] !== "missing");
}
