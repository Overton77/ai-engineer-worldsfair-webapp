export type DescriptionPart =
  | { type: "text"; value: string }
  | { type: "link"; href: string; label: string };

const URL_IN_TEXT =
  /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;

function normalizeHref(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (/^www\./i.test(t)) return `https://${t}`;
  return null;
}

/**
 * Splits plain text into alternating text and http(s) link segments for safe rendering.
 */
export function linkifyDescriptionToParts(text: string): DescriptionPart[] {
  if (!text) return [];
  const parts: DescriptionPart[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(URL_IN_TEXT.source, URL_IN_TEXT.flags);
  while ((m = re.exec(text)) !== null) {
    const start = m.index;
    const raw = m[0] ?? "";
    if (start > last) {
      parts.push({ type: "text", value: text.slice(last, start) });
    }
    const href = normalizeHref(raw);
    if (href) {
      parts.push({ type: "link", href, label: raw });
    } else {
      parts.push({ type: "text", value: raw });
    }
    last = start + raw.length;
  }
  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }
  return parts;
}
