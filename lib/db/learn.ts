import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { assertOwner, requireUser } from "@/lib/auth/require-user";
import {
  getPassThreshold,
  parseMiniQuiz,
  type StoredQuizResponse,
} from "@/lib/learn/module-quiz";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database.types";

import {
  awardCourseCompletionXp,
  awardModuleCompletionXp,
  type XpAwardMetadata,
  type XpAwardResult,
} from "./xp";

type Client = SupabaseClient<Database>;

export type CourseRow = Database["public"]["Tables"]["course"]["Row"];
export type CourseEnrollmentRow =
  Database["public"]["Tables"]["course_enrollment"]["Row"];
export type CourseModuleRow =
  Database["public"]["Tables"]["course_module"]["Row"];
export type CourseModuleInCourseRow =
  Database["public"]["Tables"]["course_module_in_course"]["Row"];
export type CourseModuleCompletionRow =
  Database["public"]["Tables"]["course_module_completion"]["Row"];
export type CourseModulePrerequisiteRow =
  Database["public"]["Tables"]["course_module_requires"]["Row"];
export type ModuleCompletionRow =
  Database["public"]["Tables"]["module_completion"]["Row"];
export type ModuleUsesArtifactRow =
  Database["public"]["Tables"]["module_uses_artifact"]["Row"];
export type LearningAssetRow =
  Database["public"]["Tables"]["learning_asset"]["Row"];
export type ChallengeRow = Database["public"]["Tables"]["challenge"]["Row"];

export type CourseSyllabusItem = CourseModuleInCourseRow & {
  module: CourseModuleRow;
};

export type CourseModulePrerequisite = CourseModulePrerequisiteRow & {
  prereqModule: CourseModuleRow;
};

export type CourseProgressCache = {
  completed_module_count: number;
  total_module_count: number;
  percent: number;
  last_module_id: string | null;
  last_completed_at: string | null;
  course_version: string;
};

export type CompleteModulePayload = {
  completionMethod?: "quiz" | "mark-complete";
  attempts?: number;
  quizResponses?: Json;
  quizScore?: number | null;
  timeSpentSeconds?: number | null;
  metadata?: XpAwardMetadata | null;
};

export type CompleteStandaloneModuleResult = {
  completion: ModuleCompletionRow;
  moduleXp: XpAwardResult;
};

export type CompleteCourseModuleResult = {
  completion: CourseModuleCompletionRow;
  progress: CourseProgressCache;
  moduleXp: XpAwardResult;
  courseXp: XpAwardResult | null;
};

export type CourseCatalogItem = {
  course: CourseRow;
  moduleCount: number;
  durationMinutes: number | null;
};

export type ModuleCatalogItem = {
  module: CourseModuleRow;
  sourceCount: number;
  completion: ModuleCompletionRow | null;
};

export type ModuleAssetUse = ModuleUsesArtifactRow & {
  asset: LearningAssetRow | null;
};

export type LearnerHubCourse = {
  enrollment: CourseEnrollmentRow;
  course: CourseRow;
  progress: CourseProgressCache;
  nextModule: CourseModuleRow | null;
};

export type LearnerHubRecentModule = {
  completion: ModuleCompletionRow;
  module: CourseModuleRow;
};

export type LearnerHubData = {
  activeCourses: LearnerHubCourse[];
  recentStandaloneModules: LearnerHubRecentModule[];
  recommendedCourses: CourseCatalogItem[];
  recommendedModules: ModuleCatalogItem[];
};

async function getClient(client?: Client): Promise<Client> {
  return client ?? (await createServerSupabase());
}

function dbError(label: string, error: { message: string }): Error {
  return new Error(`${label} failed: ${error.message}`);
}

function ensureRow<T>(label: string, row: T | null | undefined): T {
  if (!row) throw new Error(`${label} not found`);
  return row;
}

function isRequiredCourseModule(row: Pick<CourseModuleInCourseRow, "role">) {
  return row.role !== "optional";
}

