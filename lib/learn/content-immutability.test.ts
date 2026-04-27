import { describe, expect, it } from "vitest";

import {
  buildPublishedDriftError,
  diffCourseSemanticContent,
  diffModuleSemanticContent,
  type CourseSemanticContent,
  type ModuleSemanticContent,
} from "./content-immutability";

function moduleContent(
  overrides: Partial<ModuleSemanticContent> = {},
): ModuleSemanticContent {
  return {
    title: "Agent Skills 101",
    body_md: "# Lesson\n\nLearn skills.",
    body_kind: "walkthrough",
    duration_min: 20,
    difficulty: "beginner",
    status: "published",
    domain_buckets: ["agent_orchestration"],
    learning_objectives: ["Explain skills"],
    mini_quiz: [{ id: "q1", answer: "A" }],
    prerequisites: ["intro"],
    artifact_refs: [
      { artifact_kind: "video", artifact_id: "vid-1", ord: 0, role: "primary" },
    ],
    ...overrides,
  };
}

function courseContent(
  overrides: Partial<CourseSemanticContent> = {},
): CourseSemanticContent {
  return {
    title: "Agent Orchestration",
    summary: "A mini course.",
    narrative_md: "# Course\n\nLearn orchestration.",
    est_hours: 1,
    domain_bucket: "agent_orchestration",
    domain_layer: "agents",
    capstone_challenge_id: "challenge-1",
    status: "published",
    modules: [
      { module_id: "module-1", ord: 0, pinned_version: "0.1.0", role: "intro" },
      { module_id: "module-2", ord: 1, pinned_version: "0.1.0", role: "core" },
    ],
    ...overrides,
  };
}

describe("content immutability semantic diffing", () => {
  it("detects published module semantic drift", () => {
    expect(
      diffModuleSemanticContent(moduleContent(), moduleContent({ body_md: "Changed" })),
    ).toEqual(["body_md"]);
  });

  it("ignores ordering noise for module set-like fields", () => {
    expect(
      diffModuleSemanticContent(
        moduleContent({
          domain_buckets: ["agent_orchestration", "coding_agents"],
          prerequisites: ["intro", "setup"],
        }),
        moduleContent({
          domain_buckets: ["coding_agents", "agent_orchestration"],
          prerequisites: ["setup", "intro"],
        }),
      ),
    ).toEqual([]);
  });

  it("detects module prerequisite and artifact changes", () => {
    const changed = diffModuleSemanticContent(
      moduleContent(),
      moduleContent({
        prerequisites: ["intro", "setup"],
        artifact_refs: [
          { artifact_kind: "paper", artifact_id: "paper-1", ord: 0, role: "reference" },
        ],
      }),
    );

    expect(changed).toEqual(["artifact_refs", "prerequisites"]);
  });

  it("detects published course semantic drift", () => {
    expect(
      diffCourseSemanticContent(courseContent(), courseContent({ narrative_md: "Changed" })),
    ).toEqual(["narrative_md"]);
  });

  it("detects course composition, order, role, and pinned-version drift", () => {
    const changed = diffCourseSemanticContent(
      courseContent(),
      courseContent({
        modules: [
          { module_id: "module-2", ord: 0, pinned_version: "0.2.0", role: "intro" },
          { module_id: "module-1", ord: 1, pinned_version: "0.1.0", role: "optional" },
        ],
      }),
    );

    expect(changed).toEqual(["modules"]);
  });

  it("formats bump-version guidance for script failures", () => {
    expect(buildPublishedDriftError("module", "agent-skills-101", "0.1.0", ["body_md"]).message)
      .toContain("Bump `version`");
  });
});
