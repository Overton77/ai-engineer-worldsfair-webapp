/// <reference types="node" />

import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

import type { CliOptions, WorkflowConfig, WorkflowCommand } from "./types";
import { exists, readJson } from "./fs-utils";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

function readFlag(argv: string[], name: string): string | undefined {
  const idx = argv.indexOf(name);
  if (idx === -1) return undefined;
  return argv[idx + 1];
}

function hasFlag(argv: string[], name: string): boolean {
  return argv.includes(name);
}

export function parseCli(argv = process.argv.slice(2)): CliOptions {
  const command = (argv[0] ?? "doctor") as WorkflowCommand;
  if (!["doctor", "plan", "run", "resume"].includes(command)) {
    throw new Error(`Unknown command "${command}". Use doctor, plan, run, or resume.`);
  }

  const args = argv.slice(1);
  const maxParallel = readFlag(args, "--max-parallel-agents");

  return {
    command,
    configPath: readFlag(args, "--config"),
    videoId: readFlag(args, "--video-id"),
    bucket: readFlag(args, "--bucket"),
    mission: readFlag(args, "--mission"),
    vaultRoot: readFlag(args, "--vault-root"),
    model: readFlag(args, "--model"),
    maxParallelAgents: maxParallel ? Number(maxParallel) : undefined,
    apply: hasFlag(args, "--apply"),
    dryRun: hasFlag(args, "--dry-run"),
    runDir: readFlag(args, "--run-dir"),
    runAgents: hasFlag(args, "--run-agents"),
    skipAgents: hasFlag(args, "--skip-agents"),
    runTranscript: hasFlag(args, "--run-transcript"),
    skipTranscript: hasFlag(args, "--skip-transcript"),
    skipIngestion: hasFlag(args, "--skip-ingestion"),
    runSmokeQueries: hasFlag(args, "--run-smoke-queries"),
    runBackfill: hasFlag(args, "--run-backfill"),
  };
}

export async function loadWorkflowConfig(options: CliOptions): Promise<WorkflowConfig> {
  const appRoot = process.cwd();
  const defaultVaultRoot = resolve(
    appRoot,
    "..",
    "aiwiki",
    "ai-intelligence-vault",
    "ai-intelligence",
  );

  const base: WorkflowConfig =
    options.configPath && (await exists(resolve(appRoot, options.configPath)))
      ? await readJson<WorkflowConfig>(resolve(appRoot, options.configPath))
      : {
          workflow: "youtube-research-to-course",
          videoId: "",
          mission:
            "Produce entity-grounded research artifacts, verified ingestion, and a pre-course outline.",
          vaultRoot: defaultVaultRoot,
          runtime: {
            provider: "cursor-sdk",
            model: process.env.CURSOR_MODEL ?? "composer-2",
            maxParallelAgents: 3,
            settingSources: [],
          },
          safety: {
            defaultDryRun: true,
            requireDbInspection: true,
            stopOnInspectionWarnings: true,
            allowSupabaseWrites: false,
            runAgents: true,
            runTranscript: false,
            runIngestion: true,
            runSmokeQueries: false,
            runBackfill: false,
          },
          resume: { policy: "skip_completed" },
        };

  const config: WorkflowConfig = {
    ...base,
    videoId: options.videoId ?? base.videoId,
    bucket: options.bucket ?? base.bucket,
    mission: options.mission ?? base.mission,
    vaultRoot: resolve(appRoot, options.vaultRoot ?? base.vaultRoot),
    runtime: {
      ...base.runtime,
      model: options.model ?? base.runtime.model,
      maxParallelAgents:
        options.maxParallelAgents ?? base.runtime.maxParallelAgents ?? 3,
    },
    safety: {
      ...base.safety,
      allowSupabaseWrites: options.apply || base.safety.allowSupabaseWrites,
      defaultDryRun: options.apply ? false : options.dryRun || base.safety.defaultDryRun,
      runAgents: options.skipAgents ? false : options.runAgents || base.safety.runAgents,
      runTranscript: options.skipTranscript
        ? false
        : options.runTranscript || base.safety.runTranscript,
      runIngestion: options.skipIngestion ? false : base.safety.runIngestion,
      runSmokeQueries: options.runSmokeQueries || base.safety.runSmokeQueries,
      runBackfill: options.runBackfill || base.safety.runBackfill,
    },
    resume: {
      policy: base.resume?.policy ?? "skip_completed",
      runDir: options.runDir ?? base.resume?.runDir,
    },
  };

  if (!config.videoId) {
    throw new Error("--video-id or config.videoId is required");
  }

  return config;
}
