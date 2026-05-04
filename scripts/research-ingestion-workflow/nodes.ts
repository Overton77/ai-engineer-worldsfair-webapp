/// <reference types="node" />

import { copyFile, mkdir, readFile, readdir } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";

import type { WorkflowContext, WorkflowNode } from "./types";
import {
  ensureDir,
  exists,
  outputHashes,
  readTextIfExists,
  sha256File,
  sha256Text,
  slugify,
  snippet,
  writeAtomic,
  writeJsonAtomic,
} from "./fs-utils";
import { captureCommand, runCommand } from "./commands";
import { extractJsonObject, runCursorAgent } from "./sdk-agent";

interface AgentFileResponse {
  files?: Array<{ path: string; content: string }>;
}

function videoUrl(context: WorkflowContext): string {
  return context.video.url ?? `https://www.youtube.com/watch?v=${context.config.videoId}`;
}

function projectFile(context: WorkflowContext, name: string): string {
  return resolve(context.paths.videoDir, name);
}

function researchFile(context: WorkflowContext, name: string): string {
  return resolve(context.paths.videoDir, "research", name);
}

function queriesFile(context: WorkflowContext, name: string): string {
  return resolve(context.paths.queriesDir, name);
}

function renderYamlValue(value: unknown): string {
  if (value == null || value === "") return '""';
  return JSON.stringify(String(value));
}

async function writeAgentFiles(
  context: WorkflowContext,
  node: WorkflowNode,
  agentResult: string,
): Promise<void> {
  let parsed: AgentFileResponse;
  try {
    parsed = extractJsonObject(agentResult) as AgentFileResponse;
  } catch {
    await writeAtomic(researchFile(context, `${node.id}.raw.md`), agentResult);
    return;
  }

  if (!Array.isArray(parsed.files) || parsed.files.length === 0) {
    await writeAtomic(researchFile(context, `${node.id}.raw.json`), agentResult);
    return;
  }

  for (const file of parsed.files) {
    const destination = resolve(context.paths.videoDir, file.path);
    if (!destination.startsWith(context.paths.videoDir)) {
      throw new Error(`Agent tried to write outside project folder: ${file.path}`);
    }
    await writeAtomic(destination, file.content);
  }
}

function jsonFilePrompt(
  context: WorkflowContext,
  nodeName: string,
  task: string,
  outputFiles: string[],
  extraContext: string,
): string {
  return `You are one fresh Cursor research agent working on a slice of an AI Engineer YouTube ingestion workflow.

Do not edit files directly. Do not call shell commands. Return exactly one JSON object with this shape:
{
  "files": [
    { "path": "relative/path/from/project/folder", "content": "complete file content" }
  ]
}

The only allowed output file paths are:
${outputFiles.map((path) => `- ${path}`).join("\n")}

Mission:
${context.config.mission}

Video:
- id: ${context.config.videoId}
- bucket: ${context.bucket}
- title: ${context.video.title}
- url: ${videoUrl(context)}
- published_at: ${context.video.published_at ?? ""}

Task for ${nodeName}:
${task}

Context:
${extraContext}
`;
}

async function runAgentNode(
  context: WorkflowContext,
  node: WorkflowNode,
  task: string,
  outputFiles: string[],
  extraContext: string,
): Promise<void> {
  if (!context.config.safety.runAgents) {
    for (const outputFile of outputFiles) {
      const destination = resolve(context.paths.videoDir, outputFile);
      if (await exists(destination)) continue;
      const content =
        outputFile.endsWith(".json") || outputFile.endsWith(".jsonl")
          ? `${JSON.stringify({ skipped: true, node: node.id, task }, null, 2)}\n`
          : `# ${node.label}\n\nAgent execution skipped by workflow config.\n\n## Intended Task\n\n${task}\n`;
      await writeAtomic(destination, content);
    }
    return;
  }

  const prompt = jsonFilePrompt(context, node.id, task, outputFiles, extraContext);
  const result = await runCursorAgent(context, node.id, prompt);
  context.state.nodes[node.id] = {
    ...context.state.nodes[node.id],
    agentId: result.agentId,
    runId: result.runId,
    durationMs: result.durationMs,
  };
  await writeAgentFiles(context, node, result.result);
}

