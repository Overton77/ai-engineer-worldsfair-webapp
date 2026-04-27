/**
 * upsert-modules.ts -- project vault `module.md` files for a bucket into the
 * `course_module` table (and `course_module_requires` + `module_uses_artifact`).
 *
 * Source of truth lives in
 *   aiwiki/ai-intelligence-vault/ai-intelligence/01_buckets/<bucket>/course/modules/<slug>/module.md
 * with YAML front-matter that this script reads.
 *
 * The Agent Orchestration “skills mini” modules (agent-skills-101,
 * progressive-disclosure-pattern, skills-vs-mcp-composition) live under
 * `--bucket agent_orchestration`. The `evaluations/course/modules/` tree has no
 * `module.md` courseware yet; do not confuse with those legacy drafts.
 *
 * Behavior per module:
 *   1. Resolve module by (slug, version). If missing, INSERT. If present and
 *      already published, compare semantic fields and fail on same-version
 *      drift; authors must bump version for learner-facing changes.
 *   2. If front-matter status == 'published', set is_latest_published=true.
 *      The BEFORE trigger demotes any prior latest in the same transaction.
 *   3. Replace prerequisite + artifact link rows for draft/review rows.
 *      Published unchanged rows skip link replacement because links are
 *      immutable semantic content.
 *
 * Refuses to publish if a referenced prerequisite slug does not yet have a
 * module row (catch-up in topological order: prereqs first).
 *
 * Run:
 *   pnpm run vault:upsert-modules:agent-orchestration
 *   pnpm exec tsx scripts/upsert-modules.ts --bucket agent_orchestration --dry-run
 *   pnpm exec tsx scripts/upsert-modules.ts --bucket agent_orchestration --slug agent-skills-101
 */

import { config as loadEnv } from "dotenv";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createServiceSupabase,
  parseCommonArgs,
  readMarkdownDoc,
  asString,
  asStringArray,
  asInt,
  asJson,
  type Client,
} from "./_shared/vault";
import {
  buildPublishedDriftError,
  diffModuleSemanticContent,
  type ArtifactSemanticRef,
  type ModuleSemanticContent,
} from "../lib/learn/content-immutability";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

interface Args {
  bucket: string;
  vaultRoot: string;
  dryRun: boolean;
  onlySlug: string | null;
}

