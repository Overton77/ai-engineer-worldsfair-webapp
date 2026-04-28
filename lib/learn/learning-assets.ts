import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, relative, resolve } from "node:path";

export const LEARNING_ASSET_KINDS = [
  "pdf",
  "docx",
  "image",
  "slides",
  "source-file",
  "archive",
  "web",
  "text",
  "markdown",
  "data",
  "other",
] as const;

export type LearningAssetKind = (typeof LEARNING_ASSET_KINDS)[number];

export const LEARNING_ASSET_ROLES = [
  "primary",
  "reference",
  "supporting",
  "example",
  "source",
] as const;

export type LearningAssetRole = (typeof LEARNING_ASSET_ROLES)[number];

export type LearningAssetProvider = "supabase-storage" | "s3" | "external-url";

export interface LearningAssetDeclaration {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: LearningAssetKind;
  role: LearningAssetRole;
  extractionRequired: boolean;
  provider: LearningAssetProvider;
  path: string | null;
  externalUrl: string | null;
  metadata: Record<string, unknown>;
}

export interface LearningAssetFileInspection {
  absPath: string;
  filename: string;
  mimeType: string | null;
  fileSizeBytes: number;
  checksumSha256: string;
  textLike: boolean;
}

export interface ExtractedAssetText {
  status: "succeeded" | "failed" | "not_required";
  text: string | null;
  extractedAt: string | null;
  error: string | null;
  warning: string | null;
}

const KIND_SET = new Set<string>(LEARNING_ASSET_KINDS);
const ROLE_SET = new Set<string>(LEARNING_ASSET_ROLES);

const MIME_BY_EXT: Record<string, string> = {
  ".md": "text/markdown",
  ".markdown": "text/markdown",
  ".txt": "text/plain",
  ".json": "application/json",
  ".jsonl": "application/x-ndjson",
  ".csv": "text/csv",
  ".ts": "text/typescript",
  ".tsx": "text/tsx",
  ".js": "text/javascript",
  ".jsx": "text/jsx",
  ".py": "text/x-python",
  ".sql": "application/sql",
  ".yaml": "application/yaml",
  ".yml": "application/yaml",
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const TEXT_EXTENSIONS = new Set([
  ".md",
  ".markdown",
  ".txt",
  ".json",
  ".jsonl",
  ".csv",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".sql",
  ".yaml",
  ".yml",
  ".svg",
]);

export function readLearningAssetDeclarations(
  frontMatter: Record<string, unknown>,
  bucket: string,
  moduleSlug: string,
): LearningAssetDeclaration[] {
  assertSafeSlugSegment(bucket, "bucket");
  assertSafeSlugSegment(moduleSlug, "module slug");

  const rawAssets = frontMatter.assets;
  if (rawAssets === undefined || rawAssets === null) return [];
  if (!Array.isArray(rawAssets)) {
    throw new Error(`assets for ${moduleSlug} must be a list`);
  }

  const seenIds = new Set<string>();
  return rawAssets.map((raw, index) => {
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error(`assets[${index}] for ${moduleSlug} must be a mapping`);
    }
    const asset = raw as Record<string, unknown>;
    const id = requiredString(asset.id, `assets[${index}].id`);
    assertSafeSlugSegment(id, `assets[${index}].id`);
    if (seenIds.has(id)) {
      throw new Error(`Duplicate learning asset id for ${moduleSlug}: ${id}`);
    }
    seenIds.add(id);

    const path = optionalString(asset.path);
    const externalUrl = optionalString(asset.external_url ?? asset.url);
    const provider = readProvider(asset.provider, path, externalUrl);
    if (provider === "external-url" && !externalUrl) {
      throw new Error(`assets[${index}] external-url provider requires external_url`);
    }
    if (provider !== "external-url" && !path) {
      throw new Error(`assets[${index}] ${provider} provider requires path`);
    }

    const kind = readKind(asset.kind, path, externalUrl);
    const role = readRole(asset.role);
    const title = optionalString(asset.title) ?? humanizeId(id);

    return {
      id,
      slug: buildLearningAssetSlug(bucket, moduleSlug, id),
      title,
      description: optionalString(asset.description),
      kind,
      role,
      extractionRequired: asset.extraction_required === true,
      provider,
      path,
      externalUrl,
      metadata: readMetadata(asset.metadata),
    };
  });
}

export function buildLearningAssetSlug(
  bucket: string,
  moduleSlug: string,
  assetId: string,
): string {
  assertSafeSlugSegment(bucket, "bucket");
  assertSafeSlugSegment(moduleSlug, "module slug");
  assertSafeSlugSegment(assetId, "asset id");
  return `${bucket}/${moduleSlug}/${assetId}`;
}

export function resolveLearningAssetPath(
  moduleAbsPath: string,
  relativePath: string,
): string {
  if (isAbsolute(relativePath)) {
    throw new Error(`Learning asset path must be relative: ${relativePath}`);
  }
  const moduleDir = dirname(moduleAbsPath);
  const assetsDir = resolve(moduleDir, "assets");
  const assetPath = resolve(moduleDir, relativePath);
  const relativeToAssets = relative(assetsDir, assetPath);
  if (relativeToAssets.startsWith("..") || isAbsolute(relativeToAssets)) {
    throw new Error(`Learning asset path must stay under ./assets: ${relativePath}`);
  }
  return assetPath;
}

