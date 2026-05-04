/// <reference types="node" />

import { Agent, Cursor, CursorAgentError } from "@cursor/sdk";

declare global {
  interface SymbolConstructor {
    readonly asyncDispose: symbol;
  }
}

import type { WorkflowContext } from "./types";

export async function assertModelAvailable(context: WorkflowContext): Promise<number> {
  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) throw new Error("CURSOR_API_KEY is not set");

  const models = await Cursor.models.list({ apiKey });
  if (!models.some((model) => model.id === context.config.runtime.model)) {
    throw new Error(
      `Cursor model ${context.config.runtime.model} is not available. Run research:doctor or set --model.`,
    );
  }
  return models.length;
}

export async function runCursorAgent(
  context: WorkflowContext,
  name: string,
  prompt: string,
): Promise<{ agentId: string; runId: string; result: string; durationMs?: number }> {
  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) throw new Error("CURSOR_API_KEY is not set");

  if (!context.config.safety.runAgents) {
    return {
      agentId: "skipped",
      runId: "skipped",
      result: JSON.stringify({
        files: [
          {
            path: `${name}.agent-skipped.md`,
            content: `# ${name}\n\nAgent execution was skipped by config.\n`,
          },
        ],
      }),
    };
  }

  const agent = await Agent.create({
    apiKey,
    name,
    model: { id: context.config.runtime.model },
    local: {
      cwd: context.paths.appRoot,
      settingSources: context.config.runtime.settingSources as never[],
      ...(process.env.CURSOR_SDK_SANDBOX === "1"
        ? { sandboxOptions: { enabled: true } }
        : {}),
    },
  });

  try {
    const run = await agent.send(prompt);
    console.log(`[agent:${name}] agent=${agent.agentId} run=${run.id}`);
    const result = await run.wait();
    if (result.status !== "finished") {
      throw new Error(`Agent ${name} ended with status ${result.status}`);
    }
    return {
      agentId: agent.agentId,
      runId: result.id,
      result: result.result ?? "",
      durationMs: result.durationMs,
    };
  } catch (error) {
    if (error instanceof CursorAgentError) {
      throw new Error(
        `Cursor SDK startup failed for ${name}: ${error.message} retryable=${error.isRetryable}`,
      );
    }
    throw error;
  } finally {
    await agent[Symbol.asyncDispose]();
  }
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {
        // Agent JSON can contain markdown fences inside string content; fall
        // back to extracting the outer JSON object below.
      }
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error("Agent did not return parseable JSON");
  }
}