async function updateProjectAppend(context: WorkflowContext, heading: string, line: string) {
  const path = projectFile(context, "_project.md");
  const existing = await readTextIfExists(path);
  if (!existing || existing.includes(line)) return;
  await writeAtomic(path, `${existing.trimEnd()}\n\n### ${heading}\n- ${line}\n`);
}

async function missionInbox(context: WorkflowContext): Promise<void> {
  const slug = slugify(context.video.title ?? context.config.videoId);
  const path = resolve(context.paths.inboxDir, `${context.config.videoId}-${slug}-mission.md`);
  const now = new Date().toISOString();
  await writeAtomic(
    path,
    `---\ntype: research-mission\nvideo_id: ${context.config.videoId}\nbucket: ${context.bucket}\ngenerated_at: ${now}\ngenerator: research-ingestion-workflow\nsource:\n  - ${videoUrl(context)}\n---\n\n# Research Mission: ${context.video.title}\n\n${context.config.mission}\n\n## Expected Outputs\n\n- Initial summary and structured entities\n- Parallel research artifacts for people, organizations, libraries, repos, products, papers, and news/web sources\n- DB inspection and dry-run ingestion reports\n- Optimized summary and pre-course outline\n`,
  );
}

async function initProject(context: WorkflowContext): Promise<void> {
  await ensureDir(context.paths.videoDir);
  await ensureDir(context.paths.queriesDir);
  await ensureDir(resolve(context.paths.videoDir, "research"));

  const projectPath = projectFile(context, "_project.md");
  if (await exists(projectPath)) return;

  const template = resolve(context.paths.vaultRoot, "_templates", "_project.md");
  if (await exists(template)) {
    await copyFile(template, projectPath);
  }

  const now = new Date().toISOString();
  const slug = slugify(context.video.title ?? context.config.videoId);
  const sourceText = `---
type: video-project
video_id: ${context.config.videoId}
slug: ${slug}
title: ${renderYamlValue(context.video.title)}
bucket: ${context.bucket}
status: in_progress
source:
  - ${videoUrl(context)}
generator:
  tool: research-ingestion-workflow
  version: 0.1
generated_at: ${now}
provenance:
  bucket: ${context.bucket}
  video_id: ${context.config.videoId}
youtube:
  url: ${videoUrl(context)}
  channel: ${renderYamlValue(context.video.channel ?? "aiengineerchannel")}
  published_at: ${renderYamlValue(context.video.published_at ?? "")}
  duration_seconds: ${context.video.duration_seconds ?? 0}
  description_pulled_at: ${now}
speakers: []
links_in_description: []
stage_status:
  s01_init:                  done
  s02_transcript:            planned
  s03_summary:               planned
  s04_index:                 planned
  s05_smoke_query:           planned
  s06_entities:              planned
  s07_dossiers:              planned
  s08_code_harvest:          planned
  s09_external:              planned
  s10_filtered_query:        planned
  s11_module_draft:          planned
artifacts:
  s02_transcript: { path: transcript.txt,    sha256: "", generated_at: "", generator: "" }
  s03_summary:    { path: summary.md,        sha256: "", generated_at: "", generator: "" }
  s04_index:      { path: chunks.jsonl,      sha256: "", generated_at: "", generator: "" }
  s06_entities:   { path: entities.json,     sha256: "", generated_at: "", generator: "" }
  s11_module_draft: { path: module-draft.md, promoted_to: "", sha256: "", generated_at: "", generator: "" }
promotions:
  entities_promoted_to: []
  repos_promoted_to: []
  external_promoted_to: []
  module_promoted_to: ""
last_updated: ${now}
---

# ${context.video.title}

## Why this video is in this bucket

${context.config.mission}

## Stage notes

### s01 init
- Folder initialized by \`research-ingestion-workflow\`.
`;
  await writeAtomic(projectPath, sourceText);
}

