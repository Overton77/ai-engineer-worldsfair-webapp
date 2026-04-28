import "server-only";

import { resolveEntitySummariesByRefs } from "@/lib/db/resolve-entity-summary";
import { createServiceClient } from "@/lib/supabase/admin";

import {
  addCandidateScore,
  buildRecommendationExclusionSet,
  rankRecommendationCandidates,
  recommendationKey,
} from "./scoring";
import {
  DEFAULT_RECOMMENDATION_LIMIT,
  EntityInteractionQueueMessageSchema,
  RECOMMENDATION_ALGORITHM_VERSION,
  RECOMMENDABLE_ENTITY_KINDS,
  isRecommendableEntityKind,
  type EntityInteractionQueueMessage,
  type RecommendationCandidate,
  type RecommendationReasonCode,
  type RecommendationRowInput,
  type RecommendationSignal,
  type RecommendableEntityKind,
  type ResolvedRecommendationDisplay,
} from "./types";

type QueryResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

type QueryBuilder<T = unknown> = {
  select: (columns: string, opts?: unknown) => QueryBuilder<T>;
  insert: (values: unknown) => QueryBuilder<T>;
  update: (values: unknown) => QueryBuilder<T>;
  delete: () => QueryBuilder<T>;
  eq: (column: string, value: unknown) => QueryBuilder<T>;
  neq: (column: string, value: unknown) => QueryBuilder<T>;
  in: (column: string, values: readonly unknown[]) => QueryBuilder<T>;
  order: (column: string, opts?: { ascending?: boolean }) => QueryBuilder<T>;
  limit: (count: number) => QueryBuilder<T>;
  maybeSingle: () => Promise<QueryResult<T>>;
  single: () => Promise<QueryResult<T>>;
  then: Promise<QueryResult<T[]>>["then"];
};

type DbClient = {
  from: <T = Record<string, unknown>>(table: string) => QueryBuilder<T>;
  rpc: <T = unknown>(
    functionName: string,
    args: Record<string, unknown>,
  ) => Promise<QueryResult<T>>;
};

type StoredSignalRow = {
  user_id?: string;
  entity_type?: string;
  entity_kind?: string;
  entity_id: string;
  created_at?: string | null;
};

type InteractionEventRow = {
  event_id: string;
  user_id: string;
  status: string;
};

type InteractionEventForProcessing = InteractionEventRow & {
  event_type: string;
  entity_kind: string;
  entity_id: string;
};

type ProfileForRecommendations = {
  interest_tags?: string[] | null;
  expertise_tags?: string[] | null;
  goals?: string[] | null;
  experience_level?: string | null;
  home_layer?: string | null;
};

type RecomputeOptions = {
  limit?: number;
  algorithmVersion?: string;
  client?: DbClient;
  displayResolver?: (
    refs: ReadonlyArray<{ kind: RecommendableEntityKind; id: string }>,
  ) => Promise<Map<string, ResolvedRecommendationDisplay>>;
};

const ENTITY_SOURCE_META: Record<
  RecommendableEntityKind,
  {
    table: string;
    idField: string;
    freshnessField?: string;
  }
> = {
  person: { table: "person", idField: "person_id" },
  organization: { table: "organization", idField: "organization_id" },
  library: { table: "library", idField: "slug" },
  paper: { table: "paper", idField: "slug", freshnessField: "published_on" },
  session: { table: "session", idField: "session_id", freshnessField: "scheduled_at" },
  youtube_video: {
    table: "youtube_video",
    idField: "video_id",
    freshnessField: "published_at",
  },
};

