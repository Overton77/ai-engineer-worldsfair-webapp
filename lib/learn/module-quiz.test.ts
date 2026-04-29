import { describe, expect, it } from "vitest";

import {
  DEFAULT_PASS_THRESHOLD,
  getPassThreshold,
  miniQuizViewModel,
  parseMiniQuiz,
  scoreMiniQuiz,
} from "./module-quiz";

const quiz = [
  {
    q: "What does MCP provide?",
    options: ["Recipes", "Connections", "Models"],
    answer: 1,
    explain: "MCP connects agents to external systems.",
  },
  {
    q: "What do Skills provide?",
    options: ["Expertise", "Storage", "Billing"],
    answer: 0,
  },
];

describe("module quiz helpers", () => {
  it("parses the authored mini-quiz shape and hides answer keys in the view model", () => {
    expect(parseMiniQuiz(quiz).questions).toMatchObject([
      {
        id: "q1",
        prompt: "What does MCP provide?",
        options: ["Recipes", "Connections", "Models"],
        answer: 1,
      },
      {
        id: "q2",
        prompt: "What do Skills provide?",
        options: ["Expertise", "Storage", "Billing"],
        answer: 0,
      },
    ]);

    expect(miniQuizViewModel(quiz)).toEqual([
      {
        id: "q1",
        prompt: "What does MCP provide?",
        options: ["Recipes", "Connections", "Models"],
        explain: "MCP connects agents to external systems.",
      },
      {
        id: "q2",
        prompt: "What do Skills provide?",
        options: ["Expertise", "Storage", "Billing"],
      },
    ]);
  });

  it("uses a 70 percent pass threshold by default with metadata override support", () => {
    expect(getPassThreshold({ miniQuiz: quiz, metadata: {} })).toBe(
      DEFAULT_PASS_THRESHOLD,
    );
    expect(
      getPassThreshold({ miniQuiz: quiz, metadata: { pass_threshold: 0.8 } }),
    ).toBe(0.8);
    expect(
      getPassThreshold({
        miniQuiz: { pass_threshold: 0.9, questions: quiz },
        metadata: { pass_threshold: 0.8 },
      }),
    ).toBe(0.9);
  });

  it("scores responses and returns persisted item-level responses", () => {
    const result = scoreMiniQuiz({
      miniQuiz: quiz,
      metadata: {},
      selections: { q1: 1, q2: 2 },
    });

    expect(result).toMatchObject({
      score: 0.5,
      passed: false,
      correctCount: 1,
      totalCount: 2,
      threshold: 0.7,
      responses: [
        { q_id: "q1", chosen: 1, correct: true },
        { q_id: "q2", chosen: 2, correct: false },
      ],
    });
  });

  it("rejects missing responses and malformed questions", () => {
    expect(() =>
      scoreMiniQuiz({
        miniQuiz: quiz,
        metadata: {},
        selections: { q1: 1 },
      }),
    ).toThrow("Answer every quiz question");

    expect(() =>
      parseMiniQuiz([{ q: "Broken", options: ["A", "B"], answer: 3 }]),
    ).toThrow("invalid answer key");
  });
});