async function transcriptCapture(context: WorkflowContext): Promise<void> {
  const transcriptPath = projectFile(context, "transcript.txt");
  if (await exists(transcriptPath)) return;

  if (!context.config.safety.runTranscript) {
    await writeAtomic(
      transcriptPath,
      `[00:00] Transcript capture skipped. Run with --run-transcript to fetch captions for ${videoUrl(context)}.\n\nDescription:\n${context.video.description ?? ""}\n`,
    );
    return;
  }

  const scriptCwd = resolve(context.paths.aiwikiRoot, ".agents", "skills", "youtube-transcript");
  const transcript = await captureCommand(
    "TRANSCRIPT",
    "uv",
    ["run", "scripts/get_transcript.py", "--timestamps", "--", context.config.videoId],
    scriptCwd,
  );
  await writeAtomic(transcriptPath, transcript);
}

async function initialSummary(context: WorkflowContext, node: WorkflowNode): Promise<void> {
  await runAgentNode(
    context,
    node,
    "Create the initial not-yet-optimized summary. Follow the summary template sections. Be faithful to transcript and description, and include provenance notes.",
    ["summary.md"],
    `Transcript:\n${await snippet(projectFile(context, "transcript.txt"), 45000)}\n\nDescription:\n${context.video.description ?? ""}`,
  );
}

async function entityExtraction(context: WorkflowContext, node: WorkflowNode): Promise<void> {
  const transcriptHash = await sha256File(projectFile(context, "transcript.txt")).catch(() => "");
  const summaryHash = await sha256File(projectFile(context, "summary.md")).catch(() => "");
  await runAgentNode(
    context,
    node,
    "Extract structured entities for downstream research and ingestion. Produce conservative JSON matching the entities schema: people, organizations, libraries, repos, papers, slides, topics, external_urls. Include evidence and confidence for every entity. Write the same JSON to entities.raw.json and entities.json.",
    ["entities.raw.json", "entities.json"],
    `Input hashes: transcript=${transcriptHash} summary=${summaryHash}\n\nSchema guidance:\n${await snippet(resolve(context.paths.vaultRoot, "_templates", "entities.schema.md"), 20000)}\n\nSummary:\n${await snippet(projectFile(context, "summary.md"), 35000)}\n\nTranscript excerpt:\n${await snippet(projectFile(context, "transcript.txt"), 25000)}\n\nDescription:\n${context.video.description ?? ""}`,
  );
}

async function researchPlan(context: WorkflowContext, node: WorkflowNode): Promise<void> {
  await runAgentNode(
    context,
    node,
    "Create a normalized research task plan. Split tasks by people/organizations, libraries/repos/products, papers/news, and docs/web sources. Include target artifact paths and source URLs to procure.",
    ["research/research-plan.json"],
    `Entities:\n${await snippet(projectFile(context, "entities.json"), 35000)}\n\nSummary:\n${await snippet(projectFile(context, "summary.md"), 25000)}`,
  );
}

async function researchSlice(
  context: WorkflowContext,
  node: WorkflowNode,
  focus: string,
  output: string,
): Promise<void> {
  await runAgentNode(
    context,
    node,
    `Research this slice: ${focus}. Produce a concise markdown artifact with claims, source URLs, ingestion notes, and unresolved questions. Do not invent facts.`,
    [output],
    `Research plan:\n${await snippet(researchFile(context, "research-plan.json"), 30000)}\n\nEntities:\n${await snippet(projectFile(context, "entities.json"), 30000)}`,
  );
}

async function researchSynthesis(context: WorkflowContext, node: WorkflowNode): Promise<void> {
  await runAgentNode(
    context,
    node,
    "Synthesize all parallel research outputs into a canonical research report. Resolve duplicate/conflicting entities, identify which sources should be promoted to 02_entities or 03_external, and list ingestion blockers.",
    ["research/research-synthesis.md"],
    `People/orgs:\n${await snippet(researchFile(context, "people-organizations.md"), 20000)}

Libraries/repos/products:\n${await snippet(researchFile(context, "libraries-repos-products.md"), 20000)}

Papers/news:\n${await snippet(researchFile(context, "papers-news.md"), 20000)}

Docs/web:\n${await snippet(researchFile(context, "docs-web.md"), 20000)}`,
  );
}

