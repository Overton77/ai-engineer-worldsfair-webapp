import { describe, expect, it } from "vitest";

import {
  deriveContentText,
  deriveDefaultTitle,
  formatTimestamp,
} from "./derive-text";
import type { NoteDoc } from "./types";

describe("deriveContentText", () => {
  it("returns empty string for null / non-doc input", () => {
    expect(deriveContentText(null)).toBe("");
    expect(deriveContentText(undefined)).toBe("");
    expect(
      deriveContentText({ type: "doc" } as NoteDoc),
    ).toBe("");
  });

  it("flattens paragraphs and headings line-by-line", () => {
    const doc: NoteDoc = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Why GEPA matters" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Pairwise judges only beat scalar." }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "When the rubric is underspecified." }],
        },
      ],
    };
    expect(deriveContentText(doc)).toBe(
      "Why GEPA matters\nPairwise judges only beat scalar.\nWhen the rubric is underspecified.",
    );
  });

  it("renders entityMention as its title", () => {
    const doc: NoteDoc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "See " },
            {
              type: "entityMention",
              attrs: {
                kind: "library",
                id: "agenta",
                title: "Agenta",
              },
            },
            { type: "text", text: " for details." },
          ],
        },
      ],
    };
    expect(deriveContentText(doc)).toBe("See Agenta for details.");
  });

  it("renders timestampMention as MM:SS so search '14:02' hits", () => {
    const doc: NoteDoc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Re-watch " },
            {
              type: "timestampMention",
              attrs: { videoId: "abc", seconds: 842 },
            },
            { type: "text", text: " for the calibration argument." },
          ],
        },
      ],
    };
    const out = deriveContentText(doc);
    expect(out).toContain("14:02");
    expect(out).toBe("Re-watch 14:02 for the calibration argument.");
  });

  it("includes blockquote and codeBlock text", () => {
    const doc: NoteDoc = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "GEPA optimizes the judge." }],
            },
          ],
        },
        {
          type: "codeBlock",
          attrs: { language: "python" },
          content: [{ type: "text", text: "judge.run(samples)" }],
        },
      ],
    };
    expect(deriveContentText(doc)).toBe(
      "GEPA optimizes the judge.\njudge.run(samples)",
    );
  });

  it("includes taskItem text regardless of check state", () => {
    const doc: NoteDoc = {
      type: "doc",
      content: [
        {
          type: "taskList",
          content: [
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Calibrate vs ground truth" }],
                },
              ],
            },
            {
              type: "taskItem",
              attrs: { checked: true },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Read Agenta dossier" }],
                },
              ],
            },
          ],
        },
      ],
    };
    const out = deriveContentText(doc);
    expect(out).toContain("Calibrate vs ground truth");
    expect(out).toContain("Read Agenta dossier");
  });
});

describe("formatTimestamp", () => {
  it("emits MM:SS under an hour", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(842)).toBe("14:02");
    expect(formatTimestamp(2999)).toBe("49:59");
  });
  it("emits H:MM:SS at and above an hour", () => {
    expect(formatTimestamp(3600)).toBe("1:00:00");
    expect(formatTimestamp(3661)).toBe("1:01:01");
    expect(formatTimestamp(7325)).toBe("2:02:05");
  });
});

describe("deriveDefaultTitle", () => {
  it("uses the first heading when present", () => {
    const doc: NoteDoc = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Why GEPA matters" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "context…" }],
        },
      ],
    };
    expect(deriveDefaultTitle(doc)).toBe("Why GEPA matters");
  });

  it("falls back to the first paragraph snippet", () => {
    const doc: NoteDoc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Notes about the GEPA workshop today." },
          ],
        },
      ],
    };
    expect(deriveDefaultTitle(doc)).toBe(
      "Notes about the GEPA workshop today.",
    );
  });

  it("returns 'Untitled' for an empty doc", () => {
    expect(deriveDefaultTitle({ type: "doc", content: [] })).toBe(
      "Untitled",
    );
  });
});
