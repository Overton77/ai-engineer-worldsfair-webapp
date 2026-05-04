/// <reference types="node" />

import "dotenv/config";

import { Agent, Cursor, CursorAgentError } from "@cursor/sdk";

declare global {
  interface SymbolConstructor {
    readonly asyncDispose: symbol;
  }
}

type TaskResult = {
  name: string;
  agentId?: string;
  runId: string;
  status: string;
  durationMs?: number;
  result: string;
};

const MODEL = process.env.CURSOR_MODEL ?? "composer-2";
const apiKey = process.env.CURSOR_API_KEY;
const sandboxEnabled = process.env.CURSOR_SDK_SANDBOX === "1";

function requireApiKey() {
  if (!apiKey) {
    throw new Error("CURSOR_API_KEY is not set. Add it to the shell env or .env before running this script.");
  }
}

function compact(value: string | undefined, maxLength = 1200) {
  const text = (value ?? "").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

async function runOneShot(name: string, prompt: string): Promise<TaskResult> {
  requireApiKey();

  const agent = await Agent.create({
    apiKey,
    name,
    model: { id: MODEL },
    local: {
      cwd: process.cwd(),
      settingSources: [],
      ...(sandboxEnabled ? { sandboxOptions: { enabled: true } } : {}),
    },
  });

  try {
    const run = await agent.send(prompt);
    console.log(`[${name}] agent=${agent.agentId} run=${run.id}`);
    const result = await run.wait();

    return {
      name,
      agentId: agent.agentId,
      runId: result.id,
      status: result.status,
      durationMs: result.durationMs,
      result: compact(result.result),
    };
  } finally {
    await agent[Symbol.asyncDispose]();
  }
}

async function smoke() {
  requireApiKey();

  const models = await Cursor.models.list({ apiKey });
  const hasModel = models.some((model) => model.id === MODEL);
  if (!hasModel) {
    throw new Error(`Model ${MODEL} is not available. Try CURSOR_MODEL=auto or inspect pnpm cursor:models.`);
  }

  const result = await runOneShot(
    "cursor-sdk-smoke",
    "Do not inspect files or call tools. Reply with exactly: cursor-sdk-ok",
  );

  console.log(JSON.stringify({ model: MODEL, availableModels: models.length, result }, null, 2));
}

async function workflow() {
  const source =
    "A research workflow starts from an AI engineering YouTube video, summarizes it, embeds the summary, researches entities such as papers, libraries, people, companies, and products, then creates course modules and full courses.";

  const summary = await runOneShot(
    "research-summary",
    `Do not inspect files or call tools. Summarize this workflow in 4 concise bullets:\n\n${source}`,
  );

  const [entities, modules] = await Promise.all([
    runOneShot(
      "entity-research-plan",
      `Do not inspect files or call tools. Based only on this summary, propose a JSON list of entity research tasks for papers, libraries, people, companies, and products:\n\n${summary.result}`,
    ),
    runOneShot(
      "course-module-plan",
      `Do not inspect files or call tools. Based only on this summary, propose a compact course module outline with learning goals:\n\n${summary.result}`,
    ),
  ]);

  const synthesis = await runOneShot(
    "workflow-synthesis",
    `Do not inspect files or call tools. Combine these upstream outputs into a dependency-aware agent workflow. Include sequential steps and parallel groups.\n\nSummary:\n${summary.result}\n\nEntities:\n${entities.result}\n\nModules:\n${modules.result}`,
  );

  console.log(
    JSON.stringify(
      {
        model: MODEL,
        graph: {
          summary: summary.runId,
          parallel: [entities.runId, modules.runId],
          synthesis: synthesis.runId,
        },
        results: [summary, entities, modules, synthesis],
      },
      null,
      2,
    ),
  );
}

async function main() {
  const command = process.argv[2] ?? "smoke";

  if (command === "models") {
    requireApiKey();
    const models = await Cursor.models.list({ apiKey });
    console.log(models.map((model) => model.id).join("\n"));
    return;
  }

  if (command === "smoke") {
    await smoke();
    return;
  }

  if (command === "workflow") {
    await workflow();
    return;
  }

  throw new Error(`Unknown command "${command}". Use models, smoke, or workflow.`);
}

main().catch((error: unknown) => {
  if (error instanceof CursorAgentError) {
    console.error(`Cursor SDK startup failed: ${error.message}`);
    console.error(`retryable=${error.isRetryable}`);
    process.exit(1);
  }

  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