async function inspectDb(context: WorkflowContext): Promise<void> {
  if (!context.config.safety.runIngestion) {
    const existingReport = projectFile(context, "db_inspection.md");
    if (!(await exists(existingReport))) {
      await writeAtomic(
        existingReport,
        `---\ntype: db-inspection\nvideo_id: ${context.config.videoId}\nbucket: ${context.bucket}\ngenerated_at: ${new Date().toISOString()}\ntotals:\n  EXISTS: 0\n  MISSING: 0\n  FUZZY_MATCH: 0\n  NEEDS_REVIEW: 0\n  ERROR: 0\n---\n\n# DB inspection skipped\n\nIngestion was skipped with \`--skip-ingestion\`; this placeholder is only for DAG continuity.\n`,
      );
    }
    await writeAtomic(
      researchFile(context, "ingestion-skipped.md"),
      `# Ingestion Skipped\n\nThe workflow continued toward a course/module outline without Supabase ingestion.\n\nExisting inspection report, if present, was left intact.\n`,
    );
    return;
  }

  await runCommand(
    "DB INSPECTION",
    "pnpm",
    [
      "exec",
      "tsx",
      "scripts/inspect-corpus.ts",
      "--video-id",
      context.config.videoId,
      "--bucket",
      context.bucket,
      "--vault-root",
      context.paths.vaultRoot,
    ],
    context.paths.appRoot,
  );

  if (context.config.safety.stopOnInspectionWarnings) {
    const report = await readTextIfExists(projectFile(context, "db_inspection.md"));
    const fuzzy = Number(report.match(/^\s*FUZZY_MATCH:\s*(\d+)/m)?.[1] ?? "0");
    const review = Number(report.match(/^\s*NEEDS_REVIEW:\s*(\d+)/m)?.[1] ?? "0");
    const errors = Number(report.match(/^\s*ERROR:\s*(\d+)/m)?.[1] ?? "0");
    const hasWarnings = fuzzy > 0 || review > 0 || errors > 0;
    if (hasWarnings) {
      throw new Error("db_inspection.md contains FUZZY-MATCH, NEEDS-REVIEW, or ERROR. Resolve before ingestion.");
    }
  }
}

async function ingestEntities(context: WorkflowContext): Promise<void> {
  if (!context.config.safety.runIngestion) {
    console.log("[ingest] skipped by --skip-ingestion");
    return;
  }

  const baseFlags = [
    "--video-id",
    context.config.videoId,
    "--bucket",
    context.bucket,
    "--vault-root",
    context.paths.vaultRoot,
  ];
  const dryFlags = context.apply ? [] : ["--dry-run"];

  await runCommand(
    "UPSERT ENTITIES",
    "pnpm",
    ["exec", "tsx", "scripts/upsert-entities.ts", ...baseFlags, ...dryFlags],
    context.paths.appRoot,
  );
  await runCommand(
    "UPSERT LINKS",
    "pnpm",
    ["exec", "tsx", "scripts/upsert-link-tables.ts", ...baseFlags, ...dryFlags],
    context.paths.appRoot,
  );
}

async function optimizedSummary(context: WorkflowContext, node: WorkflowNode): Promise<void> {
  await runAgentNode(
    context,
    node,
    "Write summary.optimized.md for retrieval chunking. Use H2/H3 sections, inline slug-style references where known, and incorporate verified research without overclaiming.",
    ["summary.optimized.md"],
    `Initial summary:\n${await snippet(projectFile(context, "summary.md"), 30000)}

Entities:\n${await snippet(projectFile(context, "entities.json"), 30000)}

Research synthesis:\n${await snippet(researchFile(context, "research-synthesis.md"), 30000)}`,
  );
}

