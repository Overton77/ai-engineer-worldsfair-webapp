"use server";

import { revalidatePath } from "next/cache";

import {
  completeCourseModule,
  getCourseBySlug,
  getCourseSyllabus,
  startCourse,
} from "@/lib/db/learn";
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

export async function startCourseFromModuleAction(formData: FormData) {
  const courseId = formData.get("courseId");
  const courseSlug = formData.get("courseSlug");
  const moduleSlug = formData.get("moduleSlug");

  if (typeof courseId !== "string" || courseId.length === 0) {
    throw new Error("Missing course id.");
  }
  if (typeof courseSlug !== "string" || courseSlug.length === 0) {
    throw new Error("Missing course slug.");
  }
  if (typeof moduleSlug !== "string" || moduleSlug.length === 0) {
    throw new Error("Missing module slug.");
  }

  await startCourse(courseId);
  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath(`/courses/${courseSlug}/m/${moduleSlug}`);
  revalidatePath("/learn");
}

export async function submitCourseModuleQuizAction(
  input: CourseModuleCompletionActionInput | ModuleCompletionActionInput,
): Promise<ModuleCompletionActionResult> {
  if (!("courseSlug" in input)) return actionError("Missing course slug.");
  const context = await getActionContext(input.courseSlug, input.moduleSlug);
  if (!context) return actionError("Course module not found.");

  try {
    const quizResult = scoreMiniQuiz({
      miniQuiz: context.module.mini_quiz,
      metadata: context.module.metadata,
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

    const result = await completeCourseModule(
      context.course.course_id,
      context.module.module_id,
      {
        completionMethod: "quiz",
        attempts: 1,
        quizResponses: quizResult.responses,
        quizScore: quizResult.score,
        metadata: quizMetadata(quizResult),
      },
    );
    revalidateCourseModule(input.courseSlug, input.moduleSlug);

    return {
      ok: true,
      completed: true,
      message: completionMessage(result.moduleXp.awarded, result.moduleXp.points),
      score: quizResult.score,
      threshold: quizResult.threshold,
      correctCount: quizResult.correctCount,
      totalCount: quizResult.totalCount,
      moduleXp: {
        awarded: result.moduleXp.awarded,
        points: result.moduleXp.points,
      },
      courseXp: result.courseXp
        ? {
            awarded: result.courseXp.awarded,
            points: result.courseXp.points,
          }
        : null,
      progress: {
        completedModuleCount: result.progress.completed_module_count,
        totalModuleCount: result.progress.total_module_count,
        percent: result.progress.percent,
      },
    };
  } catch (error) {
    return actionError(errorMessage(error));
  }
}

export async function markCourseModuleCompleteAction(
  input: CourseModuleCompletionActionInput | ModuleCompletionActionInput,
): Promise<ModuleCompletionActionResult> {
  if (!("courseSlug" in input)) return actionError("Missing course slug.");
  const context = await getActionContext(input.courseSlug, input.moduleSlug);
  if (!context) return actionError("Course module not found.");

  try {
    if (parseMiniQuiz(context.module.mini_quiz).questions.length > 0) {
      return actionError("Complete this module by passing the mini-quiz.");
    }

    const result = await completeCourseModule(
      context.course.course_id,
      context.module.module_id,
      {
        completionMethod: "mark-complete",
        metadata: { completion_method: "mark-complete" },
      },
    );
    revalidateCourseModule(input.courseSlug, input.moduleSlug);

    return {
      ok: true,
      completed: true,
      message: completionMessage(result.moduleXp.awarded, result.moduleXp.points),
      score: null,
      threshold: null,
      correctCount: null,
      totalCount: null,
      moduleXp: {
        awarded: result.moduleXp.awarded,
        points: result.moduleXp.points,
      },
      courseXp: result.courseXp
        ? {
            awarded: result.courseXp.awarded,
            points: result.courseXp.points,
          }
        : null,
      progress: {
        completedModuleCount: result.progress.completed_module_count,
        totalModuleCount: result.progress.total_module_count,
        percent: result.progress.percent,
      },
    };
  } catch (error) {
    return actionError(errorMessage(error));
  }
}

async function getActionContext(courseSlug: string, moduleSlug: string) {
  if (
    typeof courseSlug !== "string" ||
    courseSlug.length === 0 ||
    typeof moduleSlug !== "string" ||
    moduleSlug.length === 0
  ) {
    return null;
  }

  const course = await getCourseBySlug(courseSlug);
  if (!course) return null;

  const syllabus = await getCourseSyllabus(course.course_id);
  const syllabusItem = syllabus.find((item) => item.module.slug === moduleSlug);
  if (!syllabusItem) return null;

  return {
    course,
    module: syllabusItem.module,
  };
}

function revalidateCourseModule(courseSlug: string, moduleSlug: string) {
  revalidatePath(`/courses/${courseSlug}/m/${moduleSlug}`);
  revalidatePath(`/courses/${courseSlug}`);
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

function completionMessage(awarded: boolean, points: number) {
  return awarded
    ? `Module complete. You earned ${points} XP.`
    : "Module complete. XP was already awarded for this module version.";
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
