import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

import { TimestampMention } from "./timestamp-mention";

function makeEditor() {
  return new Editor({
    extensions: [StarterKit, TimestampMention],
    content: { type: "doc", content: [{ type: "paragraph" }] },
  });
}

describe("TimestampMention", () => {
  it("inserts a timestampMention node with floored seconds", () => {
    const editor = makeEditor();
    editor.commands.insertTimestamp({ videoId: "abc", seconds: 842.7 });
    const json = editor.getJSON();
    const para = (json.content?.[0]?.content ?? []) as Array<{
      type: string;
      attrs?: Record<string, unknown>;
    }>;
    const tm = para.find((n) => n.type === "timestampMention");
    expect(tm).toBeDefined();
    expect(tm?.attrs).toMatchObject({ videoId: "abc", seconds: 842 });
    editor.destroy();
  });

  it("renders to text as MM:SS via renderText", () => {
    const editor = makeEditor();
    editor.commands.insertTimestamp({ videoId: "abc", seconds: 75 });
    const text = editor.getText();
    // includes "1:15" somewhere in the inline text serialization
    expect(text).toContain("1:15");
    editor.destroy();
  });
});
