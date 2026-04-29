import type { Json } from "@/types/database.types";

export const DEFAULT_PASS_THRESHOLD = 0.7;

export type MiniQuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explain?: string;
};

export type MiniQuizViewQuestion = Omit<MiniQuizQuestion, "answer">;

export type ParsedMiniQuiz = {
  questions: MiniQuizQuestion[];
  passThreshold: number | null;
};

export type QuizSelection = Record<string, number>;

export type StoredQuizResponse = {
  q_id: string;
  chosen: number;
  correct: boolean;
};

export type QuizScoreResult = {
  score: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
  threshold: number;
  responses: StoredQuizResponse[];
};

export class MiniQuizParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MiniQuizParseError";
  }
}

export function parseMiniQuiz(value: Json): ParsedMiniQuiz {
  if (value == null) return { questions: [], passThreshold: null };

  const rawQuestions = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.questions)
      ? value.questions
      : null;

  const passThreshold =
    !Array.isArray(value) && isRecord(value)
      ? validThreshold(value.pass_threshold)
      : null;

  if (!rawQuestions) {
    if (isRecord(value) && Object.keys(value).length === 0) {
      return { questions: [], passThreshold };
    }
    throw new MiniQuizParseError("Mini-quiz must be an array of questions.");
  }

  return {
    questions: rawQuestions.map(parseQuestion),
    passThreshold,
  };
}

export function hasParsedQuiz(value: Json): boolean {
  return parseMiniQuiz(value).questions.length > 0;
}

export function miniQuizViewModel(value: Json): MiniQuizViewQuestion[] {
  return parseMiniQuiz(value).questions.map(({ answer, ...question }) => {
    void answer;
    return question;
  });
}

export function getPassThreshold(args: {
  miniQuiz: Json;
  metadata: Json;
}): number {
  const quizThreshold = parseMiniQuiz(args.miniQuiz).passThreshold;
  return (
    quizThreshold ??
    metadataThreshold(args.metadata) ??
    DEFAULT_PASS_THRESHOLD
  );
}

export function scoreMiniQuiz(args: {
  miniQuiz: Json;
  metadata: Json;
  selections: QuizSelection;
}): QuizScoreResult {
  const parsed = parseMiniQuiz(args.miniQuiz);
  if (parsed.questions.length === 0) {
    throw new MiniQuizParseError("This module does not include a mini-quiz.");
  }

  const threshold = getPassThreshold(args);
  const responses = parsed.questions.map((question) => {
    const chosen = args.selections[question.id];
    if (!Number.isInteger(chosen)) {
      throw new MiniQuizParseError("Answer every quiz question before submitting.");
    }
    if (chosen < 0 || chosen >= question.options.length) {
      throw new MiniQuizParseError("Quiz response is outside the available options.");
    }
    return {
      q_id: question.id,
      chosen,
      correct: chosen === question.answer,
    };
  });

  const correctCount = responses.filter((response) => response.correct).length;
  const totalCount = parsed.questions.length;
  const score = totalCount === 0 ? 0 : correctCount / totalCount;

  return {
    score,
    passed: score >= threshold,
    correctCount,
    totalCount,
    threshold,
    responses,
  };
}

export function formatQuizPercent(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return `${Math.round(value * 100)}%`;
}

function parseQuestion(raw: Json, index: number): MiniQuizQuestion {
  if (!isRecord(raw)) {
    throw new MiniQuizParseError(`Mini-quiz question ${index + 1} is invalid.`);
  }

  const prompt = stringValue(raw.q) ?? stringValue(raw.prompt);
  const options = Array.isArray(raw.options)
    ? raw.options.filter((option): option is string => typeof option === "string")
    : [];
  const answer = typeof raw.answer === "number" ? raw.answer : NaN;

  if (!prompt) {
    throw new MiniQuizParseError(`Mini-quiz question ${index + 1} is missing text.`);
  }
  if (options.length < 2) {
    throw new MiniQuizParseError(
      `Mini-quiz question ${index + 1} needs at least two options.`,
    );
  }
  if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) {
    throw new MiniQuizParseError(
      `Mini-quiz question ${index + 1} has an invalid answer key.`,
    );
  }

  return {
    id: stringValue(raw.q_id) ?? stringValue(raw.id) ?? `q${index + 1}`,
    prompt,
    options,
    answer,
    explain: stringValue(raw.explain) ?? undefined,
  };
}

function metadataThreshold(value: Json): number | null {
  if (!isRecord(value)) return null;
  return validThreshold(value.pass_threshold);
}

function validThreshold(value: Json | undefined): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= 1
    ? value
    : null;
}

function stringValue(value: Json | undefined): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function isRecord(value: Json): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
