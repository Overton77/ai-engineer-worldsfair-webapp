import type { CategoryKey, DomainLayer } from "@/lib/schema/taxonomy";
import { ENTITY_HREF, type EntitySummary } from "@/types/domain";
import type { EntityKind } from "@/lib/schema/entity-kind";

/**
 * Loose row shape we accept from any of the entity tables. Every
 * field is optional; the mapper picks what's available and stays
 * tolerant of nulls.
 */
export type AnyEntityRow = {
  // Identity (per-table primary keys; only one applies)
  id?: string | null;
  person_id?: string | null;
  organization_id?: string | null;
  paper_id?: string | null;
  session_id?: string | null;
  video_id?: string | null;
  event_id?: string | null;
  news_item_id?: string | null;
  course_id?: string | null;
  course_module_id?: string | null;
  challenge_id?: string | null;
  attempt_id?: string | null;
  report_id?: string | null;
  repo_id?: string | null;
  image_id?: string | null;

  slug?: string | null;
  // Display title candidates (per-table)
  title?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  headline?: string | null;
  // Subtitle candidates
  channel_title?: string | null;
  current_role_title?: string | null;
  role_title?: string | null;
  short_description?: string | null;
  tag_line?: string | null;
  tagline?: string | null;
  abstract?: string | null;
  summary?: string | null;
  description?: string | null;
  bio?: string | null;
  overview?: string | null;
  // Imagery
  thumbnail_url?: string | null;
  avatar_url?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  hero_image_url?: string | null;
  sessionize_profile_picture_url?: string | null;
  // Taxonomy
  category?: string | null;
  domain_layer?: string | null;
  tags?: string[] | null;
  topics?: string[] | null;
  topic_tags?: string[] | null;
  expertise_tags?: string[] | null;
  categories?: string[] | null;
};

const KIND_TO_ID_FIELD: Record<EntityKind, keyof AnyEntityRow | "id" | "slug"> = {
  person: "person_id",
  organization: "organization_id",
  session: "session_id",
  youtube_video: "video_id",
  library: "slug",
  product: "slug",
  event: "event_id",
  paper: "slug",
  report: "report_id",
  news_item: "news_item_id",
  repo: "repo_id",
  course: "course_id",
  course_module: "course_module_id",
  challenge: "challenge_id",
  attempt: "attempt_id",
  image: "image_id",
  notes: "id",
};

function pickId(kind: EntityKind, row: AnyEntityRow): string {
  const field = KIND_TO_ID_FIELD[kind];
  const v = (row as Record<string, unknown>)[field];
  if (typeof v === "string" && v.length > 0) return v;
  if (typeof row.id === "string" && row.id.length > 0) return row.id;
  return "";
}

function pickTitle(row: AnyEntityRow): string {
  return (
    row.title ??
    row.full_name ??
    row.display_name ??
    row.name ??
    "Untitled"
  );
}

function pickSubtitle(row: AnyEntityRow): string | null {
  return (
    row.headline ??
    row.channel_title ??
    row.role_title ??
    row.current_role_title ??
    row.tag_line ??
    row.tagline ??
    row.short_description ??
    null
  );
}

function pickDescription(row: AnyEntityRow): string | null {
  return (
    row.abstract ??
    row.summary ??
    row.description ??
    row.overview ??
    row.bio ??
    null
  );
}

function pickImage(row: AnyEntityRow): string | null {
  return (
    row.thumbnail_url ??
    row.avatar_url ??
    row.sessionize_profile_picture_url ??
    row.logo_url ??
    row.cover_url ??
    row.hero_image_url ??
    null
  );
}

function pickTags(row: AnyEntityRow): readonly string[] | undefined {
  if (Array.isArray(row.tags) && row.tags.length > 0) return row.tags;
  if (Array.isArray(row.topic_tags) && row.topic_tags.length > 0) return row.topic_tags;
  if (Array.isArray(row.expertise_tags) && row.expertise_tags.length > 0)
    return row.expertise_tags;
  if (Array.isArray(row.topics) && row.topics.length > 0) return row.topics;
  return undefined;
}

const VALID_LAYERS: ReadonlySet<DomainLayer> = new Set([
  "intelligence",
  "agents",
  "systems",
  "application",
  "governance",
]);

function pickLayer(row: AnyEntityRow): DomainLayer | null {
  const v = row.domain_layer;
  if (v && VALID_LAYERS.has(v as DomainLayer)) return v as DomainLayer;
  return null;
}

function pickCategory(row: AnyEntityRow): CategoryKey | null {
  // Soft-cast: caller may pass a free-text legacy category. We expose
  // it as CategoryKey | null but never inject false canonicals — the
  // recommender / chip pickers should validate against CATEGORY_KEYS
  // when they actually use this field.
  const v = row.category;
  return v ? (v as CategoryKey) : null;
}

/**
 * Map any entity row to the normalized card shape every UI consumes.
 * Tolerant of the row shape — supports the actual Supabase row shape
 * for each entity kind plus the synthesized rows from `search_all`.
 */
export function toEntitySummary(
  kind: EntityKind,
  row: AnyEntityRow,
): EntitySummary {
  const id = pickId(kind, row);
  const slugOrId = row.slug ?? id;
  return {
    kind,
    id,
    slug: row.slug ?? null,
    title: pickTitle(row),
    subtitle: pickSubtitle(row),
    description: pickDescription(row),
    imageUrl: pickImage(row),
    href: ENTITY_HREF[kind](slugOrId),
    tags: pickTags(row),
    layer: pickLayer(row),
    category: pickCategory(row),
  };
}