function completionPayloadFields(
  payload: CompleteModulePayload,
  existing?: Pick<
    ModuleCompletionRow | CourseModuleCompletionRow,
    "attempts" | "quiz_responses" | "quiz_score" | "time_spent_seconds"
  > | null,
) {
  return {
    attempts: Math.max(
      1,
      Math.floor(payload.attempts ?? existing?.attempts ?? 1),
    ),
    quiz_responses: payload.quizResponses ?? existing?.quiz_responses ?? [],
    quiz_score:
      "quizScore" in payload
        ? (payload.quizScore ?? null)
        : (existing?.quiz_score ?? null),
    time_spent_seconds:
      "timeSpentSeconds" in payload
        ? payload.timeSpentSeconds ?? null
        : existing?.time_spent_seconds ?? null,
  };
}

function mergeMetadata(
  metadata: XpAwardMetadata | null | undefined,
  audit: XpAwardMetadata,
): XpAwardMetadata {
  return {
    ...(metadata ?? {}),
    ...audit,
  };
}

function progressIsComplete(progress: CourseProgressCache): boolean {
  return progress.total_module_count > 0 && progress.percent === 100;
}

function validateCompletionPolicy(
  module: CourseModuleRow,
  payload: CompleteModulePayload,
) {
  const parsedQuiz = parseMiniQuiz(module.mini_quiz);
  if (parsedQuiz.questions.length === 0) {
    if (payload.completionMethod === "quiz") {
      throw new Error("This module does not include a mini-quiz.");
    }
    return;
  }

  if (payload.completionMethod !== "quiz") {
    throw new Error("Complete this module by passing the mini-quiz.");
  }

  if (typeof payload.quizScore !== "number" || !Number.isFinite(payload.quizScore)) {
    throw new Error("Quiz score is required to complete this module.");
  }

  const threshold = getPassThreshold({
    miniQuiz: module.mini_quiz,
    metadata: module.metadata,
  });
  if (payload.quizScore < threshold) {
    throw new Error("Quiz score did not meet the pass threshold.");
  }

  if (!hasCompleteQuizResponses(payload.quizResponses, parsedQuiz.questions.length)) {
    throw new Error("Quiz responses are required to complete this module.");
  }
}

function hasCompleteQuizResponses(value: Json | undefined, expectedCount: number) {
  if (!Array.isArray(value) || value.length < expectedCount) return false;
  return value.every((response): response is StoredQuizResponse => {
    if (!response || typeof response !== "object" || Array.isArray(response)) {
      return false;
    }
    const item = response as Record<string, Json | undefined>;
    return (
      typeof item.q_id === "string" &&
      Number.isInteger(item.chosen) &&
      typeof item.correct === "boolean"
    );
  });
}

export function buildCourseProgressCache(input: {
  courseVersion: string;
  syllabus: CourseModuleInCourseRow[];
  completions: CourseModuleCompletionRow[];
}): CourseProgressCache {
  const requiredModuleIds = new Set(
    input.syllabus.filter(isRequiredCourseModule).map((row) => row.module_id),
  );
  const relevantCompletions = input.completions.filter((row) =>
    requiredModuleIds.has(row.module_id) &&
    row.course_version === input.courseVersion,
  );
  const completedModuleIds = new Set(
    relevantCompletions.map((row) => row.module_id),
  );
  const total = requiredModuleIds.size;
  const completed = completedModuleIds.size;
  const lastCompletion =
    relevantCompletions
      .slice()
      .sort((a, b) => b.completed_at.localeCompare(a.completed_at))[0] ?? null;

  return {
    completed_module_count: completed,
    total_module_count: total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    last_module_id: lastCompletion?.module_id ?? null,
    last_completed_at: lastCompletion?.completed_at ?? null,
    course_version: input.courseVersion,
  };
}

