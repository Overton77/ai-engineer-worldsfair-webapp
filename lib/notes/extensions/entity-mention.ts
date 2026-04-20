import Mention from "@tiptap/extension-mention";
import { mergeAttributes } from "@tiptap/core";
import type { SuggestionOptions } from "@tiptap/suggestion";

import { ENTITY_HREF } from "@/types/domain";
import type { EntityKind } from "@/lib/schema/entity-kind";
import { ENTITY_MENTION_NODE } from "@/lib/notes/types";

/**
 * EntityMention — typed `@`-mention node. Stored as
 *   { type: 'entityMention', attrs: { kind, id, slug?, title } }
 *
 * Renders as a clickable chip linking to the entity's dossier.
 *
 * Use:
 *   import { EntityMention, entityMentionSuggestion } from '...';
 *   const editor = useEditor({
 *     extensions: [
 *       ...,
 *       EntityMention.configure({ suggestion: entityMentionSuggestion(...) }),
 *     ],
 *   });
 */
export const EntityMention = Mention.extend({
  name: ENTITY_MENTION_NODE,

  addAttributes() {
    return {
      kind: { default: null },
      id: { default: null },
      slug: { default: null },
      title: { default: null },
    };
  },

  parseHTML() {
    return [
      { tag: 'a[data-mention-type="entity"]' },
      { tag: 'span[data-mention-type="entity"]' },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const kind = (node.attrs.kind ?? "person") as EntityKind;
    const slugOrId = (node.attrs.slug ?? node.attrs.id ?? "") as string;
    const title = (node.attrs.title ?? node.attrs.id ?? "Untitled") as string;
    const href = slugOrId ? ENTITY_HREF[kind](slugOrId) : "#";
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        href,
        "data-mention-type": "entity",
        "data-mention-kind": kind,
        "data-mention-id": node.attrs.id,
        class: "entity-mention",
        contenteditable: "false",
      }),
      `@${title}`,
    ];
  },

  renderText({ node }) {
    return `@${node.attrs.title ?? node.attrs.id}`;
  },
});

/**
 * Build a Suggestion config that resolves matches via the provided
 * `query` function. The actual popup-render is wired by the
 * NoteEditor (it knows about the React renderer).
 */
export function buildEntityMentionSuggestion(
  query: (q: string) => Promise<EntityMentionItem[]>,
  render: NonNullable<SuggestionOptions["render"]>,
): Partial<SuggestionOptions<EntityMentionItem>> {
  return {
    char: "@",
    allowedPrefixes: null,
    items: async ({ query: q }) => (q ? await query(q) : []),
    command: ({ editor, range, props }) => {
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          {
            type: ENTITY_MENTION_NODE,
            attrs: {
              kind: props.kind,
              id: props.id,
              slug: props.slug ?? null,
              title: props.title,
            },
          },
          { type: "text", text: " " },
        ])
        .run();
    },
    render,
  };
}

export type EntityMentionItem = {
  kind: EntityKind;
  id: string;
  slug?: string | null;
  title: string;
  imageUrl?: string | null;
};
