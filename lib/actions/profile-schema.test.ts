import { describe, expect, it } from "vitest";

import { ProfileUpdateSchema } from "./profile-schema";

describe("ProfileUpdateSchema", () => {
  it("accepts a minimal valid patch", () => {
    const out = ProfileUpdateSchema.safeParse({
      display_name: "Shreya",
      headline: "Eval engineer",
      is_public: true,
      home_layer: "governance",
      interest_tags: ["evaluations", "agent_orchestration"],
      goals: ["ship_at_work"],
    });
    expect(out.success).toBe(true);
  });

  it("rejects free-text interest tags", () => {
    const out = ProfileUpdateSchema.safeParse({
      interest_tags: ["agentic", "rag"],
    });
    expect(out.success).toBe(false);
  });

  it("rejects an invalid username format", () => {
    const out = ProfileUpdateSchema.safeParse({ username: "no spaces" });
    expect(out.success).toBe(false);
  });

  it("rejects unknown fields (strict)", () => {
    const out = ProfileUpdateSchema.safeParse({
      display_name: "X",
      is_admin: true,
    } as Record<string, unknown>);
    expect(out.success).toBe(false);
  });

  it("rejects an unknown experience_level", () => {
    const out = ProfileUpdateSchema.safeParse({
      experience_level: "wizard" as never,
    });
    expect(out.success).toBe(false);
  });

  it("normalises empty strings to null", () => {
    const out = ProfileUpdateSchema.parse({
      display_name: "  ",
      headline: "",
      bio: "",
    });
    expect(out.display_name).toBeNull();
    expect(out.headline).toBeNull();
  });

  it("caps tag arrays at 20", () => {
    const tags = Array.from({ length: 21 }).fill("evaluations") as string[];
    const out = ProfileUpdateSchema.safeParse({ interest_tags: tags });
    expect(out.success).toBe(false);
  });
});
