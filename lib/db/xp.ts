import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createServiceClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database.types";

type ServiceClient = SupabaseClient<Database>;

export type XpAwardMetadata = Record<string, Json | undefined> & {
  xp?: Json;
};

export type XpAwardResult = {
  awarded: boolean;
  scoreEventId: string | null;
  points: number;
};

export const MODULE_COMPLETION_XP = 25;
export const COURSE_COMPLETION_XP = 100;

function getClient(client?: ServiceClient): ServiceClient {
  return client ?? createServiceClient();
}

function pointsFromMetadata(
  metadata: XpAwardMetadata | null | undefined,
  defaultPoints: number,
): number {
  const xp = metadata?.xp;
  return typeof xp === "number" && Number.isFinite(xp) && xp >= 0
    ? Math.floor(xp)
    : defaultPoints;
}

type AwardXpEventInput = {
  userId: string;
  kind: "module-quiz" | "course-completion";
  refKind: "module" | "course";
  refId: string;
  defaultPoints: number;
  metadata?: XpAwardMetadata | null;
  sourceAttemptId?: string | null;
};

export async function awardXpEvent(
  input: AwardXpEventInput,
  client?: ServiceClient,
): Promise<XpAwardResult> {
  const points = pointsFromMetadata(input.metadata, input.defaultPoints);
  const sb = getClient(client);
  const { data, error } = await sb.rpc("award_xp_event", {
    p_user_id: input.userId,
    p_kind: input.kind,
    p_ref_kind: input.refKind,
    p_ref_id: input.refId,
    p_points: points,
    p_metadata: input.metadata ?? {},
    ...(input.sourceAttemptId
      ? { p_source_attempt: input.sourceAttemptId }
      : {}),
  });

  if (error) {
    throw new Error(`award_xp_event failed: ${error.message}`);
  }

  const row = data?.[0];
  if (!row) {
    throw new Error("award_xp_event returned no result");
  }

  return {
    awarded: row.awarded,
    scoreEventId: row.score_event_id,
    points: row.points ?? points,
  };
}

export type AwardModuleCompletionXpInput = {
  userId: string;
  moduleId: string;
  metadata?: XpAwardMetadata | null;
};

export function awardModuleCompletionXp(
  input: AwardModuleCompletionXpInput,
  client?: ServiceClient,
): Promise<XpAwardResult> {
  return awardXpEvent(
    {
      userId: input.userId,
      kind: "module-quiz",
      refKind: "module",
      refId: input.moduleId,
      defaultPoints: MODULE_COMPLETION_XP,
      metadata: input.metadata,
    },
    client,
  );
}

export type AwardCourseCompletionXpInput = {
  userId: string;
  courseId: string;
  metadata?: XpAwardMetadata | null;
};

export function awardCourseCompletionXp(
  input: AwardCourseCompletionXpInput,
  client?: ServiceClient,
): Promise<XpAwardResult> {
  return awardXpEvent(
    {
      userId: input.userId,
      kind: "course-completion",
      refKind: "course",
      refId: input.courseId,
      defaultPoints: COURSE_COMPLETION_XP,
      metadata: input.metadata,
    },
    client,
  );
}
