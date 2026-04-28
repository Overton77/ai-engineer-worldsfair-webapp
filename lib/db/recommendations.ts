import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import { DEFAULT_HOME_RECOMMENDATION_LIMIT } from "@/lib/recommendations/types";

export type UserEntityRecommendationRow = {
  user_id: string;
  entity_kind: string;
  entity_id: string;
  rank: number;
  score: number;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  href: string;
  reason_codes: string[];
  algorithm_version: string;
  computed_at: string;
  expires_at: string | null;
  metadata: Record<string, unknown>;
};

type QueryResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

type QueryBuilder<T> = {
  select: (columns: string) => QueryBuilder<T>;
  eq: (column: string, value: unknown) => QueryBuilder<T>;
  order: (column: string, opts?: { ascending?: boolean }) => QueryBuilder<T>;
  limit: (count: number) => QueryBuilder<T>;
  then: Promise<QueryResult<T>>["then"];
};

type DbClient = {
  from: <T = Record<string, unknown>>(table: string) => QueryBuilder<T>;
};

export async function listRecommendationsForUser(
  userId: string,
  limit = DEFAULT_HOME_RECOMMENDATION_LIMIT,
  client?: DbClient,
): Promise<UserEntityRecommendationRow[]> {
  const sb =
    client ?? ((await createServerSupabase()) as unknown as DbClient);
  const cappedLimit = Math.min(Math.max(limit, 1), 24);

  const { data, error } = await sb
    .from<UserEntityRecommendationRow>("user_entity_recommendation")
    .select("*")
    .eq("user_id", userId)
    .order("rank", { ascending: true })
    .limit(cappedLimit);

  if (error) {
    console.warn(`recommendations.listRecommendationsForUser: ${error.message}`);
    return [];
  }

  return data ?? [];
}