export async function listPublishedCourses(
  opts: { limit?: number; client?: Client } = {},
): Promise<CourseRow[]> {
  const sb = await getClient(opts.client);
  const { data, error } = await sb
    .from("course")
    .select("*")
    .eq("status", "published")
    .eq("is_latest_published", true)
    .order("title", { ascending: true })
    .limit(opts.limit ?? 100);
  if (error) throw dbError("listPublishedCourses", error);
  return data ?? [];
}

export async function listPublishedCourseCatalog(
  opts: { limit?: number; client?: Client } = {},
): Promise<CourseCatalogItem[]> {
  const sb = await getClient(opts.client);
  const courses = await listPublishedCourses({ limit: opts.limit, client: sb });
  if (courses.length === 0) return [];

  const courseIds = courses.map((row) => row.course_id);
  const { data: memberships, error: membershipError } = await sb
    .from("course_module_in_course")
    .select("*")
    .in("course_id", courseIds);
  if (membershipError) {
    throw dbError("listPublishedCourseCatalog.memberships", membershipError);
  }

  const moduleIds = Array.from(
    new Set((memberships ?? []).map((row) => row.module_id)),
  );
  const modules =
    moduleIds.length === 0
      ? []
      : await listModulesByIds(moduleIds, sb, "listPublishedCourseCatalog.modules");
  const moduleById = new Map(modules.map((row) => [row.module_id, row]));

  const summaryByCourse = new Map<
    string,
    { moduleCount: number; durationMinutes: number }
  >();
  for (const membership of memberships ?? []) {
    const summary =
      summaryByCourse.get(membership.course_id) ??
      { moduleCount: 0, durationMinutes: 0 };
    summary.moduleCount += 1;
    summary.durationMinutes += moduleById.get(membership.module_id)?.duration_min ?? 0;
    summaryByCourse.set(membership.course_id, summary);
  }

  return courses.map((course) => {
    const summary = summaryByCourse.get(course.course_id);
    return {
      course,
      moduleCount: summary?.moduleCount ?? 0,
      durationMinutes:
        summary && summary.durationMinutes > 0 ? summary.durationMinutes : null,
    };
  });
}

export async function getCourseBySlug(
  slug: string,
  opts: { version?: string; client?: Client } = {},
): Promise<CourseRow | null> {
  const sb = await getClient(opts.client);
  let query = sb
    .from("course")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published");

  query = opts.version
    ? query.eq("version", opts.version)
    : query.eq("is_latest_published", true);

  const { data, error } = await query.maybeSingle();
  if (error) throw dbError("getCourseBySlug", error);
  return data ?? null;
}

export async function getCourseSyllabus(
  courseId: string,
  client?: Client,
): Promise<CourseSyllabusItem[]> {
  const sb = await getClient(client);
  const { data: syllabus, error: syllabusError } = await sb
    .from("course_module_in_course")
    .select("*")
    .eq("course_id", courseId)
    .order("ord", { ascending: true });
  if (syllabusError) throw dbError("getCourseSyllabus", syllabusError);
  if (!syllabus || syllabus.length === 0) return [];

  const moduleIds = syllabus.map((row) => row.module_id);
  const { data: modules, error: modulesError } = await sb
    .from("course_module")
    .select("*")
    .in("module_id", moduleIds);
  if (modulesError) throw dbError("getCourseSyllabus.modules", modulesError);

  const moduleById = new Map((modules ?? []).map((row) => [row.module_id, row]));
  return syllabus.map((row) => ({
    ...row,
    module: ensureRow(`course module ${row.module_id}`, moduleById.get(row.module_id)),
  }));
}

export async function getEnrollment(
  userId: string,
  courseId: string,
  client?: Client,
): Promise<CourseEnrollmentRow | null> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("course_enrollment")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) throw dbError("getEnrollment", error);
  return data ?? null;
}

export async function getCourseProgress(
  userId: string,
  courseId: string,
  client?: Client,
): Promise<CourseProgressCache> {
  const sb = await getClient(client);
  return deriveCourseProgress(sb, userId, courseId);
}