export async function recomputeRecommendationsForUser(
  userId: string,
  opts: RecomputeOptions = {},
): Promise<{ inserted: number; algorithmVersion: string }> {
  const client = opts.client ?? (createServiceClient() as unknown as DbClient);
  const algorithmVersion =
    opts.algorithmVersion ?? RECOMMENDATION_ALGORITHM_VERSION;
  const limit = Math.min(Math.max(opts.limit ?? DEFAULT_RECOMMENDATION_LIMIT, 1), 50);

  const [saves, follows, profile] = await Promise.all([
    loadSavedSignals(userId, client),
    loadFollowSignals(userId, client),
    loadProfile(userId, client),
  ]);

  const exclusions = buildRecommendationExclusionSet(saves, follows);
  const candidates = new Map<string, RecommendationCandidate>();

  await Promise.all([
    addCollaborativeCandidates({
      userId,
      saves,
      follows,
      candidates,
      client,
    }),
    addPopularityCandidates({ candidates, client }),
    addProfileCandidates({ profile, candidates, client }),
  ]);

  const ranked = rankRecommendationCandidates(candidates.values(), exclusions, limit);
  const resolver = opts.displayResolver ?? resolveRecommendationDisplays;
  const displays = await resolver(
    ranked.map((candidate) => ({
      kind: candidate.entityKind,
      id: candidate.entityId,
    })),
  );

  const rows: RecommendationRowInput[] = [];
  for (const [index, candidate] of ranked.entries()) {
    const display = displays.get(recommendationKey(candidate));
    if (!display) continue;
    rows.push({
      user_id: userId,
      entity_kind: candidate.entityKind,
      entity_id: candidate.entityId,
      rank: rows.length + 1,
      score: Number(candidate.score.toFixed(4)),
      title: display.title,
      subtitle: display.subtitle,
      image_url: display.imageUrl,
      href: display.href,
      reason_codes: candidate.reasonCodes,
      algorithm_version: algorithmVersion,
      metadata: {
        ...candidate.metadata,
        source_rank: index + 1,
        display: display.metadata ?? {},
      },
    });
  }

  await replaceUserRecommendationRows(userId, rows, client);
  return { inserted: rows.length, algorithmVersion };
}

export async function processEntityInteractionMessage(
  rawMessage: unknown,
  opts: RecomputeOptions = {},
): Promise<{ inserted: number; algorithmVersion: string }> {
  const message = EntityInteractionQueueMessageSchema.parse(rawMessage);
  const client = opts.client ?? (createServiceClient() as unknown as DbClient);
  const event = await loadInteractionEventForProcessing(message, client);
  await markInteractionEventProcessing(message.eventId, client);
  try {
    const result = await recomputeRecommendationsForUser(event.user_id, {
      ...opts,
      client,
    });
    await markInteractionEventProcessed(message.eventId, client);
    return result;
  } catch (error) {
    await markInteractionEventFailed(message.eventId, error, client);
    throw error;
  }
}

export async function drainPendingRecommendationEvents(
  opts: RecomputeOptions & { batchSize?: number } = {},
): Promise<{
  events: number;
  users: number;
  inserted: number;
  algorithmVersion: string;
}> {
  const client = opts.client ?? (createServiceClient() as unknown as DbClient);
  const batchSize = Math.min(Math.max(opts.batchSize ?? 25, 1), 100);
  const { data, error } = await client
    .from<InteractionEventRow>("entity_interaction_event")
    .select("event_id, user_id, status")
    .in("status", ["pending", "queued", "failed"])
    .order("occurred_at", { ascending: true })
    .limit(batchSize);

  if (error) throw new Error(`drain recommendations failed: ${error.message}`);

  const events = data ?? [];
  const userIds = Array.from(new Set(events.map((event) => event.user_id)));
  let inserted = 0;
  let algorithmVersion =
    opts.algorithmVersion ?? RECOMMENDATION_ALGORITHM_VERSION;

  for (const userId of userIds) {
    const userEventIds = events
      .filter((event) => event.user_id === userId)
      .map((event) => event.event_id);
    await Promise.all(
      userEventIds.map((eventId) => markInteractionEventProcessing(eventId, client)),
    );
    try {
      const result = await recomputeRecommendationsForUser(userId, {
        ...opts,
        client,
      });
      inserted += result.inserted;
      algorithmVersion = result.algorithmVersion;
      await Promise.all(
        userEventIds.map((eventId) => markInteractionEventProcessed(eventId, client)),
      );
    } catch (error) {
      await Promise.all(
        userEventIds.map((eventId) =>
          markInteractionEventFailed(eventId, error, client),
        ),
      );
      throw error;
    }
  }

  return {
    events: events.length,
    users: userIds.length,
    inserted,
    algorithmVersion,
  };
}