export function storagePathForLearningAsset(
  bucket: string,
  moduleSlug: string,
  assetId: string,
  filename: string,
): string {
  assertSafeSlugSegment(bucket, "bucket");
  assertSafeSlugSegment(moduleSlug, "module slug");
  assertSafeSlugSegment(assetId, "asset id");
  return `course/${bucket}/modules/${moduleSlug}/${assetId}/${filename}`;
}

export async function inspectLearningAssetFile(
  absPath: string,
  expectedAssetsRoot?: string,
): Promise<LearningAssetFileInspection> {
  const realAssetPath = await realpath(absPath);
  if (expectedAssetsRoot) {
    const realAssetsRoot = await realpath(expectedAssetsRoot);
    const relativeToRoot = relative(realAssetsRoot, realAssetPath);
    if (relativeToRoot.startsWith("..") || isAbsolute(relativeToRoot)) {
      throw new Error(`Learning asset path escapes assets directory: ${absPath}`);
    }
  }

  const bytes = await readFile(realAssetPath);
  const info = await stat(realAssetPath);
  const ext = extname(realAssetPath).toLowerCase();
  return {
    absPath: realAssetPath,
    filename: basename(realAssetPath),
    mimeType: MIME_BY_EXT[ext] ?? null,
    fileSizeBytes: info.size,
    checksumSha256: createHash("sha256").update(bytes).digest("hex"),
    textLike: TEXT_EXTENSIONS.has(ext),
  };
}

export async function extractLearningAssetText(
  inspection: LearningAssetFileInspection | null,
  extractionRequired: boolean,
): Promise<ExtractedAssetText> {
  if (!inspection) {
    return extractionRequired
      ? {
          status: "failed",
          text: null,
          extractedAt: null,
          error: "External URL extraction is not implemented",
          warning: null,
        }
      : {
          status: "not_required",
          text: null,
          extractedAt: null,
          error: null,
          warning: null,
        };
  }

  if (!inspection.textLike) {
    const message = `Text extraction is not implemented for ${inspection.filename}`;
    return extractionRequired
      ? {
          status: "failed",
          text: null,
          extractedAt: null,
          error: message,
          warning: null,
        }
      : {
          status: "not_required",
          text: null,
          extractedAt: null,
          error: null,
          warning: message,
        };
  }

  try {
    const text = await readFile(inspection.absPath, "utf8");
    return {
      status: "succeeded",
      text,
      extractedAt: new Date().toISOString(),
      error: null,
      warning: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      status: "failed",
      text: null,
      extractedAt: null,
      error: message,
      warning: extractionRequired ? null : message,
    };
  }
}

function readProvider(
  raw: unknown,
  path: string | null,
  externalUrl: string | null,
): LearningAssetProvider {
  const value = optionalString(raw);
  if (!value) return externalUrl && !path ? "external-url" : "supabase-storage";
  if (value === "s3") {
    throw new Error("S3 learning assets are supported by schema but not by this vault pipeline yet");
  }
  if (value === "supabase-storage" || value === "external-url") return value;
  throw new Error(`Unsupported learning asset provider: ${value}`);
}

function readKind(
  raw: unknown,
  path: string | null,
  externalUrl: string | null,
): LearningAssetKind {
  const value = optionalString(raw);
  if (value) {
    if (KIND_SET.has(value)) return value as LearningAssetKind;
    throw new Error(`Unsupported learning asset kind: ${value}`);
  }
  if (externalUrl && !path) return "web";
  const ext = path ? extname(path).toLowerCase() : "";
  if (ext === ".pdf") return "pdf";
  if (ext === ".docx") return "docx";
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"].includes(ext)) {
    return "image";
  }
  if ([".md", ".markdown"].includes(ext)) return "markdown";
  if ([".txt"].includes(ext)) return "text";
  if ([".json", ".jsonl", ".csv"].includes(ext)) return "data";
  if ([".zip", ".tar", ".gz"].includes(ext)) return "archive";
  return "source-file";
}

function readRole(raw: unknown): LearningAssetRole {
  const value = optionalString(raw) ?? "supporting";
  if (ROLE_SET.has(value)) return value as LearningAssetRole;
  throw new Error(`Unsupported learning asset role: ${value}`);
}

function readMetadata(raw: unknown): Record<string, unknown> {
  if (raw === null || raw === undefined) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("asset metadata must be a mapping");
  }
  return raw as Record<string, unknown>;
}

function optionalString(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const value = String(raw).trim();
  return value.length ? value : null;
}

function requiredString(raw: unknown, field: string): string {
  const value = optionalString(raw);
  if (!value) throw new Error(`${field} is required`);
  return value;
}

function humanizeId(id: string): string {
  return id
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function assertSafeSlugSegment(value: string, label: string): void {
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(value)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
}