export async function listPublishedModules(
  opts: { limit?: number; client?: Client } = {},
): Promise<CourseModuleRow[]> {
  const sb = await getClient(opts.client);
  const { data, error } = await sb
    .from("course_module")
    .select("*")
    .eq("status", "published")
    .eq("is_latest_published", true)
    .order("title", { ascending: true })
    .limit(opts.limit ?? 100);
  if (error) throw dbError("listPublishedModules", error);
  return data ?? [];
}

export async function listPublishedModuleCatalog(
  opts: { limit?: number; userId?: string; client?: Client } = {},
): Promise<ModuleCatalogItem[]> {
  const sb = await getClient(opts.client);
  const modules = await listPublishedModules({ limit: opts.limit, client: sb });
  if (modules.length === 0) return [];

  const moduleIds = modules.map((row) => row.module_id);
  const { data: uses, error: usesError } = await sb
    .from("module_uses_artifact")
    .select("*")
    .in("module_id", moduleIds);
  if (usesError) throw dbError("listPublishedModuleCatalog.uses", usesError);

  const completions = opts.userId
    ? await listStandaloneCompletionsForModules(opts.userId, moduleIds, sb)
    : [];
  const completionByModuleId = new Map(
    completions.map((row) => [row.module_id, row]),
  );
  const sourceCountByModuleId = new Map<string, number>();
  for (const use of uses ?? []) {
    sourceCountByModuleId.set(
      use.module_id,
      (sourceCountByModuleId.get(use.module_id) ?? 0) + 1,
    );
  }

  return modules.map((module) => ({
    module,
    sourceCount: sourceCountByModuleId.get(module.module_id) ?? 0,
    completion: completionByModuleId.get(module.module_id) ?? null,
  }));
}

export async function getModuleBySlug(
  slug: string,
  opts: { version?: string; client?: Client } = {},
): Promise<CourseModuleRow | null> {
  const sb = await getClient(opts.client);
  let query = sb
    .from("course_module")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published");

  query = opts.version
    ? query.eq("version", opts.version)
    : query.eq("is_latest_published", true);

  const { data, error } = await query.maybeSingle();
  if (error) throw dbError("getModuleBySlug", error);
  return data ?? null;
}

export async function getStandaloneModuleCompletion(
  userId: string,
  moduleId: string,
  client?: Client,
): Promise<ModuleCompletionRow | null> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("module_completion")
    .select("*")
    .eq("user_id", userId)
    .eq("module_id", moduleId)
    .maybeSingle();
  if (error) throw dbError("getStandaloneModuleCompletion", error);
  return data ?? null;
}

export async function listModuleAssetUses(
  moduleId: string,
  client?: Client,
): Promise<ModuleAssetUse[]> {
  const sb = await getClient(client);
  const { data: uses, error: usesError } = await sb
    .from("module_uses_artifact")
    .select("*")
    .eq("module_id", moduleId)
    .order("ord", { ascending: true });
  if (usesError) throw dbError("listModuleAssetUses.uses", usesError);
  if (!uses || uses.length === 0) return [];

  const assetIds = Array.from(
    new Set(
      uses
        .filter((use) => use.artifact_kind === "learning_asset")
        .map((use) => use.artifact_id),
    ),
  );
  const { data: assets, error: assetsError } =
    assetIds.length === 0
      ? { data: [], error: null }
      : await sb.from("learning_asset").select("*").in("asset_id", assetIds);
  if (assetsError) throw dbError("listModuleAssetUses.assets", assetsError);

  const assetById = new Map(
    (assets ?? []).map((asset) => [asset.asset_id, asset]),
  );

  return uses.map((use) => ({
    ...use,
    asset:
      use.artifact_kind === "learning_asset"
        ? (assetById.get(use.artifact_id) ?? null)
        : null,
  }));
}

