import type { CategoryKey, DomainLayer } from "@/lib/schema/taxonomy";
import type {
  ArtifactKind,
  EntityKind,
  EntityRef,
  FollowEntityKind,
} from "@/lib/schema/entity-kind";

export type {
  EntityKind,
  EntityRef,
  FollowEntityKind,
  ArtifactKind,
};

/**
 * Normalized "card" shape every entity-kind table maps into. Powers
 * EntityCard, cmd-K results, search results, recommender carousels.
 * One mapper per kind — `lib/db/<kind>.ts` exports `to<Kind>Summary()`.
 */
export type EntitySummary = {
  kind: EntityKind;
  id: string;
  slug?: string | null;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  href: string;
  tags?: readonly string[];
  layer?: DomainLayer | null;
  category?: CategoryKey | null;
};

/**
 * Per-entity-kind URL templates. Centralised so a future rename only
 * touches one file. Routes mirror wireframes 03-D.
 */
export const ENTITY_HREF: Record<EntityKind, (slugOrId: string) => string> = {
  person: (s) => `/p/${s}`,
  organization: (s) => `/o/${s}`,
  session: (s) => `/talk/${s}`,
  youtube_video: (s) => `/video/${s}`,
  library: (s) => `/lib/${s}`,
  product: (s) => `/product/${s}`,
  event: (s) => `/event/${s}`,
  paper: (s) => `/paper/${s}`,
  report: (s) => `/report/${s}`,
  news_item: (s) => `/news/${s}`,
  repo: (s) => `/repo/${s}`,
  course: (s) => `/courses/${s}`,
  course_module: (s) => `/modules/${s}`,
  challenge: (s) => `/challenges/${s}`,
  attempt: (s) => `/attempts/${s}`,
  image: (s) => `/image/${s}`,
};

/**
 * Generic filter shape used by `/explore/[type]`, search, and saved
 * pages. Each surface narrows down which keys it actually consumes.
 */
export type FilterState = {
  q?: string;
  kinds?: readonly EntityKind[];
  layers?: readonly DomainLayer[];
  categories?: readonly CategoryKey[];
  tags?: readonly string[];
  hasVideo?: boolean;
  sort?: "relevance" | "popularity" | "recent" | "alpha";
  cursor?: string;
  limit?: number;
};

/**
 * Discriminated union for the `search_all` RPC result. Same row shape
 * the SQL function returns; entity_kind is constrained to EntityKind so
 * downstream consumers can pattern-match.
 */
export type SearchAllHit = {
  entity_kind: EntityKind;
  entity_id: string;
  slug: string | null;
  title: string;
  subtitle: string | null;
  snippet: string | null;
  rank: number;
};

export type SearchFuzzyHit = {
  entity_kind: EntityKind;
  entity_id: string;
  slug: string | null;
  title: string;
  similarity: number;
};
