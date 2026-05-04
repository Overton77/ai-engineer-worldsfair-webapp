"use client";

import * as React from "react";

/**
 * Styles inline source links in explore card overviews (LLM-style markdown + bare URLs).
 */
export const overviewInlineLinkClassName =
  "!text-primary font-medium underline decoration-primary/45 underline-offset-[3px] transition-colors hover:!text-primary/90 hover:decoration-primary/80 break-words [overflow-wrap:anywhere]";

export type OverviewLinkPart =
  | { type: "text"; value: string }
  | { type: "link"; label: string; href: string };

type RawMatch = {
  start: number;
  end: number;
  label: string;
  href: string;
};

function rangesOverlap(a: RawMatch, b: RawMatch): boolean {
  return a.start < b.end && b.start < a.end;
}

function overlapsAny(m: RawMatch, ranges: readonly RawMatch[]): boolean {
  return ranges.some((r) => rangesOverlap(m, r));
}

/** Strip common sentence punctuation mistakenly glued to a bare URL. */
function trimBareUrlTail(raw: string): string {
  let u = raw;
  while (u.length > 0 && ".,;:!?*".includes(u[u.length - 1]!)) {
    u = u.slice(0, -1);
  }
  return u;
}

const INVISIBLE_CHARS = /[\u200B-\u200D\uFEFF\u2060]/g;

/** Normalize LLM/database text so markdown-link patterns match reliably. */
export function normalizeOverviewTextForLinks(input: string): string {
  return input
    .normalize("NFKC")
    .replace(INVISIBLE_CHARS, "")
    .replace(/\u00A0/g, " ")
    .replace(/\u202F/g, " ")
    .replace(/\uFF08/g, "(")
    .replace(/\uFF09/g, ")")
    .replace(/\uFF3B/g, "[")
    .replace(/\uFF3D/g, "]");
}

export function sanitizeOverviewHref(raw: string): string | null {
  const t = raw.trim().replace(INVISIBLE_CHARS, "");
  if (!t.startsWith("http://") && !t.startsWith("https://")) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

function findParenWrappedMarkdownLinks(text: string): RawMatch[] {
  const re =
    /\(\s*\[\s*([^\]]+?)\s*\]\s*\(\s*(https?:\/\/[^)\s]+)\s*\)\s*\)/g;
  const out: RawMatch[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const href = sanitizeOverviewHref(m[2] ?? "");
    if (!href) continue;
    out.push({
      start: m.index,
      end: m.index + m[0].length,
      label: (m[1] ?? "").trim() || href,
      href,
    });
  }
  return out;
}

function findMarkdownLinks(text: string, reserved: readonly RawMatch[]): RawMatch[] {
  const re = /\[\s*([^\]]+?)\s*\]\s*\(\s*(https?:\/\/[^)\s]+)\s*\)/g;
  const out: RawMatch[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const candidate: RawMatch = {
      start: m.index,
      end: m.index + m[0].length,
      label: (m[1] ?? "").trim(),
      href: m[2] ?? "",
    };
    if (overlapsAny(candidate, reserved)) continue;
    const href = sanitizeOverviewHref(candidate.href);
    if (!href) continue;
    out.push({ ...candidate, href, label: candidate.label || href });
  }
  return out;
}

function findBareUrls(text: string, reserved: readonly RawMatch[]): RawMatch[] {
  const re = /https?:\/\/[^\s<>"']+/g;
  const out: RawMatch[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const full = m[0];
    const trimmed = trimBareUrlTail(full);
    const candidate: RawMatch = {
      start: m.index,
      end: m.index + trimmed.length,
      label: trimmed,
      href: trimmed,
    };
    if (trimmed.length === 0) continue;
    if (overlapsAny(candidate, reserved)) continue;
    const href = sanitizeOverviewHref(trimmed);
    if (!href) continue;
    out.push({ ...candidate, href, label: href });
  }
  return out;
}

/**
 * Parses overview / description text for:
 * - `([label](https://...))` (common LLM citation shape)
 * - `[label](https://...)`
 * - bare `https://...` / `http://...`
 */
export function overviewTextToLinkParts(text: string): OverviewLinkPart[] {
  const normalized = normalizeOverviewTextForLinks(text);
  const parenMd = findParenWrappedMarkdownLinks(normalized);
  const md = findMarkdownLinks(normalized, parenMd);
  const reserved = [...parenMd, ...md];
  const bare = findBareUrls(normalized, reserved);
  const all = [...parenMd, ...md, ...bare].sort((a, b) => a.start - b.start || a.end - b.end);

  const parts: OverviewLinkPart[] = [];
  let cursor = 0;
  for (const match of all) {
    if (match.start < cursor) continue;
    if (match.start > cursor) {
      parts.push({ type: "text", value: normalized.slice(cursor, match.start) });
    }
    parts.push({ type: "link", label: match.label, href: match.href });
    cursor = match.end;
  }
  if (cursor < normalized.length) {
    parts.push({ type: "text", value: normalized.slice(cursor) });
  }
  return parts;
}

export function OverviewInlineLinks({ text }: { text: string }) {
  const parts = overviewTextToLinkParts(text);
  return (
    <>
      {parts.map((p, i) =>
        p.type === "text" ? (
          <React.Fragment key={i}>{p.value}</React.Fragment>
        ) : (
          <a
            key={i}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className={overviewInlineLinkClassName}
            onClick={(e) => e.stopPropagation()}
          >
            {p.label}
          </a>
        ),
      )}
    </>
  );
}