export async function listLearnerHub(
  userId: string,
  opts: {
    courseLimit?: number;
    moduleLimit?: number;
    recommendationLimit?: number;
    client?: Client;
  } = {},
): Promise<LearnerHubData> {
  const sb = await getClient(opts.client);
  const courseLimit = opts.courseLimit ?? 3;
  const moduleLimit = opts.moduleLimit ?? 3;
  const recommendationLimit = opts.recommendationLimit ?? 4;

  const { data: enrollments, error: enrollmentError } = await sb
    .from("course_enrollment")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(courseLimit);
  if (enrollmentError) throw dbError("listLearnerHub.enrollments", enrollmentError);

  const courses = (enrollments ?? []).length
    ? await listCoursesByIds(
        (enrollments ?? []).map((row) => row.course_id),
        sb,
        "listLearnerHub.courses",
      )
    : [];
  const courseById = new Map(courses.map((row) => [row.course_id, row]));
  const activeCourses = (
    await Promise.all(
      (enrollments ?? []).map(async (enrollment) => {
        const course = courseById.get(enrollment.course_id);
        if (!course) return null;
        const syllabus = await getCourseSyllabus(enrollment.course_id, sb);
        const progress = await deriveCourseProgress(
          sb,
          userId,
          enrollment.course_id,
          course.version,
        );
        if (progressIsComplete(progress)) return null;

        return {
          enrollment,
          course,
          progress,
          nextModule: getNextModuleFromSyllabus(syllabus, progress),
        };
      }),
    )
  ).filter((row): row is LearnerHubCourse => row !== null);

  const { data: recentCompletions, error: recentError } = await sb
    .from("module_completion")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(moduleLimit);
  if (recentError) throw dbError("listLearnerHub.recentCompletions", recentError);

  const recentModules = (recentCompletions ?? []).length
    ? await listModulesByIds(
        (recentCompletions ?? []).map((row) => row.module_id),
        sb,
        "listLearnerHub.recentModules",
      )
    : [];
  const recentModuleById = new Map(
    recentModules.map((row) => [row.module_id, row]),
  );
  const recentStandaloneModules = (recentCompletions ?? [])
    .map((completion) => {
      const courseModule = recentModuleById.get(completion.module_id);
      return courseModule ? { completion, module: courseModule } : null;
    })
    .filter((row): row is LearnerHubRecentModule => row !== null);

  const [recommendedCourses, recommendedModules] = await Promise.all([
    listPublishedCourseCatalog({ limit: recommendationLimit, client: sb }),
    listPublishedModuleCatalog({
      limit: recommendationLimit,
      userId,
      client: sb,
    }),
  ]);

  return {
    activeCourses,
    recentStandaloneModules,
    recommendedCourses,
    recommendedModules,
  };
}

export async function getMostRecentActiveLearnerCourse(
  userId: string,
  opts: {
    enrollmentLimit?: number;
    client?: Client;
  } = {},
): Promise<LearnerHubCourse | null> {
  const sb = await getClient(opts.client);
  const enrollmentLimit = opts.enrollmentLimit ?? 10;

  const { data: enrollments, error: enrollmentError } = await sb
    .from("course_enrollment")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(enrollmentLimit);
  if (enrollmentError) {
    throw dbError("getMostRecentActiveLearnerCourse.enrollments", enrollmentError);
  }

  const activeEnrollments = (enrollments ?? []).filter(
    (enrollment) => !enrollment.completed_at,
  );
  const courses = activeEnrollments.length
    ? await listCoursesByIds(
        activeEnrollments.map((row) => row.course_id),
        sb,
        "getMostRecentActiveLearnerCourse.courses",
      )
    : [];
  const courseById = new Map(courses.map((row) => [row.course_id, row]));

  for (const enrollment of activeEnrollments) {
    const course = courseById.get(enrollment.course_id);
    if (!course) continue;

    const syllabus = await getCourseSyllabus(enrollment.course_id, sb);
    const progress = await deriveCourseProgress(
      sb,
      userId,
      enrollment.course_id,
      course.version,
    );
    if (progressIsComplete(progress)) continue;

    return {
      enrollment,
      course,
      progress,
      nextModule: getNextModuleFromSyllabus(syllabus, progress),
    };
  }

  return null;
}

