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
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

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
import {
  extractLearningAssetText,
  inspectLearningAssetFile,
  readLearningAssetDeclarations,
  resolveLearningAssetPath,
  storagePathForLearningAsset,
  type LearningAssetDeclaration,
} from "../lib/learn/learning-assets";
import type { Database } from "../types/database.types";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const LEARNING_ASSET_STORAGE_BUCKET = "learning-assets";

type LearningAssetInsert = Database["public"]["Tables"]["learning_asset"]["Insert"];

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

interface LearningAssetRow {
  asset_id: string;
}

interface ExistingLearningAssetRow {
  slug: string;
  title: string;
  description: string | null;
  asset_kind: string;
  provider: string;
  bucket: string | null;
  storage_path: string | null;
  external_url: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  checksum_sha256: string | null;
  preview_url: string | null;
  extraction_status: string;
  extraction_error: string | null;
  extracted_text: string | null;
  source_path: string | null;
  metadata: unknown;
}

interface PreparedLearningAsset {
  declaration: LearningAssetDeclaration;
  row: LearningAssetInsert;
  storageBytes: Buffer | null;
  storagePath: string | null;
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

async function readLearningAssetSemanticRefs(
  sb: Client,
  bucket: string,
  m: ModuleFile,
  startOrd: number,
): Promise<ArtifactRefRow[]> {
  const declarations = readLearningAssetDeclarations(m.fm, bucket, m.slug);
  const out: ArtifactRefRow[] = [];
  for (const declaration of declarations) {
    const { data, error } = await sb
      .from("learning_asset")
      .select("asset_id")
      .eq("slug", declaration.slug)
      .maybeSingle<LearningAssetRow>();
    if (error) {
      throw new Error(`learning_asset read ${declaration.slug}: ${error.message}`);
    }
    out.push({
      artifact_kind: "learning_asset",
      artifact_id: data?.asset_id ?? `missing:${declaration.slug}`,
      ord: startOrd + out.length,
      role: declaration.role,
    });
  }
  return out;
}

async function moduleSemanticFromCandidate(
  sb: Client,
  bucket: string,
  m: ModuleFile,
  status: string,
): Promise<ModuleSemanticContent> {
  const artifactRefs = readArtifactRefs(m.fm);
  const learningAssetRefs = await readLearningAssetSemanticRefs(
    sb,
    bucket,
    m,
    artifactRefs.length,
  );
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
    artifact_refs: toArtifactSemanticRefs([...artifactRefs, ...learningAssetRefs]),
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

async function assertPublishedLearningAssetsUnchanged(
  sb: Client,
  bucket: string,
  m: ModuleFile,
  slug: string,
  version: string,
): Promise<void> {
  const preparedAssets = await prepareLearningAssets(bucket, m);
  const changed: string[] = [];

  for (const { declaration, row } of preparedAssets) {
    const { data, error } = await sb
      .from("learning_asset")
      .select(
        "slug, title, description, asset_kind, provider, bucket, storage_path, external_url, mime_type, file_size_bytes, checksum_sha256, preview_url, extraction_status, extraction_error, extracted_text, source_path, metadata",
      )
      .eq("slug", declaration.slug)
      .maybeSingle<ExistingLearningAssetRow>();
    if (error) {
      throw new Error(`learning_asset read ${declaration.slug}: ${error.message}`);
    }
    if (!data) {
      changed.push(`learning_asset:${declaration.slug}:missing`);
      continue;
    }

    if (
      stableStringify(learningAssetSemanticSnapshot(data)) !==
      stableStringify(learningAssetSemanticSnapshot(row))
    ) {
      changed.push(`learning_asset:${declaration.slug}`);
    }
  }

  if (changed.length) {
    throw buildPublishedDriftError("module", slug, version, changed);
  }
}

function learningAssetSemanticSnapshot(
  row: LearningAssetInsert | ExistingLearningAssetRow,
): Record<string, unknown> {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description ?? null,
    asset_kind: row.asset_kind,
    provider: row.provider,
    bucket: row.bucket ?? null,
    storage_path: row.storage_path ?? null,
    external_url: row.external_url ?? null,
    mime_type: row.mime_type ?? null,
    file_size_bytes: row.file_size_bytes ?? null,
    checksum_sha256: row.checksum_sha256 ?? null,
    preview_url: row.preview_url ?? null,
    extraction_status: row.extraction_status ?? "pending",
    extraction_error: row.extraction_error ?? null,
    extracted_text: row.extracted_text ?? null,
    source_path: row.source_path ?? null,
    metadata: row.metadata ?? {},
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
  bucket: string,
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
    await assertPublishedLearningAssetsUnchanged(sb, bucket, m, slug, version);
    const changedFields = diffModuleSemanticContent(
      await moduleSemanticFromExisting(sb, existing),
      await moduleSemanticFromCandidate(sb, bucket, m, status),
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
  bucket: string,
  dryRun: boolean,
): Promise<void> {
  // Assets are inspected/extracted before any link table mutation so required
  // extraction failures block publish without replacing prerequisite/artifact rows.
  const corpusArtifactRefs = readArtifactRefs(m.fm);
  const preparedLearningAssets = await prepareLearningAssets(bucket, m);
  const learningAssetRefs = await upsertPreparedLearningAssets(
    sb,
    preparedLearningAssets,
    corpusArtifactRefs.length,
    dryRun,
  );
  const artifactRefs = [...corpusArtifactRefs, ...learningAssetRefs];

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

  // Artifacts and owned learning assets: replace before publish finalization.
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

async function prepareLearningAssets(
  bucket: string,
  m: ModuleFile,
): Promise<PreparedLearningAsset[]> {
  const declarations = readLearningAssetDeclarations(m.fm, bucket, m.slug);
  const prepared: PreparedLearningAsset[] = [];
  for (const declaration of declarations) {
    const asset = await buildLearningAssetRow(bucket, m, declaration);
    if (asset.row.extraction_status === "failed" && declaration.extractionRequired) {
      throw new Error(
        `Required extraction failed for ${declaration.slug}: ${asset.row.extraction_error}`,
      );
    }
    prepared.push({ declaration, ...asset });
  }
  return prepared;
}

async function upsertPreparedLearningAssets(
  sb: Client,
  preparedAssets: PreparedLearningAsset[],
  startOrd: number,
  dryRun: boolean,
): Promise<ArtifactRefRow[]> {
  const refs: ArtifactRefRow[] = [];
  for (const { declaration, row, storageBytes, storagePath } of preparedAssets) {
    if (dryRun) {
      console.log(
        `    [asset]    DRY ${declaration.slug} (${declaration.provider})`,
      );
      refs.push({
        artifact_kind: "learning_asset",
        artifact_id: `dry:${declaration.slug}`,
        ord: startOrd + refs.length,
        role: declaration.role,
      });
      continue;
    }

    if (storageBytes && storagePath) {
      const { error: uploadError } = await sb.storage
        .from(LEARNING_ASSET_STORAGE_BUCKET)
        .upload(storagePath, storageBytes, {
          upsert: true,
          contentType: row.mime_type ?? undefined,
        });
      if (uploadError) {
        throw new Error(`asset upload ${declaration.slug}: ${uploadError.message}`);
      }
    }

    const { data, error } = await sb
      .from("learning_asset")
      .upsert(row, { onConflict: "slug" })
      .select("asset_id")
      .single<LearningAssetRow>();
    if (error) throw new Error(`learning_asset upsert ${declaration.slug}: ${error.message}`);

    if (row.extraction_error && !declaration.extractionRequired) {
      console.warn(`    [asset]    WARN ${declaration.slug}: ${row.extraction_error}`);
    }

    refs.push({
      artifact_kind: "learning_asset",
      artifact_id: data.asset_id,
      ord: startOrd + refs.length,
      role: declaration.role,
    });
    console.log(`    [asset]    ${declaration.slug} -> ${data.asset_id}`);
  }

  return refs;
}

async function buildLearningAssetRow(
  bucket: string,
  m: ModuleFile,
  declaration: LearningAssetDeclaration,
): Promise<{
  row: LearningAssetInsert;
  storageBytes: Buffer | null;
  storagePath: string | null;
}> {
  if (declaration.provider === "external-url") {
    const extraction = await extractLearningAssetText(
      null,
      declaration.extractionRequired,
    );
    return {
      row: {
        slug: declaration.slug,
        title: declaration.title,
        description: declaration.description,
        asset_kind: declaration.kind,
        provider: declaration.provider,
        bucket: null,
        storage_path: null,
        external_url: declaration.externalUrl,
        mime_type: null,
        file_size_bytes: null,
        checksum_sha256: null,
        preview_url: null,
        extraction_status: extraction.status,
        extraction_error: extraction.error,
        extracted_text: extraction.text,
        text_extracted_at: extraction.extractedAt,
        source_path: declaration.externalUrl,
        metadata: assetMetadata(bucket, m, declaration),
      },
      storageBytes: null,
      storagePath: null,
    };
  }

  if (!declaration.path) {
    throw new Error(`Asset ${declaration.slug} is missing a local path`);
  }
  const absPath = resolveLearningAssetPath(m.absPath, declaration.path);
  const inspection = await inspectLearningAssetFile(
    absPath,
    resolve(dirname(m.absPath), "assets"),
  );
  const extraction = await extractLearningAssetText(
    inspection,
    declaration.extractionRequired,
  );
  const storagePath = storagePathForLearningAsset(
    bucket,
    m.slug,
    declaration.id,
    inspection.filename,
  );

  return {
    row: {
      slug: declaration.slug,
      title: declaration.title,
      description: declaration.description,
      asset_kind: declaration.kind,
      provider: "supabase-storage",
      bucket: LEARNING_ASSET_STORAGE_BUCKET,
      storage_path: storagePath,
      external_url: null,
      mime_type: inspection.mimeType,
      file_size_bytes: inspection.fileSizeBytes,
      checksum_sha256: inspection.checksumSha256,
      preview_url: null,
      extraction_status: extraction.status,
      extraction_error: extraction.error ?? extraction.warning,
      extracted_text: extraction.text,
      text_extracted_at: extraction.extractedAt,
      source_path: relativeFromVaultRoot(absPath),
      metadata: assetMetadata(bucket, m, declaration),
    },
    storageBytes: await readFile(absPath),
    storagePath,
  };
}

function assetMetadata(
  bucket: string,
  m: ModuleFile,
  declaration: LearningAssetDeclaration,
): Record<string, unknown> {
  return {
    ...declaration.metadata,
    bucket,
    module_slug: m.slug,
    asset_id: declaration.id,
    extraction_required: declaration.extractionRequired,
  };
}

function stableStringify(value: unknown): string {
  return JSON.stringify(normalizeJson(value));
}

function normalizeJson(value: unknown): unknown {
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
      args.bucket,
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
      await replaceLinks(sb, id, m, slugToId, args.bucket, args.dryRun);
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