function parseArgs(): Args {
  const { common, rest } = parseCommonArgs(process.argv.slice(2));
  let onlySlug: string | null = null;
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    const next = rest[i + 1];
    if (a === "--slug" && next) {
      onlySlug = next;
      i++;
    } else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: pnpm exec tsx scripts/upsert-modules.ts --bucket <bucket> [--slug <module-slug>] [--dry-run]",
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown arg: ${a}`);
    }
  }
  if (!common.bucket) throw new Error("--bucket required");
  return { ...common, onlySlug };
}

interface ModuleFile {
  slug: string;
  absPath: string;
  fm: Record<string, unknown>;
  body: string;
  contentHash: string;
}

async function discoverModules(args: Args): Promise<ModuleFile[]> {
  const modulesDir = resolve(
    args.vaultRoot,
    "01_buckets",
    args.bucket,
    "course",
    "modules",
  );
  let entries: string[] = [];
  try {
    entries = await readdir(modulesDir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      console.log(`[modules] no modules folder at ${modulesDir} -- nothing to do`);
      return [];
    }
    throw err;
  }
  const out: ModuleFile[] = [];
  for (const entry of entries) {
    const path = resolve(modulesDir, entry, "module.md");
    try {
      const doc = await readMarkdownDoc(path);
      const slug = String(doc.frontMatter.slug ?? entry);
      if (args.onlySlug && slug !== args.onlySlug) continue;
      out.push({
        slug,
        absPath: path,
        fm: doc.frontMatter,
        body: doc.body,
        contentHash: doc.contentHash,
      });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw err;
    }
  }
  return out;
}

function topoSortByPrereqs(modules: ModuleFile[]): ModuleFile[] {
  // Kahn's algorithm over slug -> module map. Prereqs first.
  const bySlug = new Map<string, ModuleFile>();
  for (const m of modules) bySlug.set(m.slug, m);
  const indeg = new Map<string, number>();
  for (const m of modules) {
    const reqs = readPrereqs(m.fm).filter((p) => bySlug.has(p));
    indeg.set(m.slug, reqs.length);
  }
  const queue: string[] = [];
  for (const [slug, deg] of indeg.entries()) if (deg === 0) queue.push(slug);
  const out: ModuleFile[] = [];
  while (queue.length) {
    const s = queue.shift()!;
    const m = bySlug.get(s)!;
    out.push(m);
    for (const other of modules) {
      const reqs = readPrereqs(other.fm).filter((p) => bySlug.has(p));
      if (reqs.includes(s)) {
        const left = (indeg.get(other.slug) ?? 0) - 1;
        indeg.set(other.slug, left);
        if (left === 0) queue.push(other.slug);
      }
    }
  }
  if (out.length !== modules.length) {
    throw new Error("Cycle detected in module prerequisites");
  }
  return out;
}

function readPrereqs(fm: Record<string, unknown>): string[] {
  return asStringArray(fm.prerequisites);
}

const ARTIFACT_KIND_ALIAS: Record<string, string> = {
  videos: "video",
  dossiers: "dossier",
  repos: "repo",
  papers: "paper",
  slides: "slide",
  chunks: "chunk",
  docs: "doc_page",       // mapped onto chunk source_kind for now
  web: "web_article",
  reports: "report",
  news: "news_item",
  products: "product",
  libraries: "library",
};

const VALID_ARTIFACT_KINDS = new Set([
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
]);

interface ArtifactRefRow {
  artifact_kind: string;
  artifact_id: string;
  ord: number;
  role: string;
}

interface ExistingModuleRow {
  module_id: string;
  slug: string;
  version: string;
  title: string;
  body_md: string;
  body_kind: string | null;
  duration_min: number | null;
  difficulty: string | null;
  status: string;
  domain_buckets: string[];
  learning_objectives: unknown;
  mini_quiz: unknown;
  content_hash: string | null;
}

function readArtifactRefs(fm: Record<string, unknown>): ArtifactRefRow[] {
  const refs = (fm.artifact_refs ?? {}) as Record<string, unknown>;
  const out: ArtifactRefRow[] = [];
  let ord = 0;
  for (const [groupKey, groupValue] of Object.entries(refs)) {
    const kind = ARTIFACT_KIND_ALIAS[groupKey] ?? groupKey;
    if (!VALID_ARTIFACT_KINDS.has(kind)) continue;
    const items = asStringArray(groupValue);
    for (const id of items) {
      out.push({
        artifact_kind: kind,
        artifact_id: id,
        ord: ord++,
        role: "primary",
      });
    }
  }
  return out;
}

function toArtifactSemanticRefs(refs: ArtifactRefRow[]): ArtifactSemanticRef[] {
  return refs.map((ref) => ({
    artifact_kind: ref.artifact_kind,
    artifact_id: ref.artifact_id,
    ord: ref.ord,
    role: ref.role,
  }));
}

function moduleSemanticFromCandidate(
  m: ModuleFile,
  status: string,
): ModuleSemanticContent {
  return {
    title: String(m.fm.title ?? m.slug),
    body_md: m.body,
    body_kind: asString(m.fm.body_kind),
    duration_min: asInt(m.fm.duration_min),
    difficulty: asString(m.fm.difficulty),
    status,
    domain_buckets: asStringArray(m.fm.domain_buckets),
    learning_objectives: asJson(m.fm.learning_objectives),
    mini_quiz: asJson(m.fm.mini_quiz),
    prerequisites: asStringArray(m.fm.prerequisites),
    artifact_refs: toArtifactSemanticRefs(readArtifactRefs(m.fm)),
  };
}

async function moduleSemanticFromExisting(
  sb: Client,
  existing: ExistingModuleRow,
): Promise<ModuleSemanticContent> {
  const { data: prereqRows, error: prereqError } = await sb
    .from("course_module_requires")
    .select("prereq_module_id")
    .eq("module_id", existing.module_id);
  if (prereqError) {
    throw new Error(`prereq read ${existing.slug}: ${prereqError.message}`);
  }

  const prereqIds = (prereqRows ?? []).map((row) => row.prereq_module_id);
  let prerequisites: string[] = [];
  if (prereqIds.length) {
    const { data: prereqModules, error } = await sb
      .from("course_module")
      .select("module_id, slug")
      .in("module_id", prereqIds);
    if (error) throw new Error(`prereq module read ${existing.slug}: ${error.message}`);
    const slugById = new Map(
      (prereqModules ?? []).map((row) => [row.module_id, row.slug]),
    );
    prerequisites = prereqIds.map((id) => slugById.get(id) ?? id);
  }

  const { data: artifactRows, error: artifactError } = await sb
    .from("module_uses_artifact")
    .select("artifact_kind, artifact_id, ord, role")
    .eq("module_id", existing.module_id);
  if (artifactError) {
    throw new Error(`artifact read ${existing.slug}: ${artifactError.message}`);
  }

  return {
    title: existing.title,
    body_md: existing.body_md,
    body_kind: existing.body_kind,
    duration_min: existing.duration_min,
    difficulty: existing.difficulty,
    status: existing.status,
    domain_buckets: existing.domain_buckets,
    learning_objectives: existing.learning_objectives,
    mini_quiz: existing.mini_quiz,
    prerequisites,
    artifact_refs: (artifactRows ?? []).map((ref) => ({
      artifact_kind: ref.artifact_kind,
      artifact_id: ref.artifact_id,
      ord: ref.ord,
      role: ref.role,
    })),
  };
}

function buildSearchText(
  fm: Record<string, unknown>,
  body: string,
): string {
  const parts: string[] = [];
  if (fm.title) parts.push(String(fm.title));
  if (fm.body_kind) parts.push(`type: ${fm.body_kind}`);
  if (fm.difficulty) parts.push(`difficulty: ${fm.difficulty}`);
  const objs = asStringArray(fm.learning_objectives);
  if (objs.length) parts.push("Objectives:\n" + objs.map((o) => `- ${o}`).join("\n"));
  // Trim body to a manageable size for the FTS column.
  parts.push(body.slice(0, 4000));
  return parts.join("\n\n");
}

async function upsertOneModule(
  sb: Client,
  m: ModuleFile,
  dryRun: boolean,
): Promise<{ moduleId: string | null; action: string; refreshLinks: boolean; finalizePublish: boolean }> {
  const slug = m.slug;
  const version = String(m.fm.version ?? "0.1.0");
  const status = String(m.fm.status ?? "draft");
  const isLatestPublished = status === "published";

  const { data: existing } = await sb
    .from("course_module")
    .select(
      "module_id, slug, version, title, body_md, body_kind, duration_min, difficulty, status, domain_buckets, learning_objectives, mini_quiz, content_hash",
    )
    .eq("slug", slug)
    .eq("version", version)
    .maybeSingle<ExistingModuleRow>();

  const sourcePath = relativeFromVaultRoot(m.absPath);
  const stagedStatus = isLatestPublished ? "review" : status;
  const candidate = {
    slug,
    version,
    title: String(m.fm.title ?? slug),
    body_md: m.body,
    body_kind: asString(m.fm.body_kind),
    duration_min: asInt(m.fm.duration_min),
    difficulty: asString(m.fm.difficulty),
    status,
    is_latest_published: isLatestPublished,
    domain_buckets: asStringArray(m.fm.domain_buckets),
    learning_objectives: asJson(m.fm.learning_objectives) as never,
    mini_quiz: asJson(m.fm.mini_quiz) as never,
    authors: asJson(m.fm.authors) as never,
    source_path: sourcePath,
    content_hash: m.contentHash,
    search_text: buildSearchText(m.fm, m.body),
    metadata: {
      provenance: m.fm.provenance ?? null,
      prerequisites: asStringArray(m.fm.prerequisites),
      generator: m.fm.generator ?? null,
      promoted_from: m.fm.promoted_from ?? null,
      bucket: (m.fm.provenance as Record<string, unknown> | undefined)?.bucket ?? null,
    } as never,
  };
  const stagedCandidate = isLatestPublished
    ? { ...candidate, status: stagedStatus, is_latest_published: false }
    : candidate;

  if (!existing) {
    if (dryRun) {
      console.log(`  [module] + INSERT ${slug}@${version} (status=${status})`);
      return { moduleId: null, action: "insert", refreshLinks: false, finalizePublish: false };
    }
    const { data, error } = await sb
      .from("course_module")
      .insert(stagedCandidate)
      .select("module_id")
      .single();
    if (error) throw new Error(`INSERT ${slug}@${version}: ${error.message}`);
    console.log(`  [module] + INSERT ${slug}@${version} -> ${data.module_id}`);
    return {
      moduleId: data.module_id,
      action: "insert",
      refreshLinks: true,
      finalizePublish: isLatestPublished,
    };
  }

  if (existing.status === "published") {
    const changedFields = diffModuleSemanticContent(
      await moduleSemanticFromExisting(sb, existing),
      moduleSemanticFromCandidate(m, status),
    );
    if (changedFields.length) {
      throw buildPublishedDriftError("module", slug, version, changedFields);
    }
    if (isLatestPublished && !dryRun) {
      const { error } = await sb
        .from("course_module")
        .update({ is_latest_published: true })
        .eq("module_id", existing.module_id);
      if (error) throw new Error(`PUBLISH flag ${slug}@${version}: ${error.message}`);
    }
    console.log(`  [module] = SKIP   ${slug}@${version} (published immutable)`);
    return {
      moduleId: existing.module_id,
      action: "skip",
      refreshLinks: false,
      finalizePublish: false,
    };
  }

  // Same version, same hash -> still flip is_latest_published if status changed.
  if (existing.content_hash === m.contentHash && existing.status === status) {
    if (isLatestPublished) {
      // Cheap noop update to ensure trigger has fired (flag may have been
      // reset by a sibling import); harmless if already true.
      await sb
        .from("course_module")
        .update({ is_latest_published: true })
        .eq("module_id", existing.module_id);
    }
    console.log(`  [module] = SKIP   ${slug}@${version} (hash unchanged)`);
    return {
      moduleId: existing.module_id,
      action: "skip",
      refreshLinks: true,
      finalizePublish: false,
    };
  }
  if (dryRun) {
    console.log(`  [module] ~ UPDATE ${slug}@${version} (status=${status})`);
    return {
      moduleId: existing.module_id,
      action: "update",
      refreshLinks: false,
      finalizePublish: false,
    };
  }
  const { error } = await sb
    .from("course_module")
    .update(stagedCandidate)
    .eq("module_id", existing.module_id);
  if (error) throw new Error(`UPDATE ${slug}@${version}: ${error.message}`);
  console.log(`  [module] ~ UPDATE ${slug}@${version} (status=${status})`);
  return {
    moduleId: existing.module_id,
    action: "update",
    refreshLinks: true,
    finalizePublish: isLatestPublished,
  };
}

async function replaceLinks(
  sb: Client,
  moduleId: string,
  m: ModuleFile,
  slugToId: Map<string, string>,
  dryRun: boolean,
): Promise<void> {
  // Prereqs: replace.
  const prereqSlugs = asStringArray(m.fm.prerequisites);
  const prereqIds: string[] = [];
  for (const s of prereqSlugs) {
    const id = slugToId.get(s);
    if (!id) throw new Error(`Prereq ${s} of ${m.slug} not yet in DB`);
    prereqIds.push(id);
  }
  if (!dryRun) {
    await sb.from("course_module_requires").delete().eq("module_id", moduleId);
    if (prereqIds.length) {
      const rows = prereqIds.map((p) => ({
        module_id: moduleId,
        prereq_module_id: p,
      }));
      const { error } = await sb.from("course_module_requires").insert(rows);
      if (error) throw new Error(`prereq insert ${m.slug}: ${error.message}`);
    }
  }
  console.log(`    [prereq]   ${prereqIds.length} row(s)`);

  // Artifacts: replace.
  const artifactRefs = readArtifactRefs(m.fm);
  if (!dryRun) {
    await sb.from("module_uses_artifact").delete().eq("module_id", moduleId);
    if (artifactRefs.length) {
      const rows = artifactRefs.map((a) => ({
        module_id: moduleId,
        artifact_kind: a.artifact_kind,
        artifact_id: a.artifact_id,
        ord: a.ord,
        role: a.role,
      }));
      const { error } = await sb.from("module_uses_artifact").insert(rows);
      if (error) throw new Error(`artifact insert ${m.slug}: ${error.message}`);
    }
  }
  console.log(`    [artifact] ${artifactRefs.length} row(s)`);
}

async function finalizePublishedModule(
  sb: Client,
  moduleId: string,
  m: ModuleFile,
): Promise<void> {
  const version = String(m.fm.version ?? "0.1.0");
  const { error } = await sb
    .from("course_module")
    .update({ status: "published", is_latest_published: true })
    .eq("module_id", moduleId);
  if (error) throw new Error(`PUBLISH ${m.slug}@${version}: ${error.message}`);
  console.log(`    [publish] ${m.slug}@${version}`);
}

function relativeFromVaultRoot(absPath: string): string {
  // Vault root contains "ai-intelligence". Slice from there for portability.
  const idx = absPath.replace(/\\/g, "/").lastIndexOf("/ai-intelligence/");
  if (idx < 0) return absPath;
  return absPath.replace(/\\/g, "/").slice(idx + 1);
}

async function main(): Promise<void> {
  const args = parseArgs();
  const all = await discoverModules(args);
  console.log(`[modules] discovered ${all.length} module file(s) under ${args.bucket}/course/modules/`);
  if (all.length === 0) return;
  const sorted = topoSortByPrereqs(all);

  const sb = createServiceSupabase();
  const slugToId = new Map<string, string>();
  const refreshLinksBySlug = new Map<string, boolean>();
  const finalizePublishBySlug = new Map<string, boolean>();

  // Phase 1: upsert rows.
  for (const m of sorted) {
    const { moduleId, refreshLinks, finalizePublish } = await upsertOneModule(
      sb,
      m,
      args.dryRun,
    );
    if (moduleId) slugToId.set(m.slug, moduleId);
    refreshLinksBySlug.set(m.slug, refreshLinks);
    finalizePublishBySlug.set(m.slug, finalizePublish);
  }

  // Phase 2: refresh slugToId for any rows that were dry-run insertions.
  if (!args.dryRun) {
    for (const m of sorted) {
      if (slugToId.has(m.slug)) continue;
      const { data } = await sb
        .from("course_module")
        .select("module_id")
        .eq("slug", m.slug)
        .eq("version", String(m.fm.version ?? "0.1.0"))
        .maybeSingle();
      if (data) slugToId.set(m.slug, data.module_id);
    }
  }

  // Phase 3: replace link tables.
  if (!args.dryRun) {
    for (const m of sorted) {
      const id = slugToId.get(m.slug);
      if (!id) {
        console.warn(`[links] skip ${m.slug} -- no module_id`);
        continue;
      }
      if (!refreshLinksBySlug.get(m.slug)) {
        console.log(`  [links] ${m.slug} (published immutable, unchanged)`);
        continue;
      }
      console.log(`  [links] ${m.slug}`);
      await replaceLinks(sb, id, m, slugToId, args.dryRun);
      if (finalizePublishBySlug.get(m.slug)) {
        await finalizePublishedModule(sb, id, m);
      }
    }
  }

  console.log(`[modules] done`);
}

main().catch((err) => {
  console.error("[upsert-modules] FAILED:", err);
  process.exit(1);
});
