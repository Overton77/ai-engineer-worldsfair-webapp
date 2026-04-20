import { describe, expect, it } from "vitest";

import { toEntitySummary } from "./entity-summary";

describe("toEntitySummary", () => {
  it("maps a person row to the normalized card shape", () => {
    const summary = toEntitySummary("person", {
      person_id: "p_123",
      slug: "shreya-shankar",
      full_name: "Shreya Shankar",
      role_title: "PhD candidate",
      sessionize_profile_picture_url: "https://cdn.example/avatar.png",
      expertise_tags: ["evals", "rag"],
      domain_layer: "governance",
    });

    expect(summary).toEqual({
      kind: "person",
      id: "p_123",
      slug: "shreya-shankar",
      title: "Shreya Shankar",
      subtitle: "PhD candidate",
      description: null,
      imageUrl: "https://cdn.example/avatar.png",
      href: "/p/shreya-shankar",
      tags: ["evals", "rag"],
      layer: "governance",
      category: null,
    });
  });

  it("falls back to id when slug is missing", () => {
    const summary = toEntitySummary("youtube_video", {
      video_id: "Xz5oP",
      title: "GEPA basics",
      thumbnail_url: "https://i.ytimg.com/vi/Xz5oP/hq.jpg",
      category: "evaluations",
    });

    expect(summary.href).toBe("/video/Xz5oP");
    expect(summary.imageUrl).toBe("https://i.ytimg.com/vi/Xz5oP/hq.jpg");
    expect(summary.category).toBe("evaluations");
  });

  it("ignores invalid layer values", () => {
    const summary = toEntitySummary("library", {
      slug: "agenta",
      title: "Agenta",
      domain_layer: "not-a-layer",
    });

    expect(summary.layer).toBeNull();
  });

  it("derives a sensible title fallback chain", () => {
    expect(
      toEntitySummary("course", {
        course_id: "c_1",
        slug: "evals-101",
        name: "Evaluations 101",
      }).title,
    ).toBe("Evaluations 101");

    expect(
      toEntitySummary("organization", {
        organization_id: "o_1",
        slug: "openai",
        display_name: "OpenAI",
      }).title,
    ).toBe("OpenAI");

    expect(
      toEntitySummary("paper", { paper_id: "pp_1", slug: "abc" }).title,
    ).toBe("Untitled");
  });

  it("routes every entity kind to its dossier path", () => {
    const cases: Array<[Parameters<typeof toEntitySummary>[0], string]> = [
      ["person", "/p/x"],
      ["organization", "/o/x"],
      ["library", "/lib/x"],
      ["paper", "/paper/x"],
      ["session", "/talk/x"],
      ["youtube_video", "/video/x"],
      ["event", "/event/x"],
      ["news_item", "/news/x"],
      ["repo", "/repo/x"],
      ["report", "/report/x"],
      ["product", "/product/x"],
      ["course", "/courses/x"],
      ["course_module", "/modules/x"],
      ["challenge", "/challenges/x"],
      ["attempt", "/attempts/x"],
      ["image", "/image/x"],
      ["notes", "/notes/x"],
    ];
    for (const [kind, expected] of cases) {
      expect(toEntitySummary(kind, { slug: "x" }).href).toBe(expected);
    }
  });
});
