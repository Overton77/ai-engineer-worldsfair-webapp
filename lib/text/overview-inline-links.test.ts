import { describe, expect, it } from "vitest";

import { overviewTextToLinkParts } from "./overview-inline-links";

describe("overviewTextToLinkParts", () => {
  it("parses parenthesized markdown link (LLM citation shape)", () => {
    const text =
      "See ([11x.ai](https://www.11x.ai/blog/meet-alice-the-first-true-digital-worker-in-sales)) for details.";
    const parts = overviewTextToLinkParts(text);
    expect(parts).toEqual([
      { type: "text", value: "See " },
      {
        type: "link",
        label: "11x.ai",
        href: "https://www.11x.ai/blog/meet-alice-the-first-true-digital-worker-in-sales",
      },
      { type: "text", value: " for details." },
    ]);
  });

  it("parses bare https URLs", () => {
    const text = "Newsletter at https://www.ai.engineer/newsletter today.";
    const parts = overviewTextToLinkParts(text);
    expect(parts).toEqual([
      { type: "text", value: "Newsletter at " },
      {
        type: "link",
        label: "https://www.ai.engineer/newsletter",
        href: "https://www.ai.engineer/newsletter",
      },
      { type: "text", value: " today." },
    ]);
  });

  it("parses standard markdown links", () => {
    const text = "Read [AI Engineer](https://www.ai.engineer/) here.";
    expect(overviewTextToLinkParts(text)).toEqual([
      { type: "text", value: "Read " },
      {
        type: "link",
        label: "AI Engineer",
        href: "https://www.ai.engineer/",
      },
      { type: "text", value: " here." },
    ]);
  });

  it("does not double-parse URL inside markdown", () => {
    const text = "[x](https://example.com/path)";
    const parts = overviewTextToLinkParts(text);
    expect(parts.filter((p) => p.type === "link")).toHaveLength(1);
  });

  it("parses citation with fullwidth parentheses (NFKC-normalized)", () => {
    const text =
      "More info （[11x.ai](https://www.11x.ai/blog/meet-alice-the-first-true-digital-worker-in-sales)）.";
    const parts = overviewTextToLinkParts(text);
    expect(parts.some((p) => p.type === "link" && p.label === "11x.ai")).toBe(
      true,
    );
  });

  it("parses citation with zero-width chars inside URL capture", () => {
    const url = "https://www.11x.ai/blog/meet-alice-the-first-true-digital-worker-in-sales";
    const text = `See ([11x.ai](${url}\u200b)).`;
    const parts = overviewTextToLinkParts(text);
    const link = parts.find((p) => p.type === "link");
    expect(link?.href).toBe(url);
  });
});