async function chunkEmbed(context: WorkflowContext): Promise<void> {
  if (!context.config.safety.runIngestion) {
    const chunksPath = projectFile(context, "chunks.jsonl");
    if (!(await exists(chunksPath))) await writeAtomic(chunksPath, "");
    await writeAtomic(
      researchFile(context, "chunk-embed-skipped.md"),
      `# Chunk And Embed Skipped\n\nThe workflow skipped ingestion, so no chunks were embedded or upserted.\n`,
    );
    return;
  }

  const dryFlags = context.apply ? [] : ["--dry-run"];
  await runCommand(
    "CHUNK VIDEO ARTIFACTS",
    "uv",
    [
      "run",
      "python",
      "scripts/chunk_video_artifacts.py",
      `--video-id=${context.config.videoId}`,
      "--bucket",
      context.bucket,
      "--vault-root",
      context.paths.vaultRoot,
    ],
    context.paths.pythonEnvRoot,
  );
  await runCommand(
    "UPSERT CHUNKS",
    "pnpm",
    [
      "exec",
      "tsx",
      "scripts/upsert-chunks.ts",
      "--video-id",
      context.config.videoId,
      "--bucket",
      context.bucket,
      "--vault-root",
      context.paths.vaultRoot,
      ...dryFlags,
    ],
    context.paths.appRoot,
  );

  if (context.config.safety.runBackfill) {
    await runCommand(
      "BACKFILL SEARCH TEXT AND EMBEDDINGS",
      "pnpm",
      [
        "exec",
        "tsx",
        "scripts/backfill-search-text-and-embeddings.ts",
        "--video-id",
        context.config.videoId,
        "--bucket",
        context.bucket,
        "--vault-root",
        context.paths.vaultRoot,
        ...(context.apply ? ["--force"] : ["--dry-run"]),
      ],
      context.paths.appRoot,
    );
  }
}

async function retrievalVerify(context: WorkflowContext): Promise<void> {
  const queries = [
    {
      query: `What is the core thesis of ${context.video.title}?`,
      matchCount: 5,
      notes: "General grounding query for the optimized summary.",
    },
    {
      query: "Which people, organizations, libraries, repos, and papers matter for this talk?",
      matchCount: 5,
      notes: "Entity coverage query.",
    },
  ];
  const queriesJson = queriesFile(context, "s10_research_workflow_queries.json");
  await writeJsonAtomic(queriesJson, queries);

  if (!context.config.safety.runSmokeQueries) {
    await writeAtomic(
      queriesFile(context, "s10_research_workflow.md"),
      `# Retrieval verification skipped\n\nQueries were written to \`${basename(queriesJson)}\`. Run with --run-smoke-queries after chunks are in Supabase.\n`,
    );
    return;
  }

  await runCommand(
    "SMOKE QUERY",
    "pnpm",
    [
      "exec",
      "tsx",
      "scripts/smoke-query.ts",
      "--video-id",
      context.config.videoId,
      "--bucket",
      context.bucket,
      "--vault-root",
      context.paths.vaultRoot,
      "--slug",
      "s10_research_workflow",
      "--queries-json",
      relative(context.paths.appRoot, queriesJson),
    ],
    context.paths.appRoot,
  );
}

async function courseOutline(context: WorkflowContext, node: WorkflowNode): Promise<void> {
  await runAgentNode(
    context,
    node,
    "Create a pre-course creation outline and module draft. Use the optimized summary, verified entities, research synthesis, and retrieval notes. Show where the module fits into the bucket course.",
    ["module-draft.md", "research/pre-course-outline.md"],
    `Optimized summary:\n${await snippet(projectFile(context, "summary.optimized.md"), 35000)}

Research synthesis:\n${await snippet(researchFile(context, "research-synthesis.md"), 25000)}

Entities:\n${await snippet(projectFile(context, "entities.json"), 25000)}

Retrieval report:\n${await snippet(queriesFile(context, "s10_research_workflow.md"), 12000)}`,
  );
}

