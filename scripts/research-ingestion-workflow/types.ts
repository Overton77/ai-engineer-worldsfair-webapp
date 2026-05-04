/// <reference types="node" />

export type WorkflowCommand = "doctor" | "plan" | "run" | "resume";

export type NodeKind = "deterministic" | "cursor-agent";

export type NodeStatus =
  | "pending"
  | "running"
  | "finished"
  | "failed"
  | "skipped";

export interface RuntimeConfig {
  provider: "cursor-sdk";
  model: string;
  maxParallelAgents: number;
  settingSources: string[];
}

export interface SafetyConfig {
  defaultDryRun: boolean;
  requireDbInspection: boolean;
  stopOnInspectionWarnings: boolean;
  allowSupabaseWrites: boolean;
  runAgents: boolean;
  runTranscript: boolean;
  runIngestion: boolean;
  runSmokeQueries: boolean;
  runBackfill: boolean;
}

export interface WorkflowConfig {
  workflow: "youtube-research-to-course";
  videoId: string;
  bucket?: string;
  mission: string;
  vaultRoot: string;
  runtime: RuntimeConfig;
  safety: SafetyConfig;
  resume?: {
    runDir?: string;
    policy: "skip_completed" | "rerun";
  };
}

export interface VideoCatalogRecord {
  video_id: string;
  title: string;
  url?: string;
  description?: string;
  published_at?: string;
  duration_seconds?: number;
  category?: string;
  channel?: string;
  [key: string]: unknown;
}

export interface WorkflowPaths {
  appRoot: string;
  repoRoot: string;
  vaultRoot: string;
  aiwikiRoot: string;
  pythonEnvRoot: string;
  videoDir: string;
  queriesDir: string;
  inboxDir: string;
  runDir: string;
  statePath: string;
  manifestPath: string;
  configPath: string;
}

export interface WorkflowNode {
  id: string;
  label: string;
  kind: NodeKind;
  dependsOn: string[];
  outputs: string[];
  run: (context: WorkflowContext, node: WorkflowNode) => Promise<void>;
}

export interface NodeState {
  id: string;
  status: NodeStatus;
  kind: NodeKind;
  inputHash?: string;
  outputHashes?: Record<string, string>;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  agentId?: string;
  runId?: string;
  error?: string;
}

export interface WorkflowState {
  workflow: string;
  videoId: string;
  bucket: string;
  runDir: string;
  createdAt: string;
  updatedAt: string;
  apply: boolean;
  nodes: Record<string, NodeState>;
}

export interface WorkflowContext {
  config: WorkflowConfig;
  paths: WorkflowPaths;
  video: VideoCatalogRecord;
  bucket: string;
  apply: boolean;
  state: WorkflowState;
}

export interface CliOptions {
  command: WorkflowCommand;
  configPath?: string;
  videoId?: string;
  bucket?: string;
  mission?: string;
  vaultRoot?: string;
  model?: string;
  maxParallelAgents?: number;
  apply: boolean;
  dryRun: boolean;
  runDir?: string;
  runAgents?: boolean;
  skipAgents?: boolean;
  runTranscript?: boolean;
  skipTranscript?: boolean;
  skipIngestion?: boolean;
  runSmokeQueries?: boolean;
  runBackfill?: boolean;
}
