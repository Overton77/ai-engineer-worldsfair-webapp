/**
 * upsert-courses.ts -- project vault `course.md` files into the `course`
 * table (and `course_module_in_course`).
 *
 * Front-matter shape (see aiwiki/.../06_courses/.../course.md template):
 *   slug, version, title, status, domain_bucket, domain_layer,
 *   estimated_hours, audience, modules: [{ module: <slug>, role?: <role>,
 *   pinned_version?: <version> }, ...], capstone_challenge: <slug|null>
 *
 * Behavior per course:
 *   1. Resolve by (slug, version). INSERT if missing. If present and already
 *      published, compare semantic fields and module composition; fail on
 *      same-version drift so authors bump version.
 *   2. status=='published' -> is_latest_published=true (BEFORE trigger
 *      maintains the partial unique index).
 *   3. Replace `course_module_in_course` rows for draft/review courses.
 *      Published unchanged courses skip composition replacement because the
 *      syllabus is immutable semantic content.
 *      Module slugs are resolved against `course_module` rows where
 *      `is_latest_published OR pinned_version is set`.
 *   4. capstone_challenge slug is resolved against the `challenge` table if
 *      it exists; if not (script run before upsert-challenges), the FK is
 *      left NULL and the orchestrator (publish-bucket.ts) will re-run this
 *      step after challenges are loaded.
 *
 * Run (after modules for the same bucket):
 *   pnpm run vault:upsert-courses:agent-orchestration
 *   pnpm run vault:upsert:agent-orchestration-skills-mini   # modules + course
 *   pnpm exec tsx scripts/upsert-courses.ts --bucket agent_orchestration --dry-run
 *
 * Course markdown for the mini starter:
 *   .../01_buckets/agent_orchestration/course/courses/agent-orchestration-skills-mini/course.md
 */

import { config as loadEnv } from "dotenv";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createServiceSupabase,
  parseCommonArgs,
  readMarkdownDoc,
  asString,
  asInt,
  asJson,
  type Client,
} from "./_shared/vault";
import {
  buildPublishedDriftError,
  diffCourseSemanticContent,
  type CourseSemanticContent,
  type CourseSemanticSlot,
} from "../lib/learn/content-immutability";
import type { Database } from "../types/database.types";

