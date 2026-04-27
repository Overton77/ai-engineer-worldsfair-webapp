import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import {
  awardCourseCompletionXp,
  awardModuleCompletionXp,
  COURSE_COMPLETION_XP,
  MODULE_COMPLETION_XP,
} from "./xp";

type RpcCall = {
  fn: string;
  args: Record<string, unknown>;
};

function buildClient(result: {
  awarded: boolean;
  score_event_id?: string | null;
  points?: number | null;
}) {
  const calls: RpcCall[] = [];
  const rpc = vi.fn((fn: string, args: Record<string, unknown>) => {
    calls.push({ fn, args });
    return Promise.resolve({
      data: [
        {
          awarded: result.awarded,
          score_event_id: result.score_event_id ?? null,
          points: result.points ?? null,
        },
      ],
      error: null,
    });
  });

  return {
    client: { rpc } as unknown as Parameters<typeof awardModuleCompletionXp>[1],
    calls,
  };
}

describe("XP award helper", () => {
  it("is server-only", () => {
    const source = readFileSync("lib/db/xp.ts", "utf8");
    expect(source).toContain('import "server-only";');
  });

  it("awards default module completion XP", async () => {
    const { client, calls } = buildClient({
      awarded: true,
      score_event_id: "event-1",
      points: MODULE_COMPLETION_XP,
    });

    const result = await awardModuleCompletionXp(
      { userId: "user-1", moduleId: "module-1" },
      client,
    );

    expect(result).toEqual({
      awarded: true,
      scoreEventId: "event-1",
      points: MODULE_COMPLETION_XP,
    });
    expect(calls[0]).toEqual({
      fn: "award_xp_event",
      args: {
        p_user_id: "user-1",
        p_kind: "module-quiz",
        p_ref_kind: "module",
        p_ref_id: "module-1",
        p_points: MODULE_COMPLETION_XP,
        p_metadata: {},
      },
    });
  });

  it("reports duplicate module awards without another award", async () => {
    const { client } = buildClient({
      awarded: false,
      score_event_id: "event-1",
      points: MODULE_COMPLETION_XP,
    });

    const result = await awardModuleCompletionXp(
      { userId: "user-1", moduleId: "module-1" },
      client,
    );

    expect(result).toEqual({
      awarded: false,
      scoreEventId: "event-1",
      points: MODULE_COMPLETION_XP,
    });
  });

  it("awards default course completion XP", async () => {
    const { client, calls } = buildClient({
      awarded: true,
      score_event_id: "event-2",
      points: COURSE_COMPLETION_XP,
    });

    const result = await awardCourseCompletionXp(
      { userId: "user-1", courseId: "course-1" },
      client,
    );

    expect(result).toEqual({
      awarded: true,
      scoreEventId: "event-2",
      points: COURSE_COMPLETION_XP,
    });
    expect(calls[0].args).toMatchObject({
      p_kind: "course-completion",
      p_ref_kind: "course",
      p_ref_id: "course-1",
      p_points: COURSE_COMPLETION_XP,
    });
  });

  it("uses metadata XP override as awarded points", async () => {
    const { client, calls } = buildClient({
      awarded: true,
      score_event_id: "event-3",
      points: 40,
    });

    const result = await awardModuleCompletionXp(
      {
        userId: "user-1",
        moduleId: "module-1",
        metadata: { xp: 40, source: "module_metadata" },
      },
      client,
    );

    expect(result.points).toBe(40);
    expect(calls[0].args).toMatchObject({
      p_points: 40,
      p_metadata: { xp: 40, source: "module_metadata" },
    });
  });
});
