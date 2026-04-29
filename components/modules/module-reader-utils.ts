import type { Json } from "@/types/database.types";

export type ModuleHeading = {
  id: string;
  title: string;
  depth: number;
};

const DEFAULT_MODULE_XP = 25;

export function extractMarkdownHeadings(markdown: string): ModuleHeading[] {
  const usedIds = new Map<string, number>();
  return markdown
    .split(/\r?\n/)
    .map((line) => {
      const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
      if (!match) return null;
      const title = match[2].replace(/[#*_`[\]]/g, "").trim();
      if (!title) return null;
      const baseId = slugify(title);
      const count = usedIds.get(baseId) ?? 0;
      usedIds.set(baseId, count + 1);
      return {
        id: count === 0 ? baseId : `${baseId}-${count + 1}`,
        title,
        depth: match[1].length,
      };
    })
    .filter((heading): heading is ModuleHeading => heading !== null);
}

export function headingId(children: unknown): string {
  return slugify(extractText(children));
}

export function formatDomain(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatMinutes(minutes: number | null | undefined): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `~${hours}h` : `~${hours.toFixed(1)}h`;
}

export function moduleXp(metadata: Json): number {
  return numberMetadata(metadata, "xp") ?? DEFAULT_MODULE_XP;
}

export function hasQuiz(value: Json): boolean {
  return Array.isArray(value) && value.length > 0;
}

export function jsonStrings(value: Json): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
}

export function compactLabel(parts: Array<string | undefined>): string | undefined {
  const label = parts.filter(Boolean).join(" · ");
  return label.length > 0 ? label : undefined;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

function extractText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(extractText).join("");
  if (value && typeof value === "object" && "props" in value) {
    const props = (value as { props?: { children?: unknown } }).props;
    return extractText(props?.children);
  }
  return "";
}

function numberMetadata(value: Json, key: string): number | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const metadata = value as Record<string, Json | undefined>;
  const rawValue = metadata[key];
  return typeof rawValue === "number" && Number.isFinite(rawValue) ? rawValue : null;
}
