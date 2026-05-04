import { createHash } from "node:crypto";
import { extname, resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { config as loadEnv } from "dotenv";

import { LEARNING_IMAGE_BLOB_PREFIX, uploadPublicBlob } from "../lib/storage/vercel-blob";
import type { Database, Json } from "../types/database.types";
import { createServiceSupabase } from "./_shared/vault";

loadEnv({ path: ".env.local", override: false });
loadEnv({ path: ".env", override: false });

type EntityKind = "course" | "course_module";
type ImageInsert = Database["public"]["Tables"]["image"]["Insert"];
type ImageRow = Database["public"]["Tables"]["image"]["Row"];
type ImageAttachmentInsert =
  Database["public"]["Tables"]["image_attachment"]["Insert"];

type Args = {
  kind: EntityKind;
  slug: string;
  file: string;
  role: string;
  variant: string;
  alt: string | null;
  title: string | null;
  dryRun: boolean;
};

type EntityTarget = {
  entityKind: EntityKind;
  entityId: string;
  slug: string;
  title: string;
  summary: string | null;
};

const DEFAULT_ROLE = "card";
const DEFAULT_VARIANT = "16x9";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const filePath = resolve(process.cwd(), args.file);
  const body = await readFile(filePath);
  const contentHash = createHash("sha256").update(body).digest("hex");
  const contentType = mimeTypeForPath(filePath);
  const extension = extensionForContentType(contentType, filePath);

  const target = await resolveTarget(args);
  const blobPathname = [
    LEARNING_IMAGE_BLOB_PREFIX,
    args.kind === "course" ? "courses" : "modules",
    target.slug,
    `${args.role}-${args.variant}-${contentHash.slice(0, 12)}${extension}`,
  ].join("/");

  const alt = args.alt ?? defaultAlt(target);
  const title = args.title ?? `${target.title} ${formatRole(args.role)} image`;

  if (args.dryRun) {
    console.log("[learning-image] dry run");
    console.log({
      filePath,
      contentType,
      contentHash,
      blobPathname,
      entityKind: target.entityKind,
      entityId: target.entityId,
      role: args.role,
      variant: args.variant,
      alt,
      title,
    });
    return;
  }

  const blob = await uploadPublicBlob({
    pathname: blobPathname,
    body,
    contentType,
    allowOverwrite: true,
  });

  const image = await upsertImage({
    url: blob.url,
    alt,
    title,
    contentType,
    contentHash,
    byteSize: body.byteLength,
    blobPathname,
    metadata: {
      generated_for: target.entityKind,
      generated_for_id: target.entityId,
      generated_for_slug: target.slug,
      role: args.role,
      variant: args.variant,
      uploaded_by: "scripts/upload-learning-image.ts",
    },
  });

  await attachImage({
    imageId: image.image_id,
    target,
    role: args.role,
    variant: args.variant,
    altOverride: alt,
  });

  console.log(
    `[learning-image] attached ${blob.url} to ${target.entityKind}:${target.slug} as ${args.role}/${args.variant}`,
  );
}

async function resolveTarget(args: Args): Promise<EntityTarget> {
  const sb = createServiceSupabase();

  if (args.kind === "course") {
    const { data, error } = await sb
      .from("course")
      .select("course_id, slug, title, summary")
      .eq("slug", args.slug)
      .eq("is_latest_published", true)
      .maybeSingle();
    if (error) throw new Error(`course lookup failed: ${error.message}`);
    if (!data) throw new Error(`No latest published course found for slug ${args.slug}`);
    return {
      entityKind: "course",
      entityId: data.course_id,
      slug: data.slug,
      title: data.title,
      summary: data.summary,
    };
  }

  const { data, error } = await sb
    .from("course_module")
    .select("module_id, slug, title, search_text")
    .eq("slug", args.slug)
    .eq("is_latest_published", true)
    .maybeSingle();
  if (error) throw new Error(`course module lookup failed: ${error.message}`);
  if (!data) throw new Error(`No latest published module found for slug ${args.slug}`);
  return {
    entityKind: "course_module",
    entityId: data.module_id,
    slug: data.slug,
    title: data.title,
    summary: data.search_text,
  };
}