type CourseModuleInCourseInsert =
  Database["public"]["Tables"]["course_module_in_course"]["Insert"];

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
        "Usage: pnpm exec tsx scripts/upsert-courses.ts --bucket <bucket> [--slug <course-slug>] [--dry-run]",
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown arg: ${a}`);
    }
  }
  if (!common.bucket) throw new Error("--bucket required");
  return { ...common, onlySlug };
}

interface CourseFile {
  slug: string;
  absPath: string;
  fm: Record<string, unknown>;
  body: string;
  contentHash: string;
}

interface ModuleSlot {
  slug: string;
  ord: number;
  role: string | null;
  pinnedVersion: string | null;
}

interface ExistingCourseRow {
  course_id: string;
  slug: string;
  version: string;
  title: string;
  summary: string | null;
  narrative_md: string | null;
  est_hours: number | null;
  domain_bucket: string;
  domain_layer: string | null;
  capstone_challenge_id: string | null;
  status: string;
}

async function discoverCourses(args: Args): Promise<CourseFile[]> {
  const dir = resolve(
    args.vaultRoot,
    "01_buckets",
    args.bucket,
    "course",
    "courses",
  );
  let entries: string[] = [];
  try {
    entries = await readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      console.log(`[courses] no courses folder at ${dir}`);
      return [];
    }
    throw err;
  }
  const out: CourseFile[] = [];
  for (const entry of entries) {
    const path = resolve(dir, entry, "course.md");
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

function readModuleSlots(fm: Record<string, unknown>): ModuleSlot[] {
  const items = (fm.modules ?? []) as unknown[];
  if (!Array.isArray(items)) return [];
  return items
    .map((it, i) => {
      if (it === null || typeof it !== "object" || Array.isArray(it)) return null;
      const o = it as Record<string, unknown>;
      const slug = String(o.module ?? o.slug ?? "");
      if (!slug) return null;
      return {
        slug,
        ord: i,
        role: o.role ? String(o.role) : null,
        pinnedVersion: o.pinned_version ? String(o.pinned_version) : null,
      };
    })
    .filter((x): x is ModuleSlot => x !== null);
}

function relativeFromVaultRoot(absPath: string): string {
  const idx = absPath.replace(/\\/g, "/").lastIndexOf("/ai-intelligence/");
  if (idx < 0) return absPath;
  return absPath.replace(/\\/g, "/").slice(idx + 1);
}

function buildSummary(fm: Record<string, unknown>, body: string): string {
  // First non-heading paragraph after the H1.
  const lines = body.split(/\r?\n/);
  let started = false;
  const buf: string[] = [];
  for (const l of lines) {
    if (!started) {
      if (l.startsWith("# ")) started = true;
      continue;
    }
    if (l.startsWith("#")) break;
    if (l.trim() === "" && buf.length === 0) continue;
    if (l.trim() === "" && buf.length > 0) break;
    buf.push(l.trim());
  }
  const summary = buf.join(" ").replace(/\s+/g, " ").trim();
  return summary || String(fm.title ?? "");
}

async function resolveCourseModuleRows(
  sb: Client,
  courseId: string,
  slots: ModuleSlot[],
): Promise<CourseModuleInCourseInsert[]> {
  const rows: CourseModuleInCourseInsert[] = [];
  for (const slot of slots) {
    let moduleId: string | null = null;
    if (slot.pinnedVersion) {
      const { data } = await sb
        .from("course_module")
        .select("module_id")
        .eq("slug", slot.slug)
        .eq("version", slot.pinnedVersion)
        .maybeSingle();
      moduleId = data?.module_id ?? null;
    } else {
      const { data } = await sb
        .from("course_module")
        .select("module_id")
        .eq("slug", slot.slug)
        .eq("is_latest_published", true)
        .maybeSingle();
      moduleId = data?.module_id ?? null;
      if (!moduleId) {
        // Fallback: any draft/review row, latest version by sort.
        const { data: anyRow } = await sb
          .from("course_module")
          .select("module_id, version")
          .eq("slug", slot.slug)
          .order("created_at", { ascending: false })
          .limit(1);
        moduleId = anyRow?.[0]?.module_id ?? null;
      }
    }
    if (!moduleId) {
      throw new Error(
        `Module slug not in DB: ${slot.slug} (pinned_version=${slot.pinnedVersion})`,
      );
    }
    rows.push({
      course_id: courseId,
      module_id: moduleId,
      ord: slot.ord,
      pinned_version: slot.pinnedVersion,
      role: slot.role,
    });
  }
  return rows;
}

function toCourseSemanticSlots(
  rows: CourseModuleInCourseInsert[],
): CourseSemanticSlot[] {
  return rows.map((row) => ({
    module_id: row.module_id,
    ord: row.ord,
    pinned_version: row.pinned_version ?? null,
    role: row.role ?? null,
  }));
}

function courseSemanticFromRow(
  row: ExistingCourseRow,
  modules: CourseSemanticSlot[],
): CourseSemanticContent {
  return {
    title: row.title,
    summary: row.summary,
    narrative_md: row.narrative_md,
    est_hours: row.est_hours,
    domain_bucket: row.domain_bucket,
    domain_layer: row.domain_layer,
    capstone_challenge_id: row.capstone_challenge_id,
    status: row.status,
    modules,
  };
}

async function existingCourseModules(
  sb: Client,
  courseId: string,
): Promise<CourseSemanticSlot[]> {
  const { data, error } = await sb
    .from("course_module_in_course")
    .select("module_id, ord, pinned_version, role")
    .eq("course_id", courseId);
  if (error) throw new Error(`course_module_in_course read: ${error.message}`);
  return (data ?? []).map((row) => ({
    module_id: row.module_id,
    ord: row.ord,
    pinned_version: row.pinned_version,
    role: row.role,
  }));
}

async function resolveCapstone(
  sb: Client,
  fmCapstone: unknown,
): Promise<string | null> {
  if (!fmCapstone) return null;
  const slug = String(fmCapstone);
  const { data } = await sb
    .from("challenge")
    .select("challenge_id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.challenge_id ?? null;
}

async function upsertOneCourse(
  sb: Client,
  c: CourseFile,
  slots: ModuleSlot[],
  dryRun: boolean,
): Promise<{ courseId: string | null; refreshModules: boolean; finalizePublish: boolean }> {
  const slug = c.slug;
  const version = String(c.fm.version ?? "0.1.0");
  const status = String(c.fm.status ?? "draft");
  const isLatestPublished = status === "published";

  const { data: existing } = await sb
    .from("course")
    .select(
      "course_id, slug, version, title, summary, narrative_md, est_hours, domain_bucket, domain_layer, capstone_challenge_id, status",
    )
    .eq("slug", slug)
    .eq("version", version)
    .maybeSingle<ExistingCourseRow>();

  const candidate = {
    slug,
    version,
    title: String(c.fm.title ?? slug),
    status,
    is_latest_published: isLatestPublished,
    domain_bucket: String(c.fm.domain_bucket ?? ""),
    domain_layer: asString(c.fm.domain_layer),
    est_hours: asInt(c.fm.estimated_hours),
    summary: buildSummary(c.fm, c.body),
    narrative_md: c.body,
    authors: asJson(c.fm.authors) as never,
    metadata: {
      audience: c.fm.audience ?? null,
      provenance: c.fm.provenance ?? null,
      generator: c.fm.generator ?? null,
      source_path: relativeFromVaultRoot(c.absPath),
    } as never,
    capstone_challenge_id: await resolveCapstone(sb, c.fm.capstone_challenge),
  };
  const stagedCandidate = isLatestPublished
    ? { ...candidate, status: "review", is_latest_published: false }
    : candidate;

  if (!existing) {
    if (dryRun) {
      console.log(`  [course] + INSERT ${slug}@${version} (status=${status})`);
      return { courseId: null, refreshModules: false, finalizePublish: false };
    }
    const { data, error } = await sb
      .from("course")
      .insert(stagedCandidate)
      .select("course_id")
      .single();
    if (error) throw new Error(`INSERT course ${slug}: ${error.message}`);
    console.log(
      `  [course] + INSERT ${slug}@${version} -> ${data.course_id}` +
        (candidate.capstone_challenge_id ? " (+ capstone)" : ""),
    );
    return {
      courseId: data.course_id,
      refreshModules: true,
      finalizePublish: isLatestPublished,
    };
  }

  if (existing.status === "published") {
    const candidateRows = await resolveCourseModuleRows(sb, existing.course_id, slots);
    const changedFields = diffCourseSemanticContent(
      courseSemanticFromRow(existing, await existingCourseModules(sb, existing.course_id)),
      {
        title: candidate.title,
        summary: candidate.summary,
        narrative_md: candidate.narrative_md,
        est_hours: candidate.est_hours,
        domain_bucket: candidate.domain_bucket,
        domain_layer: candidate.domain_layer,
        capstone_challenge_id: candidate.capstone_challenge_id,
        status,
        modules: toCourseSemanticSlots(candidateRows),
      },
    );
    if (changedFields.length) {
      throw buildPublishedDriftError("course", slug, version, changedFields);
    }
    if (isLatestPublished && !dryRun) {
      const { error } = await sb
        .from("course")
        .update({ is_latest_published: true })
        .eq("course_id", existing.course_id);
      if (error) throw new Error(`PUBLISH flag course ${slug}: ${error.message}`);
    }
    console.log(`  [course] = SKIP   ${slug}@${version} (published immutable)`);
    return {
      courseId: existing.course_id,
      refreshModules: false,
      finalizePublish: false,
    };
  }

  if (dryRun) {
    console.log(`  [course] ~ UPDATE ${slug}@${version} (status=${status})`);
    return {
      courseId: existing.course_id,
      refreshModules: false,
      finalizePublish: false,
    };
  }
  const { error } = await sb
    .from("course")
    .update(stagedCandidate)
    .eq("course_id", existing.course_id);
  if (error) throw new Error(`UPDATE course ${slug}: ${error.message}`);
  console.log(`  [course] ~ UPDATE ${slug}@${version}`);
  return {
    courseId: existing.course_id,
    refreshModules: true,
    finalizePublish: isLatestPublished,
  };
}

async function replaceCourseModules(
  sb: Client,
  courseId: string,
  rows: CourseModuleInCourseInsert[],
  dryRun: boolean,
): Promise<void> {
  if (dryRun) {
    console.log(`    [slots]  ${rows.length} row(s) (dry)`);
    return;
  }
  await sb.from("course_module_in_course").delete().eq("course_id", courseId);
  if (rows.length === 0) return;
  const { error } = await sb.from("course_module_in_course").insert(rows);
  if (error) throw new Error(`course_module_in_course insert: ${error.message}`);
  console.log(`    [slots]  ${rows.length} row(s)`);
}

async function finalizePublishedCourse(
  sb: Client,
  courseId: string,
  c: CourseFile,
): Promise<void> {
  const version = String(c.fm.version ?? "0.1.0");
  const { error } = await sb
    .from("course")
    .update({ status: "published", is_latest_published: true })
    .eq("course_id", courseId);
  if (error) throw new Error(`PUBLISH course ${c.slug}@${version}: ${error.message}`);
  console.log(`    [publish] ${c.slug}@${version}`);
}

async function main(): Promise<void> {
  const args = parseArgs();
  const all = await discoverCourses(args);
  console.log(`[courses] discovered ${all.length} course file(s) under ${args.bucket}/course/courses/`);
  if (all.length === 0) return;

  const sb = createServiceSupabase();

  for (const c of all) {
    const slots = readModuleSlots(c.fm);
    const { courseId, refreshModules, finalizePublish } = await upsertOneCourse(
      sb,
      c,
      slots,
      args.dryRun,
    );
    if (!courseId) continue;
    if (!refreshModules) {
      console.log(`    [slots]  unchanged published composition`);
      continue;
    }
    const rows = await resolveCourseModuleRows(sb, courseId, slots);
    await replaceCourseModules(sb, courseId, rows, args.dryRun);
    if (finalizePublish) {
      await finalizePublishedCourse(sb, courseId, c);
    }
  }

  console.log("[courses] done");
}

main().catch((err) => {
  console.error("[upsert-courses] FAILED:", err);
  process.exit(1);
});
