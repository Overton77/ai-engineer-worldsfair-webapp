export type ModuleCompletionActionInput = {
  moduleSlug: string;
  selections?: Record<string, number>;
};

export type CourseModuleCompletionActionInput = ModuleCompletionActionInput & {
  courseSlug: string;
};

export type ModuleCompletionActionResult =
  | {
      ok: true;
      completed: true;
      message: string;
      score: number | null;
      threshold: number | null;
      correctCount: number | null;
      totalCount: number | null;
      moduleXp: {
        awarded: boolean;
        points: number;
      };
      courseXp?: {
        awarded: boolean;
        points: number;
      } | null;
      progress?: {
        completedModuleCount: number;
        totalModuleCount: number;
        percent: number;
      } | null;
    }
  | {
      ok: false;
      completed: false;
      error: string;
      score?: number;
      threshold?: number;
      correctCount?: number;
      totalCount?: number;
    };