async function loadInteractionEventForProcessing(
  message: EntityInteractionQueueMessage,
  client: DbClient,
): Promise<InteractionEventForProcessing> {
  const { data, error } = await client
    .from<InteractionEventForProcessing>("entity_interaction_event")
    .select("event_id, user_id, event_type, entity_kind, entity_id, status")
    .eq("event_id", message.eventId)
    .maybeSingle();

  if (error) throw new Error(`load interaction event failed: ${error.message}`);
  if (!data) throw new Error(`interaction event ${message.eventId} was not found`);
  if (data.user_id !== message.userId) {
    throw new Error(`queue message user does not match event ${message.eventId}`);
  }
  if (
    data.event_type !== message.type ||
    data.entity_kind !== message.entity.kind ||
    data.entity_id !== message.entity.id
  ) {
    throw new Error(`queue message payload does not match event ${message.eventId}`);
  }

  return data;
}

async function loadSavedSignals(
  userId: string,
  client: DbClient,
): Promise<RecommendationSignal[]> {
  const { data, error } = await client
    .from<StoredSignalRow>("saved_items")
    .select("entity_type, entity_id, created_at")
    .eq("user_id", userId);
  if (error) throw new Error(`load saved signals failed: ${error.message}`);
  return (data ?? []).map((row) => ({
    kind: row.entity_type ?? "",
    id: row.entity_id,
    action: "save",
    createdAt: row.created_at,
  }));
}

async function loadFollowSignals(
  userId: string,
  client: DbClient,
): Promise<RecommendationSignal[]> {
  const { data, error } = await client
    .from<StoredSignalRow>("profile_followed_entity")
    .select("entity_kind, entity_id, created_at")
    .eq("user_id", userId);
  if (error) throw new Error(`load follow signals failed: ${error.message}`);
  return (data ?? []).map((row) => ({
    kind: row.entity_kind ?? "",
    id: row.entity_id,
    action: "follow",
    createdAt: row.created_at,
  }));
}

async function loadProfile(
  userId: string,
  client: DbClient,
): Promise<ProfileForRecommendations | null> {
  const { data, error } = await client
    .from<ProfileForRecommendations>("profiles")
    .select("interest_tags, expertise_tags, goals, experience_level, home_layer")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`load recommendation profile failed: ${error.message}`);
  return data;
}

async function addCollaborativeCandidates(args: {
  userId: string;
  saves: RecommendationSignal[];
  follows: RecommendationSignal[];
  candidates: Map<string, RecommendationCandidate>;
  client: DbClient;
}): Promise<void> {
  const signals = [...args.saves, ...args.follows].filter((signal) =>
    isRecommendableEntityKind(signal.kind),
  );
  if (signals.length === 0) return;

  const kinds = Array.from(new Set(signals.map((signal) => signal.kind)));
  const ids = Array.from(new Set(signals.map((signal) => signal.id)));

  const [sharedSaves, sharedFollows] = await Promise.all([
    args.client
      .from<StoredSignalRow>("saved_items")
      .select("user_id, entity_type, entity_id")
      .in("entity_type", kinds)
      .in("entity_id", ids)
      .neq("user_id", args.userId)
      .limit(500),
    args.client
      .from<StoredSignalRow>("profile_followed_entity")
      .select("user_id, entity_kind, entity_id")
      .in("entity_kind", kinds)
      .in("entity_id", ids)
      .neq("user_id", args.userId)
      .limit(500),
  ]);

  if (sharedSaves.error) {
    throw new Error(`load shared saves failed: ${sharedSaves.error.message}`);
  }
  if (sharedFollows.error) {
    throw new Error(`load shared follows failed: ${sharedFollows.error.message}`);
  }

  const targetKeys = new Set(
    signals.map((signal) => recommendationKey({ kind: signal.kind, id: signal.id })),
  );
  const exactSharedSaves = (sharedSaves.data ?? []).filter((row) =>
    targetKeys.has(
      recommendationKey({ kind: row.entity_type ?? "", id: row.entity_id }),
    ),
  );
  const exactSharedFollows = (sharedFollows.data ?? []).filter((row) =>
    targetKeys.has(
      recommendationKey({ kind: row.entity_kind ?? "", id: row.entity_id }),
    ),
  );

  const similarUserIds = Array.from(
    new Set([
      ...(exactSharedSaves.map((row) => row.user_id).filter(Boolean) as string[]),
      ...(exactSharedFollows
        .map((row) => row.user_id)
        .filter(Boolean) as string[]),
    ]),
  ).slice(0, 100);

  if (similarUserIds.length === 0) return;

  const [theirSaves, theirFollows] = await Promise.all([
    args.client
      .from<StoredSignalRow>("saved_items")
      .select("entity_type, entity_id, created_at")
      .in("user_id", similarUserIds)
      .limit(1000),
    args.client
      .from<StoredSignalRow>("profile_followed_entity")
      .select("entity_kind, entity_id, created_at")
      .in("user_id", similarUserIds)
      .limit(1000),
  ]);

  if (theirSaves.error) {
    throw new Error(`load similar user saves failed: ${theirSaves.error.message}`);
  }
  if (theirFollows.error) {
    throw new Error(`load similar user follows failed: ${theirFollows.error.message}`);
  }

  for (const row of theirSaves.data ?? []) {
    if (!row.entity_type || !isRecommendableEntityKind(row.entity_type)) continue;
    addCandidateScore(args.candidates, {
      entityKind: row.entity_type,
      entityId: row.entity_id,
      score: 2.5,
      reasonCodes: ["similar_users"],
      metadata: { collaborative_action: "save" },
    });
  }

  for (const row of theirFollows.data ?? []) {
    if (!row.entity_kind || !isRecommendableEntityKind(row.entity_kind)) continue;
    addCandidateScore(args.candidates, {
      entityKind: row.entity_kind,
      entityId: row.entity_id,
      score: 4,
      reasonCodes: ["similar_users"],
      metadata: { collaborative_action: "follow" },
    });
  }
}

