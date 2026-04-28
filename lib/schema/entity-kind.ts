import { z } from "zod";

/**
 * Canonical entity-kind union shared by every polymorphic surface in the app.
 *
 * Source of truth for:
 *  - `saved_items.entity_type` CHECK
 *    (`supabase/migrations/20260420140000_expand_user_content_whitelists.sql`)
 *  - `notes.entity_type` CHECK (same file)
 *  - `image_attachment.entity_kind` CHECK
 *    (`supabase/migrations/20260420120000_add_images_and_attachments.sql`)
 *  - `module_uses_artifact.artifact_kind` (narrower whitelist — see ARTIFACT_KINDS)
 *  - `profile_followed_entity.entity_kind` CHECK
 *    (`supabase/migrations/20260418120400_expand_profiles_and_follow_graph.sql` —
 *    note: superset because follows can also target categories / domain layers)
 *
 * Per the resolution of Q4 (2026-04-20). When you add a new entity-bearing
 * table, append to this list AND extend the matching DB CHECK constraints
 * via a new migration. The TS list and the DB list must always agree.
 */
export const ENTITY_KINDS = [
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
  // Polymorphic surfaces (search_all, cmd-K) emit `entity_kind='notes'`
  // for own-note hits. RLS scopes notes to the calling user, so this is
  // safe to surface in the cross-entity search response. Persistence
  // tables (saved_items, profile_followed_entity) treat 'notes' as a
  // soft kind — you don't save or follow a note.
  "notes",
] as const;

export type EntityKind = (typeof ENTITY_KINDS)[number];

export const EntityKindSchema = z.enum(ENTITY_KINDS);

/**
 * Wider whitelist for `profile_followed_entity` — users can also follow
 * faceted virtual entities (categories from the 26-key taxonomy and the 5
 * domain layers).
 */
export const FOLLOW_ENTITY_KINDS = [
  ...ENTITY_KINDS,
  "category",
  "domain_layer",
] as const;

export type FollowEntityKind = (typeof FOLLOW_ENTITY_KINDS)[number];

export const FollowEntityKindSchema = z.enum(FOLLOW_ENTITY_KINDS);

/**
 * Narrower whitelist for `module_uses_artifact.artifact_kind` — these are
 * *corpus* artifacts a course module can cite, not user-savable entities.
 */
export const ARTIFACT_KINDS = [
  "video",
  "session",
  "dossier",
  "repo",
  "library",
  "product",
  "paper",
  "slide",
  "report",
  "news_item",
  "chunk",
  "doc_page",
  "web_article",
  "learning_asset",
] as const;

export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];

export const ArtifactKindSchema = z.enum(ARTIFACT_KINDS);

/**
 * A typed reference to any entity in the system. Used wherever we need to
 * point at "some entity, polymorphically" — saves, notes, follows, mention
 * chips, assistant context, etc.
 */
export type EntityRef = {
  kind: EntityKind;
  id: string;
  slug?: string;
};

export const EntityRefSchema = z.object({
  kind: EntityKindSchema,
  id: z.string().min(1),
  slug: z.string().optional(),
});