export function buildNodes(context: WorkflowContext): WorkflowNode[] {
  return [
    {
      id: "mission.inbox",
      label: "Mission inbox file",
      kind: "deterministic",
      dependsOn: [],
      outputs: [
        resolve(
          context.paths.inboxDir,
          `${context.config.videoId}-${slugify(context.video.title ?? context.config.videoId)}-mission.md`,
        ),
      ],
      run: missionInbox,
    },
    {
      id: "project.init",
      label: "Init per-video project",
      kind: "deterministic",
      dependsOn: ["mission.inbox"],
      outputs: [projectFile(context, "_project.md")],
      run: initProject,
    },
    {
      id: "transcript.capture",
      label: "Capture transcript",
      kind: "deterministic",
      dependsOn: ["project.init"],
      outputs: [projectFile(context, "transcript.txt")],
      run: transcriptCapture,
    },
    {
      id: "summary.initial",
      label: "Initial summary",
      kind: "cursor-agent",
      dependsOn: ["transcript.capture"],
      outputs: [projectFile(context, "summary.md")],
      run: initialSummary,
    },
    {
      id: "entities.extract",
      label: "Structured entity extraction",
      kind: "cursor-agent",
      dependsOn: ["summary.initial"],
      outputs: [projectFile(context, "entities.raw.json"), projectFile(context, "entities.json")],
      run: entityExtraction,
    },
    {
      id: "research.plan",
      label: "Research task plan",
      kind: "cursor-agent",
      dependsOn: ["entities.extract"],
      outputs: [researchFile(context, "research-plan.json")],
      run: researchPlan,
    },
    {
      id: "research.people_orgs",
      label: "People and organizations research",
      kind: "cursor-agent",
      dependsOn: ["research.plan"],
      outputs: [researchFile(context, "people-organizations.md")],
      run: (ctx, node) =>
        researchSlice(ctx, node, "people and organizations", "research/people-organizations.md"),
    },
    {
      id: "research.libs_repos_products",
      label: "Libraries, repos, and products research",
      kind: "cursor-agent",
      dependsOn: ["research.plan"],
      outputs: [researchFile(context, "libraries-repos-products.md")],
      run: (ctx, node) =>
        researchSlice(
          ctx,
          node,
          "libraries, GitHub repos, documentation, and products",
          "research/libraries-repos-products.md",
        ),
    },
    {
      id: "research.papers_news",
      label: "Papers and news research",
      kind: "cursor-agent",
      dependsOn: ["research.plan"],
      outputs: [researchFile(context, "papers-news.md")],
      run: (ctx, node) =>
        researchSlice(ctx, node, "papers, arxiv references, news, and announcements", "research/papers-news.md"),
    },
    {
      id: "research.docs_web",
      label: "Docs and web source harvest",
      kind: "cursor-agent",
      dependsOn: ["research.plan"],
      outputs: [researchFile(context, "docs-web.md")],
      run: (ctx, node) =>
        researchSlice(ctx, node, "official docs, websites, and web articles", "research/docs-web.md"),
    },
    {
      id: "research.synthesize",
      label: "Research synthesis",
      kind: "cursor-agent",
      dependsOn: [
        "research.people_orgs",
        "research.libs_repos_products",
        "research.papers_news",
        "research.docs_web",
      ],
      outputs: [researchFile(context, "research-synthesis.md")],
      run: researchSynthesis,
    },
    {
      id: "db.inspect",
      label: "DB inspection gate",
      kind: "deterministic",
      dependsOn: ["research.synthesize"],
      outputs: [projectFile(context, "db_inspection.md")],
      run: inspectDb,
    },
    {
      id: "ingest.entities_links",
      label: "Entity and link ingestion",
      kind: "deterministic",
      dependsOn: ["db.inspect"],
      outputs: [],
      run: ingestEntities,
    },
    {
      id: "summary.optimize",
      label: "Optimized chunkable summary",
      kind: "cursor-agent",
      dependsOn: ["ingest.entities_links"],
      outputs: [projectFile(context, "summary.optimized.md")],
      run: optimizedSummary,
    },
    {
      id: "chunk.embed",
      label: "Chunk, embed, and upsert",
      kind: "deterministic",
      dependsOn: ["summary.optimize"],
      outputs: [projectFile(context, "chunks.jsonl")],
      run: chunkEmbed,
    },
    {
      id: "retrieval.verify",
      label: "Retrieval smoke tests",
      kind: "deterministic",
      dependsOn: ["chunk.embed"],
      outputs: [queriesFile(context, "s10_research_workflow.md")],
      run: retrievalVerify,
    },
    {
      id: "course.outline",
      label: "Pre-course outline",
      kind: "cursor-agent",
      dependsOn: ["retrieval.verify"],
      outputs: [projectFile(context, "module-draft.md"), researchFile(context, "pre-course-outline.md")],
      run: courseOutline,
    },
  ];
}

export async function inspectOutputs(nodes: WorkflowNode[]): Promise<Record<string, Record<string, string>>> {
  const result: Record<string, Record<string, string>> = {};
  for (const node of nodes) result[node.id] = await outputHashes(node.outputs);
  return result;
}