async function addPopularityCandidates(args: {
  candidates: Map<string, RecommendationCandidate>;
  client: DbClient;
}): Promise<void> {
  const { data, error } = await args.client
    .from<Record<string, unknown>>("entity_interaction_event")
    .select("event_type, entity_kind, entity_id, occurred_at")
    .in("event_type", ["entity.saved", "entity.followed"])
    .order("occurred_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(`load popularity events failed: ${error.message}`);

  for (const row of data ?? []) {
    const kind = String(row.entity_kind ?? "");
    const id = String(row.entity_id ?? "");
    if (!isRecommendableEntityKind(kind) || !id) continue;
    const eventType = String(row.event_type ?? "");
    const decay = recencyDecay(String(row.occurred_at ?? ""));
    addCandidateScore(args.candidates, {
      entityKind: kind,
      entityId: id,
      score: (eventType === "entity.followed" ? 1.8 : 1.2) * decay,
      reasonCodes: decay > 0.8 ? ["popular_recently", "fresh"] : ["popular_recently"],
      metadata: { popularity_event: eventType },
    });
  }
}

async function addProfileCandidates(args: {
  profile: ProfileForRecommendations | null;
  candidates: Map<string, RecommendationCandidate>;
  client: DbClient;
}): Promise<void> {
  const profileTerms = getProfileTerms(args.profile);
  if (profileTerms.size === 0) return;

  await Promise.all(
    RECOMMENDABLE_ENTITY_KINDS.map(async (kind) => {
      const meta = ENTITY_SOURCE_META[kind];
      const { data, error } = await args.client
        .from<Record<string, unknown>>(meta.table)
        .select("*")
        .limit(100);
      if (error) throw new Error(`load ${kind} profile candidates failed: ${error.message}`);

      for (const row of data ?? []) {
        const id = row[meta.idField];
        if (typeof id !== "string" || id.length === 0) continue;
        const { score, reasonCodes } = scoreProfileRow(row, profileTerms, args.profile);
        if (score <= 0) continue;
        addCandidateScore(args.candidates, {
          entityKind: kind,
          entityId: id,
          score,
          reasonCodes,
          metadata: { profile_score: score },
        });
      }
    }),
  );
}

function getProfileTerms(profile: ProfileForRecommendations | null): Set<string> {
  const raw = [
    ...(profile?.interest_tags ?? []),
    ...(profile?.expertise_tags ?? []),
    ...(profile?.goals ?? []),
    profile?.home_layer,
    profile?.experience_level,
  ].filter(Boolean);
  return new Set(raw.map((term) => String(term).trim().toLowerCase()).filter(Boolean));
}

function scoreProfileRow(
  row: Record<string, unknown>,
  profileTerms: Set<string>,
  profile: ProfileForRecommendations | null,
): { score: number; reasonCodes: RecommendationReasonCode[] } {
  const rowTerms = extractRowTerms(row);
  let overlap = 0;
  for (const term of rowTerms) {
    if (profileTerms.has(term)) overlap += 1;
  }

  const reasonCodes: RecommendationReasonCode[] = [];
  if (overlap > 0) reasonCodes.push("matches_profile");

  const homeLayer = profile?.home_layer?.toLowerCase();
  const domainLayer = String(row.domain_layer ?? "").toLowerCase();
  const domainLayers = Array.isArray(row.domain_layers)
    ? row.domain_layers.map((term) => String(term).toLowerCase())
    : [];
  if (homeLayer && (domainLayer === homeLayer || domainLayers.includes(homeLayer))) {
    reasonCodes.push("same_domain_layer");
    overlap += 1;
  }

  return {
    score: Math.min(overlap * 1.25, 5),
    reasonCodes,
  };
}

function extractRowTerms(row: Record<string, unknown>): Set<string> {
  const values = [
    row.category,
    row.domain_layer,
    ...(Array.isArray(row.categories) ? row.categories : []),
    ...(Array.isArray(row.tags) ? row.tags : []),
    ...(Array.isArray(row.topic_tags) ? row.topic_tags : []),
    ...(Array.isArray(row.topics) ? row.topics : []),
    ...(Array.isArray(row.expertise_tags) ? row.expertise_tags : []),
  ];
  return new Set(
    values
      .map((value) => String(value ?? "").trim().toLowerCase())
      .filter(Boolean),
  );
}

function recencyDecay(occurredAt: string): number {
  const timestamp = Date.parse(occurredAt);
  if (!Number.isFinite(timestamp)) return 0.5;
  const ageDays = Math.max((Date.now() - timestamp) / 86_400_000, 0);
  return Math.max(0.2, Math.exp(-ageDays / 30));
}

async function resolveRecommendationDisplays(
  refs: ReadonlyArray<{ kind: RecommendableEntityKind; id: string }>,
): Promise<Map<string, ResolvedRecommendationDisplay>> {
  const summaries = await resolveEntitySummariesByRefs(refs);
  const out = new Map<string, ResolvedRecommendationDisplay>();
  for (const ref of refs) {
    const summary = summaries.get(recommendationKey(ref));
    if (!summary) continue;
    out.set(recommendationKey(ref), {
      entityKind: ref.kind,
      entityId: ref.id,
      title: summary.title,
      subtitle: summary.subtitle ?? summary.description ?? null,
      imageUrl: summary.imageUrl ?? null,
      href: summary.href,
      metadata: {
        slug: summary.slug ?? null,
        imageSource: summary.imageUrl ? "table_field" : "fallback",
        sourceTable: ENTITY_SOURCE_META[ref.kind].table,
      },
    });
  }
  return out;
}

async function replaceUserRecommendationRows(
  userId: string,
  rows: RecommendationRowInput[],
  client: DbClient,
): Promise<void> {
  const { error } = await client.rpc("replace_user_entity_recommendations", {
    p_user_id: userId,
    p_rows: rows,
  });
  if (error) {
    throw new Error(`replace recommendations failed: ${error.message}`);
  }
}

async function markInteractionEventProcessing(
  eventId: string,
  client: DbClient,
): Promise<void> {
  await client
    .from("entity_interaction_event")
    .update({
      status: "processing",
      attempt_count: await incrementAttemptCount(eventId, client),
      error: null,
    })
    .eq("event_id", eventId);
}

async function incrementAttemptCount(
  eventId: string,
  client: DbClient,
): Promise<number> {
  const { data } = await client
    .from<{ attempt_count?: number | null }>("entity_interaction_event")
    .select("attempt_count")
    .eq("event_id", eventId)
    .maybeSingle();
  return (data?.attempt_count ?? 0) + 1;
}

async function markInteractionEventProcessed(
  eventId: string,
  client: DbClient,
): Promise<void> {
  await client
    .from("entity_interaction_event")
    .update({
      status: "processed",
      processed_at: new Date().toISOString(),
      error: null,
    })
    .eq("event_id", eventId);
}

async function markInteractionEventFailed(
  eventId: string,
  error: unknown,
  client: DbClient,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  await client
    .from("entity_interaction_event")
    .update({
      status: "failed",
      error: message,
    })
    .eq("event_id", eventId);
}
