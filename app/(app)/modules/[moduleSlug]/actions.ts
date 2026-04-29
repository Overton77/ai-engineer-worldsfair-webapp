"use server";

import { revalidatePath } from "next/cache";

import { completeStandaloneModule, getModuleBySlug } from "@/lib/db/learn";
import type {
  CourseModuleCompletionActionInput,
  ModuleCompletionActionInput,
  ModuleCompletionActionResult,
} from "@/lib/learn/module-completion-actions";
import {
  MiniQuizParseError,
  parseMiniQuiz,
  scoreMiniQuiz,
} from "@/lib/learn/module-quiz";

export async function submitStandaloneModuleQuizAction(
  input: ModuleCompletionActionInput | CourseModuleCompletionActionInput,
): Promise<ModuleCompletionActionResult> {
  const courseModule = await getActionModule(input.moduleSlug);
  if (!courseModule) return actionError("Module not found.");

  try {
    const quizResult = scoreMiniQuiz({
      miniQuiz: courseModule.mini_quiz,
      metadata: courseModule.metadata,
      selections: input.selections ?? {},
    });

    if (!quizResult.passed) {
      return {
        ok: false,
        completed: false,
        error: "Keep going: this score did not meet the pass threshold.",
        score: quizResult.score,
        threshold: quizResult.threshold,
        correctCount: quizResult.correctCount,
        totalCount: quizResult.totalCount,
      };
    }

    const result = await completeStandaloneModule(courseModule.module_id, {
      completionMethod: "quiz",
      attempts: 1,
      quizResponses: quizResult.responses,
      quizScore: quizResult.score,
      metadata: quizMetadata(quizResult),
    });
    revalidateStandalone(input.moduleSlug);

    return {
      ok: true,
      completed: true,
      message: result.moduleXp.awarded
        ? `Module complete. You earned ${result.moduleXp.points} XP.`
        : "Module complete. XP was already awarded for this module version.",
      score: quizResult.score,
      threshold: quizResult.threshold,
      correctCount: quizResult.correctCount,
      totalCount: quizResult.totalCount,
      moduleXp: {
        awarded: result.moduleXp.awarded,
        points: result.moduleXp.points,
      },
    };
  } catch (error) {
    return actionError(errorMessage(error));
  }
}

export async function markStandaloneModuleCompleteAction(
  input: ModuleCompletionActionInput | CourseModuleCompletionActionInput,
): Promise<ModuleCompletionActionResult> {
  const courseModule = await getActionModule(input.moduleSlug);
  if (!courseModule) return actionError("Module not found.");

  try {
    if (parseMiniQuiz(courseModule.mini_quiz).questions.length > 0) {
      return actionError("Complete this module by passing the mini-quiz.");
    }

    const result = await completeStandaloneModule(courseModule.module_id, {
      completionMethod: "mark-complete",
      metadata: { completion_method: "mark-complete" },
    });
    revalidateStandalone(input.moduleSlug);

    return {
      ok: true,
      completed: true,
      message: result.moduleXp.awarded
        ? `Module complete. You earned ${result.moduleXp.points} XP.`
        : "Module complete. XP was already awarded for this module version.",
      score: null,
      threshold: null,
      correctCount: null,
      totalCount: null,
      moduleXp: {
        awarded: result.moduleXp.awarded,
        points: result.moduleXp.points,
      },
    };
  } catch (error) {
    return actionError(errorMessage(error));
  }
}

async function getActionModule(moduleSlug: string) {
  if (typeof moduleSlug !== "string" || moduleSlug.length === 0) return null;
  return getModuleBySlug(moduleSlug);
}

function revalidateStandalone(moduleSlug: string) {
  revalidatePath(`/modules/${moduleSlug}`);
  revalidatePath("/modules");
  revalidatePath("/learn");
}

function quizMetadata(result: ReturnType<typeof scoreMiniQuiz>) {
  return {
    completion_method: "quiz",
    pass_threshold: result.threshold,
    correct_count: result.correctCount,
    total_count: result.totalCount,
  };
}

function actionError(error: string): ModuleCompletionActionResult {
  return {
    ok: false,
    completed: false,
    error,
  };
}

function errorMessage(error: unknown) {
  if (error instanceof MiniQuizParseError) return error.message;
  if (error instanceof Error) return error.message;
  return "Unable to complete this module.";
}
