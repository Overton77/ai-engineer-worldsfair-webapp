type JsonLike = unknown;

export interface ArtifactSemanticRef {
  artifact_kind: string;
  artifact_id: string;
  ord: number;
  role: string | null;
}

export interface ModuleSemanticContent {
  title: string;
  body_md: string;
  body_kind: string | null;
  duration_min: number | null;
  difficulty: string | null;
  status: string;
  domain_buckets: string[];
  learning_objectives: JsonLike;
  mini_quiz: JsonLike;
  prerequisites: string[];
  artifact_refs: ArtifactSemanticRef[];
}

export interface CourseSemanticSlot {
  module_id: string;
  ord: number;
  pinned_version: string | null;
  role: string | null;
}

export interface CourseSemanticContent {
  title: string;
  summary: string | null;
  narrative_md: string | null;
  est_hours: number | null;
  domain_bucket: string;
  domain_layer: string | null;
  capstone_challenge_id: string | null;
  status: string;
  modules: CourseSemanticSlot[];
}

export function diffModuleSemanticContent(
  existing: ModuleSemanticContent,
  candidate: ModuleSemanticContent,
): string[] {
  return diffFields(
    normalizeModuleSemanticContent(existing),
    normalizeModuleSemanticContent(candidate),
  );
}

export function diffCourseSemanticContent(
  existing: CourseSemanticContent,
  candidate: CourseSemanticContent,
): string[] {
  return diffFields(
    normalizeCourseSemanticContent(existing),
    normalizeCourseSemanticContent(candidate),
  );
}

export function buildPublishedDriftError(
  kind: "course" | "module",
  slug: string,
  version: string,
  changedFields: string[],
): Error {
  const fields = changedFields.length ? changedFields.join(", ") : "semantic content";
  return new Error(
    `Published ${kind} ${slug}@${version} has same-version semantic drift in ${fields}. ` +
      "Bump `version` before changing published content.",
  );
}

function normalizeModuleSemanticContent(content: ModuleSemanticContent) {
  return {
    title: content.title,
    body_md: content.body_md,
    body_kind: nullableString(content.body_kind),
    duration_min: nullableNumber(content.duration_min),
    difficulty: nullableString(content.difficulty),
    status: content.status,
    domain_buckets: normalizeStringSet(content.domain_buckets),
    learning_objectives: normalizeJson(content.learning_objectives),
    mini_quiz: normalizeJson(content.mini_quiz),
    prerequisites: normalizeStringSet(content.prerequisites),
    artifact_refs: content.artifact_refs
      .map((ref) => ({
        artifact_kind: ref.artifact_kind,
        artifact_id: ref.artifact_id,
        ord: ref.ord,
        role: nullableString(ref.role),
      }))
      .sort((a, b) => a.ord - b.ord || stableStringify(a).localeCompare(stableStringify(b))),
  };
}

function normalizeCourseSemanticContent(content: CourseSemanticContent) {
  return {
    title: content.title,
    summary: nullableString(content.summary),
    narrative_md: nullableString(content.narrative_md),
    est_hours: nullableNumber(content.est_hours),
    domain_bucket: content.domain_bucket,
    domain_layer: nullableString(content.domain_layer),
    capstone_challenge_id: nullableString(content.capstone_challenge_id),
    status: content.status,
    modules: content.modules
      .map((slot) => ({
        module_id: slot.module_id,
        ord: slot.ord,
        pinned_version: nullableString(slot.pinned_version),
        role: nullableString(slot.role),
      }))
      .sort((a, b) => a.ord - b.ord || a.module_id.localeCompare(b.module_id)),
  };
}

function diffFields(
  existing: Record<string, unknown>,
  candidate: Record<string, unknown>,
): string[] {
  const fields = new Set([...Object.keys(existing), ...Object.keys(candidate)]);
  return [...fields]
    .sort()
    .filter((field) => stableStringify(existing[field]) !== stableStringify(candidate[field]));
}

function normalizeJson(value: JsonLike): JsonLike {
  if (Array.isArray(value)) return value.map(normalizeJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => [key, normalizeJson(val)]),
    );
  }
  return value ?? null;
}

function normalizeStringSet(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function nullableString(value: string | null): string | null {
  return value === "" || value === undefined ? null : value;
}

function nullableNumber(value: number | null): number | null {
  return value === undefined ? null : value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(normalizeJson(value));
}
