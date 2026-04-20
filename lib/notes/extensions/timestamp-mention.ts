import { Node, mergeAttributes } from "@tiptap/core";

import { formatTimestamp } from "@/lib/notes/derive-text";
import { TIMESTAMP_MENTION_NODE } from "@/lib/notes/types";

export type InsertTimestampArgs = {
  videoId: string;
  seconds: number;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    timestampMention: {
      /**
       * Insert a `⏱ MM:SS` chip at the current selection that, when
       * clicked, seeks the host video player. The N3 Watch+Notes
       * shell intercepts the click and calls `seekTo(seconds)`.
       */
      insertTimestamp: (args: InsertTimestampArgs) => ReturnType;
    };
  }
}

export const TimestampMention = Node.create({
  name: TIMESTAMP_MENTION_NODE,
  inline: true,
  group: "inline",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      videoId: { default: null },
      seconds: {
        default: 0,
        parseHTML: (el) => Number(el.getAttribute("data-seconds") ?? "0"),
        renderHTML: (attrs) => ({
          "data-seconds": String(attrs.seconds ?? 0),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-mention-type="timestamp"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const seconds =
      typeof node.attrs.seconds === "number" ? node.attrs.seconds : 0;
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-mention-type": "timestamp",
        "data-video-id": node.attrs.videoId ?? "",
        class: "timestamp-mention",
        contenteditable: "false",
      }),
      `⏱ ${formatTimestamp(seconds)}`,
    ];
  },

  renderText({ node }) {
    const seconds =
      typeof node.attrs.seconds === "number" ? node.attrs.seconds : 0;
    return formatTimestamp(seconds);
  },

  addCommands() {
    return {
      insertTimestamp:
        ({ videoId, seconds }) =>
        ({ chain }) =>
          chain()
            .focus()
            .insertContent([
              {
                type: TIMESTAMP_MENTION_NODE,
                attrs: { videoId, seconds: Math.max(0, Math.floor(seconds)) },
              },
              { type: "text", text: " " },
            ])
            .run(),
    };
  },

  addKeyboardShortcuts() {
    return {
      // ⌘⇧K (or Ctrl-Shift-K) inserts the timestamp at the current player
      // position. Editors mounted outside a video context get a no-op
      // fallback because `videoId` is null and we skip insertion.
      "Mod-Shift-k": () => {
        const win = typeof window !== "undefined" ? window : null;
        // The video shell sets these globals when mounted; we rely on
        // them so the editor doesn't need a React context wiring just
        // for the keyboard path.
        const ctx = win
          ? (win as unknown as { __videoNotesCtx__?: { videoId: string; getCurrentTime: () => number } }).__videoNotesCtx__
          : undefined;
        if (!ctx?.videoId) return false;
        return this.editor.commands.insertTimestamp({
          videoId: ctx.videoId,
          seconds: ctx.getCurrentTime(),
        });
      },
    };
  },
});