async function upsertImage(input: {
  url: string;
  alt: string;
  title: string;
  contentType: string;
  contentHash: string;
  byteSize: number;
  blobPathname: string;
  metadata: Json;
}): Promise<ImageRow> {
  const sb = createServiceSupabase();
  const { data: existing, error: lookupError } = await sb
    .from("image")
    .select("*")
    .eq("content_hash", input.contentHash)
    .maybeSingle();
  if (lookupError) throw new Error(`image lookup failed: ${lookupError.message}`);
  if (existing) return existing;

  const row: ImageInsert = {
    url: input.url,
    alt: input.alt,
    title: input.title,
    caption: null,
    content_hash: input.contentHash,
    byte_size: input.byteSize,
    mime_type: input.contentType,
    source: "generated",
    storage_provider: "generated",
    storage_bucket: null,
    storage_key: input.blobPathname,
    metadata: input.metadata,
    nsfw: false,
    is_animated: false,
  };

  const { data, error } = await sb.from("image").insert(row).select("*").single();
  if (error) throw new Error(`image insert failed: ${error.message}`);
  return data;
}

async function attachImage(input: {
  imageId: string;
  target: EntityTarget;
  role: string;
  variant: string;
  altOverride: string;
}): Promise<void> {
  const sb = createServiceSupabase();
  const row: ImageAttachmentInsert = {
    image_id: input.imageId,
    entity_kind: input.target.entityKind,
    entity_id: input.target.entityId,
    role: input.role,
    variant: input.variant,
    ord: 0,
    alt_override: input.altOverride,
    render_hints: {
      aspect: input.variant,
      loading: "lazy",
      sizes: "(min-width: 1024px) 24rem, 100vw",
    },
  };

  const { error } = await sb.from("image_attachment").upsert(row, {
    onConflict: "entity_kind,entity_id,role,variant,ord",
  });
  if (error) throw new Error(`image attachment upsert failed: ${error.message}`);
}

function parseArgs(argv: string[]): Args {
  let kind: EntityKind | null = null;
  let slug = "";
  let file = "";
  let role = DEFAULT_ROLE;
  let variant = DEFAULT_VARIANT;
  let alt: string | null = null;
  let title: string | null = null;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--") {
      continue;
    } else if (arg === "--kind" && next) {
      kind = parseEntityKind(next);
      i++;
    } else if (arg === "--slug" && next) {
      slug = next;
      i++;
    } else if (arg === "--file" && next) {
      file = next;
      i++;
    } else if (arg === "--role" && next) {
      role = next;
      i++;
    } else if (arg === "--variant" && next) {
      variant = next;
      i++;
    } else if (arg === "--alt" && next) {
      alt = next;
      i++;
    } else if (arg === "--title" && next) {
      title = next;
      i++;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }

  if (!kind) throw new Error("Missing --kind course|module");
  if (!slug) throw new Error("Missing --slug");
  if (!file) throw new Error("Missing --file");

  return { kind, slug, file, role, variant, alt, title, dryRun };
}

function parseEntityKind(value: string): EntityKind {
  if (value === "course") return "course";
  if (value === "module" || value === "course_module") return "course_module";
  throw new Error(`Invalid --kind ${value}; expected course or module`);
}

function mimeTypeForPath(path: string): string {
  const ext = extname(path).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  throw new Error(`Unsupported image extension: ${ext || "(none)"}`);
}

function extensionForContentType(contentType: string, path: string): string {
  const ext = extname(path).toLowerCase();
  if (ext) return ext === ".jpeg" ? ".jpg" : ext;
  if (contentType === "image/png") return ".png";
  if (contentType === "image/jpeg") return ".jpg";
  if (contentType === "image/webp") return ".webp";
  if (contentType === "image/gif") return ".gif";
  return "";
}

function defaultAlt(target: EntityTarget): string {
  return `Illustration for ${target.title}`;
}

function formatRole(role: string): string {
  return role.replace(/[-_]+/g, " ");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
