import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AssetCard } from "@/components/assets/asset-card";
import { ChallengePreviewCard } from "@/components/challenges/challenge-preview-card";
import { CourseCard } from "@/components/courses/course-card";
import { ModuleCard } from "@/components/modules/module-card";
import { ModuleContent } from "@/components/modules/module-content";
import { ModuleProse } from "@/components/modules/module-prose";
import type { CourseModuleRow } from "@/lib/db/learn";

import { ProgressCard } from "./progress-card";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe("learner component foundation", () => {
  it("renders shared learner cards from static view models", () => {
    render(
      <div>
        <CourseCard
          course={{
            eyebrow: "L5 · Agent orchestration",
            title: "Agent Orchestration Skills Mini",
            summary: "Learn reusable agent skill workflows.",
            moduleCount: 3,
            durationLabel: "~90 min",
            xpLabel: "+100 XP",
            capstoneLabel: "Capstone preview",
            action: { label: "View course", href: "/courses/agent-skills" },
          }}
        />
        <ModuleCard
          module={{
            eyebrow: "Agent orchestration · Beginner",
            title: "Agent Skills 101",
            summary: "Understand skill file structure.",
            durationLabel: "20 min",
            sourceCount: 3,
            quizLabel: "Quiz",
            xpLabel: "+25 XP",
            action: { label: "Start module", href: "/modules/agent-skills-101" },
          }}
        />
        <ChallengePreviewCard
          challenge={{
            eyebrow: "Preview only",
            title: "Build and review a reusable skill",
            summary: "Runtime and sandbox arrive later.",
            estimatedTimeLabel: "45 min",
            runtimeLabel: "Python",
            statusLabel: "Draft",
            action: { label: "Preview challenge", href: "/challenges/reusable-skill" },
          }}
        />
        <AssetCard
          asset={{
            eyebrow: "PDF · Extracted",
            title: "Skill Review Checklist",
            summary: "Checklist used by this lesson.",
            kindLabel: "PDF",
            fileMetaLabel: "8 pages",
            extractionLabel: "Extracted",
            action: { label: "Preview", href: "/assets/skill-review-checklist" },
          }}
        />
      </div>,
    );

    expect(screen.getByText("Agent Orchestration Skills Mini")).toBeInTheDocument();
    expect(screen.getByText("3 modules")).toBeInTheDocument();
    expect(screen.getByText("Agent Skills 101")).toBeInTheDocument();
    expect(screen.getByText("Sources")).toBeInTheDocument();
    expect(screen.getByText("Build and review a reusable skill")).toBeInTheDocument();
    expect(screen.getByText("Skill Review Checklist")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View course" })).toHaveAttribute(
      "href",
      "/courses/agent-skills",
    );
  });

  it("renders progress with an accessible progressbar", () => {
    render(
      <ProgressCard
        progress={{
          eyebrow: "Continue learning",
          title: "Skill Composition Patterns",
          summary: "Next module in your current course.",
          percent: 60,
          progressLabel: "60% complete",
          stats: [{ label: "Modules", value: "2 of 3" }],
          action: { label: "Resume", href: "/courses/agent-skills/m/composition" },
        }}
      />,
    );

    const progressbar = screen.getByRole("progressbar", {
      name: "60% complete",
    });

    expect(screen.getByText("Skill Composition Patterns")).toBeInTheDocument();
    expect(progressbar).toHaveAttribute("aria-valuenow", "60");
    expect(screen.getByRole("button", { name: "Resume" })).toHaveAttribute(
      "href",
      "/courses/agent-skills/m/composition",
    );
  });

  it("provides module prose scaffolding for static lesson content", () => {
    render(
      <ModuleProse data-testid="module-prose">
        <h2>Why this matters</h2>
        <p>Reusable skills need clear context boundaries.</p>
      </ModuleProse>,
    );

    expect(screen.getByTestId("module-prose")).toHaveClass("max-w-3xl");
    expect(screen.getByText("Why this matters")).toBeInTheDocument();
  });

  it("renders module markdown content with a quiz island", () => {
    render(
      <ModuleContent
        contextLabel="Standalone module"
        module={moduleRow({
          body_md:
            "## Why this matters\n\nReusable skills need [clear boundaries](/courses).",
          learning_objectives: ["Write durable prompts"],
          mini_quiz: [
            {
              q: "Question?",
              options: ["A", "B"],
              answer: 0,
            },
          ],
        })}
        actionInput={{ moduleSlug: "agent-skills-101" }}
        quizAction={noopCompletionAction}
        markCompleteAction={noopCompletionAction}
      />,
    );

    expect(
      screen
        .getAllByRole("heading", { name: "Why this matters" })
        .find((heading) => heading.id === "why-this-matters"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "clear boundaries" })).toHaveAttribute(
      "href",
      "/courses",
    );
    expect(screen.getByText("Write durable prompts")).toBeInTheDocument();
    expect(screen.getByText("Mini-quiz")).toBeInTheDocument();
    expect(screen.getByText("Passing score: 70%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit quiz" })).toBeDisabled();
  });
});

const noopCompletionAction = vi.fn(async () => ({
  ok: false as const,
  completed: false as const,
  error: "Not implemented in test.",
}));

function moduleRow(overrides: Partial<CourseModuleRow> = {}): CourseModuleRow {
  return {
    authors: [],
    body_kind: "concept",
    body_md: "Body",
    content_hash: null,
    created_at: "2026-04-27T00:00:00.000Z",
    difficulty: "beginner",
    domain_buckets: ["agent_orchestration"],
    duration_min: 15,
    embedding: null,
    fts: null,
    is_latest_published: true,
    learning_objectives: [],
    metadata: {},
    mini_quiz: [],
    module_id: "module-1",
    search_text: null,
    slug: "module-1",
    source_path: null,
    status: "published",
    title: "Agent Skills 101",
    updated_at: "2026-04-27T00:00:00.000Z",
    version: "1.0.0",
    ...overrides,
  };
}
