import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { assertOwner, requireUser } from "@/lib/auth/require-user";
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
export type ModuleCompletionRow =
  Database["public"]["Tables"]["module_completion"]["Row"];
export type ChallengeRow = Database["public"]["Tables"]["challenge"]["Row"];

export type CourseSyllabusItem = CourseModuleInCourseRow & {
  module: CourseModuleRow;
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
  const module = await getModuleById(moduleId, sb);
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
        module_version: module.version,
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
      module_version: module.version,
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
  const [course, module, enrollment, membership] = await Promise.all([
    getCourseById(courseId, sb),
    getModuleById(moduleId, sb),
    getEnrollment(user.id, courseId, sb),
    getCourseModuleMembership(courseId, moduleId, sb),
  ]);

  ensureRow("course enrollment", enrollment);
  ensureRow("course module membership", membership);

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
      module_version: module.version,
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
        module_version: module.version,
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
      module_version: module.version,
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

async function getCourseModuleMembership(
  courseId: string,
  moduleId: string,
  client: Client,
): Promise<CourseModuleInCourseRow | null> {
  const { data, error } = await client
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