export async function getCourseModuleCompletion(
  userId: string,
  courseId: string,
  moduleId: string,
  client?: Client,
): Promise<CourseModuleCompletionRow | null> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("course_module_completion")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("module_id", moduleId)
    .maybeSingle();
  if (error) throw dbError("getCourseModuleCompletion", error);
  return data ?? null;
}

export async function listCourseModuleCompletions(
  userId: string,
  courseId: string,
  client?: Client,
): Promise<CourseModuleCompletionRow[]> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("course_module_completion")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId);
  if (error) throw dbError("listCourseModuleCompletions", error);
  return data ?? [];
}

export async function listCourseModulePrerequisites(
  moduleIds: string[],
  client?: Client,
): Promise<CourseModulePrerequisite[]> {
  if (moduleIds.length === 0) return [];
  const sb = await getClient(client);
  const { data: prerequisites, error } = await sb
    .from("course_module_requires")
    .select("*")
    .in("module_id", Array.from(new Set(moduleIds)));
  if (error) throw dbError("listCourseModulePrerequisites", error);
  if (!prerequisites || prerequisites.length === 0) return [];

  const prereqModuleIds = prerequisites.map((row) => row.prereq_module_id);
  const prereqModules = await listModulesByIds(
    prereqModuleIds,
    sb,
    "listCourseModulePrerequisites.modules",
  );
  const moduleById = new Map(prereqModules.map((row) => [row.module_id, row]));

  return prerequisites.map((row) => ({
    ...row,
    prereqModule: ensureRow(
      `prerequisite module ${row.prereq_module_id}`,
      moduleById.get(row.prereq_module_id),
    ),
  }));
}

export async function getChallengeBySlug(
  slug: string,
  client?: Client,
): Promise<ChallengeRow | null> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("challenge")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw dbError("getChallengeBySlug", error);
  return data ?? null;
}

export async function listChallengesForCourse(
  courseId: string,
  client?: Client,
): Promise<ChallengeRow[]> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("challenge")
    .select("*")
    .eq("course_id", courseId)
    .eq("status", "published")
    .order("title", { ascending: true });
  if (error) throw dbError("listChallengesForCourse", error);
  return data ?? [];
}

export async function listChallengesForModule(
  moduleId: string,
  client?: Client,
): Promise<ChallengeRow[]> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("challenge")
    .select("*")
    .eq("module_id", moduleId)
    .eq("status", "published")
    .order("title", { ascending: true });
  if (error) throw dbError("listChallengesForModule", error);
  return data ?? [];
}

export async function startCourse(
  courseId: string,
  client?: Client,
): Promise<CourseEnrollmentRow> {
  const user = await requireUser();
  const sb = await getClient(client);
  const course = await getCourseById(courseId, sb);
  const progress = await deriveCourseProgress(sb, user.id, courseId, course.version);

  const { data, error } = await sb
    .from("course_enrollment")
    .upsert(
      {
        user_id: user.id,
        course_id: courseId,
        progress: progress as Json,
      },
      { onConflict: "user_id,course_id" },
    )
    .select("*")
    .single();
  if (error) throw dbError("startCourse", error);
  return ensureRow("course enrollment", data);
}

export async function recomputeCourseEnrollmentProgress(
  userId: string,
  courseId: string,
  client?: Client,
): Promise<CourseProgressCache> {
  const user = await requireUser();
  assertOwner(user.id, userId);
  const sb = await getClient(client);
  const progress = await deriveCourseProgress(sb, userId, courseId);
  const completedAt = progressIsComplete(progress)
    ? progress.last_completed_at
    : null;

  const { error } = await sb
    .from("course_enrollment")
    .update({
      progress: progress as Json,
      completed_at: completedAt,
    })
    .eq("user_id", userId)
    .eq("course_id", courseId);
  if (error) throw dbError("recomputeCourseEnrollmentProgress", error);
  return progress;
}

