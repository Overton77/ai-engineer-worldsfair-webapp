import { z } from "zod";

import type { EntityKind } from "@/lib/schema/entity-kind";

export const RECOMMENDATION_TOPIC = "entity-interactions";
export const DEFAULT_RECOMMENDATION_LIMIT = 24;
export const DEFAULT_HOME_RECOMMENDATION_LIMIT = 8;
export const RECOMMENDATION_ALGORITHM_VERSION = "entity-recs-v1-sql-hybrid";

export const RECOMMENDABLE_ENTITY_KINDS = [
  "person",
  "organization",
  "library",
  "paper",
  "session",
  "youtube_video",
] as const;

export type RecommendableEntityKind =
  (typeof RECOMMENDABLE_ENTITY_KINDS)[number];

export type EntityInteractionEventType =
  | "entity.saved"
  | "entity.unsaved"
  | "entity.followed"
  | "entity.unfollowed";

export type RecommendationReasonCode =
  | "similar_users"
  | "popular_recently"
  | "fresh"
  | "matches_profile"
  | "same_domain_layer"
  | "same_category"
  | "diverse_kind";

export type EntityInteractionQueueMessage = {
  eventId: string;
  userId: string;
  type: EntityInteractionEventType;
  entity: {
    kind: string;
    id: string;
    title?: string | null;
    subtitle?: string | null;
  };
  occurredAt: string;
};

export const EntityInteractionQueueMessageSchema = z.object({
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum([
    "entity.saved",
    "entity.unsaved",
    "entity.followed",
    "entity.unfollowed",
  ]),
  entity: z.object({
    kind: z.string().min(1),
    id: z.string().min(1),
    title: z.string().nullable().optional(),
    subtitle: z.string().nullable().optional(),
  }),
  occurredAt: z.string().datetime({ offset: true }),
});

export type RecommendationSignal = {
  kind: string;
  id: string;
  action: "save" | "follow";
  createdAt?: string | null;
};

export type RecommendationCandidate = {
  entityKind: RecommendableEntityKind;
  entityId: string;
  score: number;
  reasonCodes: RecommendationReasonCode[];
  metadata?: Record<string, unknown>;
};

export type ResolvedRecommendationDisplay = {
  entityKind: string;
  entityId: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  href: string;
  metadata?: {
    slug?: string | null;
    imageSource?: "image_attachment" | "table_field" | "fallback" | null;
    sourceTable?: string;
  };
};

export type RecommendationRowInput = {
  user_id: string;
  entity_kind: RecommendableEntityKind;
  entity_id: string;
  rank: number;
  score: number;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  href: string;
  reason_codes: RecommendationReasonCode[];
  algorithm_version: string;
  metadata: Record<string, unknown>;
};

export function isRecommendableEntityKind(
  kind: string,
): kind is RecommendableEntityKind {
  return (RECOMMENDABLE_ENTITY_KINDS as readonly string[]).includes(kind);
}

export function isEntityKind(kind: string): kind is EntityKind {
  return [
    "person",
    "organization",
    "session",
    "youtube_video",
    "library",
    "product",
    "event",
    "paper",
    "report",
    "news_item",
    "repo",
    "course",
    "course_module",
    "challenge",
    "attempt",
    "image",
    "notes",
  ].includes(kind);
}
