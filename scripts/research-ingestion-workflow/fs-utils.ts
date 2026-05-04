/// <reference types="node" />

import { createHash } from "node:crypto";
import { constants } from "node:fs";
import {
  access,
  mkdir,
  readFile,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

export async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function sha256Text(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function sha256File(path: string): Promise<string> {
  return sha256Text(await readFile(path, "utf8"));
}

export async function fileHashOrMissing(path: string): Promise<string> {
  if (!(await exists(path))) return "missing";
  return sha256File(path);
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function writeAtomic(path: string, content: string): Promise<void> {
  await ensureDir(dirname(path));
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, content, "utf8");
  await rename(tmp, path);
}

export async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

export async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  await writeAtomic(path, `${JSON.stringify(value, null, 2)}\n`);
}

export async function readTextIfExists(path: string): Promise<string> {
  if (!(await exists(path))) return "";
  return readFile(path, "utf8");
}

export async function snippet(path: string, maxChars = 20000): Promise<string> {
  const text = await readTextIfExists(path);
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[truncated ${text.length - maxChars} chars]`;
}

export async function outputHashes(paths: string[]): Promise<Record<string, string>> {
  const entries = await Promise.all(
    paths.map(async (path) => [path, await fileHashOrMissing(path)] as const),
  );
  return Object.fromEntries(entries);
}

export async function pathSummary(path: string): Promise<string> {
  if (!(await exists(path))) return `${path} missing`;
  const s = await stat(path);
  return `${path} ${s.isDirectory() ? "dir" : `${s.size} bytes`}`;
}

export function rel(from: string, to: string): string {
  return relative(from, resolve(from, to)).replace(/\\/g, "/");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