export async function completeStandaloneModule(
  moduleId: string,
  payload: CompleteModulePayload = {},
  client?: Client,
): Promise<CompleteStandaloneModuleResult> {
  const user = await requireUser();
  const sb = await getClient(client);
  const courseModule = await getModuleById(moduleId, sb);
  validateCompletionPolicy(courseModule, payload);
  const existingCompletion = await getStandaloneModuleCompletion(
    user.id,
    moduleId,
    sb,
  );
  const completionFields = completionPayloadFields(payload, existingCompletion);

  const { data, error } = await sb
    .from("module_completion")
    .upsert(
      {
        user_id: user.id,
        module_id: moduleId,
        module_version: courseModule.version,
        ...completionFields,
      },
      { onConflict: "user_id,module_id" },
    )
    .select("*")
    .single();
  if (error) throw dbError("completeStandaloneModule", error);

  const completion = ensureRow("module completion", data);
  const moduleXp = await awardModuleCompletionXp({
    userId: user.id,
    moduleId,
    metadata: mergeMetadata(payload.metadata, {
      completion_context: "standalone",
      module_version: courseModule.version,
      quiz_score: completion.quiz_score,
    }),
  });

  return { completion, moduleXp };
}

export async function completeCourseModule(
  courseId: string,
  moduleId: string,
  payload: CompleteModulePayload = {},
  client?: Client,
): Promise<CompleteCourseModuleResult> {
  const user = await requireUser();
  const sb = await getClient(client);
  const [course, courseModule, enrollment, membership] = await Promise.all([
    getCourseById(courseId, sb),
    getModuleById(moduleId, sb),
    getEnrollment(user.id, courseId, sb),
    getCourseModuleMembership(courseId, moduleId, sb),
  ]);

  ensureRow("course enrollment", enrollment);
  ensureRow("course module membership", membership);
  validateCompletionPolicy(courseModule, payload);

  const beforeProgress = await deriveCourseProgress(
    sb,
    user.id,
    courseId,
    course.version,
  );
  const wasComplete = progressIsComplete(beforeProgress);
  const existingCompletion = await getCourseModuleCompletion(
    user.id,
    courseId,
    moduleId,
    sb,
  );
  const completionFields = completionPayloadFields(payload, existingCompletion);
  const completionMetadata = mergeMetadata(
    {
      ...((existingCompletion?.metadata as XpAwardMetadata | null) ?? {}),
      ...(payload.metadata ?? {}),
    },
    {
      course_version: course.version,
      module_version: courseModule.version,
    },
  );

  const { data, error } = await sb
    .from("course_module_completion")
    .upsert(
      {
        user_id: user.id,
        course_id: courseId,
        module_id: moduleId,
        course_version: course.version,
        module_version: courseModule.version,
        metadata: completionMetadata as Json,
        ...completionFields,
      },
      { onConflict: "user_id,course_id,module_id" },
    )
    .select("*")
    .single();
  if (error) throw dbError("completeCourseModule", error);

  const completion = ensureRow("course module completion", data);
  const moduleXp = await awardModuleCompletionXp({
    userId: user.id,
    moduleId,
    metadata: mergeMetadata(payload.metadata, {
      completion_context: "course",
      course_id: courseId,
      course_version: course.version,
      module_version: courseModule.version,
      quiz_score: completion.quiz_score,
    }),
  });

  const progress = await recomputeCourseEnrollmentProgress(user.id, courseId, sb);
  const isNewlyComplete = !wasComplete && progressIsComplete(progress);
  const courseXp = isNewlyComplete
    ? await awardCourseCompletionXp({
        userId: user.id,
        courseId,
        metadata: mergeMetadata(payload.metadata, {
          course_version: course.version,
          completed_module_count: progress.completed_module_count,
          total_module_count: progress.total_module_count,
        }),
      })
    : null;

  return {
    completion,
    progress,
    moduleXp,
    courseXp,
  };
}

