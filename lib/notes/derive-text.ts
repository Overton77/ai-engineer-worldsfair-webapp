/**
 * Derive `notes.content_text` from a TipTap doc. This is the ONLY
 * thing `notes.fts` indexes, so the rules here directly affect what
 * "search notes" finds:
 *
 *   - paragraph/heading/list-item text → joined with spaces
 *   - blockquote / codeBlock text     → included as-is
 *   - taskItem (checked or unchecked) → text included; check state ignored
 *   - entityMention                   → its `attrs.title`
 *     (so searching "Shreya" finds notes that @-mention Shreya even
 *     if her name doesn't appear in the surrounding prose)
 *   - timestampMention                → "MM:SS"
 *     (so searching "14:02" finds notes citing that timestamp)
 *   - everything else                 → recurse into `content`
 *
 * If you add a new node type to the editor (U4.4+), extend the switch
 * here. The TS exhaustive check on `node.type` is intentional.
 */

import {
  ENTITY_MENTION_NODE,
  TIMESTAMP_MENTION_NODE,
  type NoteDoc,
  type NoteDocNode,
} from "./types";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(sec)}` : `${m}:${pad2(sec)}`;
}

function visit(node: NoteDocNode, out: string[]): void {
  if (!node || typeof node !== "object") return;

  if (node.type === ENTITY_MENTION_NODE) {
    const title = node.attrs?.title;
    if (typeof title === "string" && title.length > 0) out.push(title);
    return;
  }

  if (node.type === TIMESTAMP_MENTION_NODE) {
    const seconds = node.attrs?.seconds;
    if (typeof seconds === "number") out.push(formatTimestamp(seconds));
    return;
  }

  if (typeof node.text === "string" && node.text.length > 0) {
    out.push(node.text);
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) visit(child, out);
  }
}

/**
 * Walk the doc top-down, joining text with spaces. Block boundaries
 * (paragraph, heading, listItem, blockquote, codeBlock, taskItem)
 * insert a newline so FTS doesn't merge unrelated phrases.
 */
const BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
  "listItem",
  "taskItem",
  "bulletList",
  "orderedList",
  "taskList",
  "horizontalRule",
]);

export function deriveContentText(doc: NoteDoc | null | undefined): string {
  if (!doc || doc.type !== "doc" || !Array.isArray(doc.content)) return "";
  const lines: string[] = [];

  function visitTop(node: NoteDocNode) {
    if (!node) return;
    if (BLOCK_TYPES.has(node.type)) {
      const out: string[] = [];
      visit(node, out);
      const line = out.join(" ").replace(/\s+/g, " ").trim();
      if (line.length > 0) lines.push(line);
      return;
    }
    // Inline node at the top level — collect
    const out: string[] = [];
    visit(node, out);
    const line = out.join(" ").replace(/\s+/g, " ").trim();
    if (line.length > 0) lines.push(line);
  }

  for (const child of doc.content) visitTop(child);
  return lines.join("\n").trim();
}

/**
 * Produce a sensible default title from the first heading (if any) or
 * the first 60 chars of derived text. The autosave action falls back
 * to this when the user hasn't typed a title.
 */
export function deriveDefaultTitle(doc: NoteDoc | null | undefined): string {
  if (!doc || doc.type !== "doc" || !Array.isArray(doc.content)) {
    return "Untitled";
  }
  for (const child of doc.content) {
    if (child.type === "heading") {
      const out: string[] = [];
      visit(child, out);
      const t = out.join(" ").replace(/\s+/g, " ").trim();
      if (t.length > 0) return t.length > 80 ? `${t.slice(0, 80)}…` : t;
    }
  }
  const text = deriveContentText(doc).split("\n")[0] ?? "";
  if (!text) return "Untitled";
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}