async function getCourseById(
  courseId: string,
  client: Client,
): Promise<CourseRow> {
  const { data, error } = await client
    .from("course")
    .select("*")
    .eq("course_id", courseId)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw dbError("getCourseById", error);
  return ensureRow(`course ${courseId}`, data);
}

async function getModuleById(
  moduleId: string,
  client: Client,
): Promise<CourseModuleRow> {
  const { data, error } = await client
    .from("course_module")
    .select("*")
    .eq("module_id", moduleId)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw dbError("getModuleById", error);
  return ensureRow(`module ${moduleId}`, data);
}

async function listCoursesByIds(
  courseIds: string[],
  client: Client,
  label: string,
): Promise<CourseRow[]> {
  if (courseIds.length === 0) return [];
  const { data, error } = await client
    .from("course")
    .select("*")
    .in("course_id", Array.from(new Set(courseIds)));
  if (error) throw dbError(label, error);
  return data ?? [];
}

async function listModulesByIds(
  moduleIds: string[],
  client: Client,
  label: string,
): Promise<CourseModuleRow[]> {
  if (moduleIds.length === 0) return [];
  const { data, error } = await client
    .from("course_module")
    .select("*")
    .in("module_id", Array.from(new Set(moduleIds)));
  if (error) throw dbError(label, error);
  return data ?? [];
}

async function listStandaloneCompletionsForModules(
  userId: string,
  moduleIds: string[],
  client: Client,
): Promise<ModuleCompletionRow[]> {
  if (moduleIds.length === 0) return [];
  const { data, error } = await client
    .from("module_completion")
    .select("*")
    .eq("user_id", userId)
    .in("module_id", moduleIds);
  if (error) {
    throw dbError("listStandaloneCompletionsForModules", error);
  }
  return data ?? [];
}

function getNextModuleFromSyllabus(
  syllabus: CourseSyllabusItem[],
  progress: CourseProgressCache,
): CourseModuleRow | null {
  if (syllabus.length === 0) return null;
  if (!progress.last_module_id) return syllabus[0]?.module ?? null;

  const lastIndex = syllabus.findIndex(
    (item) => item.module_id === progress.last_module_id,
  );
  if (lastIndex < 0) return syllabus[0]?.module ?? null;
  return syllabus[lastIndex + 1]?.module ?? null;
}

export async function getCourseModuleMembership(
  courseId: string,
  moduleId: string,
  client?: Client,
): Promise<CourseModuleInCourseRow | null> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("course_module_in_course")
    .select("*")
    .eq("course_id", courseId)
    .eq("module_id", moduleId)
    .maybeSingle();
  if (error) throw dbError("getCourseModuleMembership", error);
  return data ?? null;
}

async function deriveCourseProgress(
  client: Client,
  userId: string,
  courseId: string,
  knownCourseVersion?: string,
): Promise<CourseProgressCache> {
  const course =
    knownCourseVersion === undefined ? await getCourseById(courseId, client) : null;
  const courseVersion = knownCourseVersion ?? course?.version ?? "";
  const { data: syllabus, error: syllabusError } = await client
    .from("course_module_in_course")
    .select("*")
    .eq("course_id", courseId);
  if (syllabusError) throw dbError("deriveCourseProgress.syllabus", syllabusError);

  const { data: completions, error: completionsError } = await client
    .from("course_module_completion")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId);
  if (completionsError) {
    throw dbError("deriveCourseProgress.completions", completionsError);
  }

  return buildCourseProgressCache({
    courseVersion,
    syllabus: syllabus ?? [],
    completions: completions ?? [],
  });
}
