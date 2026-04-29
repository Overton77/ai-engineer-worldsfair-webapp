import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import {
  completeCourseModule,
  completeStandaloneModule,
  getCourseSyllabus,
  listLearnerHub,
  listCourseModuleCompletions,
  listCourseModulePrerequisites,
  listPublishedCourseCatalog,
  listPublishedCourses,
  listPublishedModuleCatalog,
  type ChallengeRow,
  type CourseEnrollmentRow,
  type CourseModuleCompletionRow,
  type CourseModuleInCourseRow,
  type CourseModulePrerequisiteRow,
  type CourseModuleRow,
  type CourseRow,
  type ModuleCompletionRow,
  type ModuleUsesArtifactRow,
} from "./learn";
import {
  awardCourseCompletionXp,
  awardModuleCompletionXp,
} from "./xp";

vi.mock("@/lib/auth/require-user", () => ({
  assertOwner: vi.fn((actorId: string, rowOwnerId: string) => {
    if (actorId !== rowOwnerId) throw new Error("forbidden");
  }),
  requireUser: vi.fn(async () => ({ id: "user-1" })),
}));

vi.mock("./xp", () => ({
  awardModuleCompletionXp: vi.fn(async () => ({
    awarded: true,
    scoreEventId: "module-xp",
    points: 25,
  })),
  awardCourseCompletionXp: vi.fn(async () => ({
    awarded: true,
    scoreEventId: "course-xp",
    points: 100,
  })),
}));

type Tables = Database["public"]["Tables"];
type TableName = keyof Tables;
type RowFor<T extends TableName> = Tables[T]["Row"];
type TestClient = SupabaseClient<Database>;
type State = {
  course: CourseRow[];
  course_module: CourseModuleRow[];
  course_module_in_course: CourseModuleInCourseRow[];
  course_module_requires: CourseModulePrerequisiteRow[];
  course_enrollment: CourseEnrollmentRow[];
  module_completion: ModuleCompletionRow[];
  course_module_completion: CourseModuleCompletionRow[];
  module_uses_artifact: ModuleUsesArtifactRow[];
  challenge: ChallengeRow[];
};

type QueryCall = {
  table: string;
  filters: Array<[string, "eq" | "in", unknown]>;
  upsert?: Record<string, unknown>;
  update?: Record<string, unknown>;
};

function course(overrides: Partial<CourseRow> = {}): CourseRow {
  return {
    authors: [],
    capstone_challenge_id: null,
    course_id: "course-1",
    created_at: "2026-04-27T00:00:00.000Z",
    domain_bucket: "agent_orchestration",
    domain_layer: null,
    embedding: null,
    est_hours: 1,
    fts: null,
    is_latest_published: true,
    metadata: {},
    narrative_md: null,
    search_text: null,
    slug: "agent-course",
    status: "published",
    summary: "Course summary",
    title: "Agent Course",
    updated_at: "2026-04-27T00:00:00.000Z",
    version: "1.0.0",
    ...overrides,
  };
}

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
    title: "Module 1",
    updated_at: "2026-04-27T00:00:00.000Z",
    version: "1.0.0",
    ...overrides,
  };
}

function membership(
  overrides: Partial<CourseModuleInCourseRow> = {},
): CourseModuleInCourseRow {
  return {
    course_id: "course-1",
    created_at: "2026-04-27T00:00:00.000Z",
    module_id: "module-1",
    ord: 0,
    pinned_version: null,
    role: "core",
    ...overrides,
  };
}

function enrollment(
  overrides: Partial<CourseEnrollmentRow> = {},
): CourseEnrollmentRow {
  return {
    completed_at: null,
    course_id: "course-1",
    progress: {},
    started_at: "2026-04-27T00:00:00.000Z",
    user_id: "user-1",
    ...overrides,
  };
}

function courseCompletion(
  overrides: Partial<CourseModuleCompletionRow> = {},
): CourseModuleCompletionRow {
  return {
    attempts: 1,
    completed_at: "2026-04-27T00:00:00.000Z",
    course_id: "course-1",
    course_version: "1.0.0",
    metadata: {},
    module_id: "module-1",
    module_version: "1.0.0",
    quiz_responses: [],
    quiz_score: null,
    time_spent_seconds: null,
    user_id: "user-1",
    ...overrides,
  };
}

function moduleUse(
  overrides: Partial<ModuleUsesArtifactRow> = {},
): ModuleUsesArtifactRow {
  return {
    artifact_id: "asset-1",
    artifact_kind: "learning_asset",
    chunk_id: null,
    created_at: "2026-04-27T00:00:00.000Z",
    module_id: "module-1",
    ord: 0,
    role: "source",
    ...overrides,
  };
}

function emptyState(overrides: Partial<State> = {}): State {
  return {
    course: [],
    course_module: [],
    course_module_in_course: [],
    course_module_requires: [],
    course_enrollment: [],
    module_completion: [],
    course_module_completion: [],
    module_uses_artifact: [],
    challenge: [],
    ...overrides,
  };
}

function defaultRow(table: TableName, row: Record<string, unknown>) {
  if (table === "course_enrollment") {
    return {
      completed_at: null,
      started_at: "2026-04-27T00:00:00.000Z",
      progress: {},
      ...row,
    };
  }
  if (table === "module_completion") {
    return {
      completed_at: "2026-04-27T00:00:00.000Z",
      attempts: 1,
      quiz_responses: [],
      quiz_score: null,
      time_spent_seconds: null,
      ...row,
    };
  }
  if (table === "course_module_completion") {
    return {
      completed_at: "2026-04-27T00:00:00.000Z",
      attempts: 1,
      quiz_responses: [],
      quiz_score: null,
      time_spent_seconds: null,
      metadata: {},
      ...row,
    };
  }
  return row;
}

function buildClient(state: State) {
  const calls: QueryCall[] = [];

  function builder<T extends TableName>(table: T): unknown {
    const call: QueryCall = { table, filters: [] };
    calls.push(call);
    let orderSpec: { col: string; ascending: boolean } | null = null;
    let limitCount: number | null = null;
    let upsertRow: Record<string, unknown> | null = null;
    let upsertConflict: string[] = [];
    let updateRow: Record<string, unknown> | null = null;

    const rows = () => state[table as keyof State] as RowFor<T>[];
    const matches = (row: Record<string, unknown>) =>
      call.filters.every(([col, op, value]) => {
        if (op === "eq") return row[col] === value;
        return Array.isArray(value) && value.includes(row[col]);
      });
    const filtered = () => {
      let out = rows().filter((row) => matches(row as Record<string, unknown>));
      if (orderSpec) {
        const order = orderSpec;
        out = out
          .slice()
          .sort((a, b) => {
            const av = String((a as Record<string, unknown>)[order.col] ?? "");
            const bv = String((b as Record<string, unknown>)[order.col] ?? "");
            return order.ascending
              ? av.localeCompare(bv)
              : bv.localeCompare(av);
          });
      }
      return limitCount === null ? out : out.slice(0, limitCount);
    };
    const resolve = () => {
      if (upsertRow) {
        call.upsert = upsertRow;
        const allRows = rows() as unknown as Record<string, unknown>[];
        const existing = allRows.find((row) =>
          upsertConflict.every((col) => row[col] === upsertRow?.[col]),
        );
        const next = defaultRow(table, upsertRow);
        if (existing) {
          Object.assign(existing, next);
          return Promise.resolve({ data: existing, error: null });
        }
        allRows.push(next);
        return Promise.resolve({ data: next, error: null });
      }
      if (updateRow) {
        call.update = updateRow;
        for (const row of rows() as unknown as Record<string, unknown>[]) {
          if (matches(row)) Object.assign(row, updateRow);
        }
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve({ data: filtered(), error: null });
    };
    const api: Record<string, unknown> = {
      select: () => api,
      eq: (col: string, value: unknown) => {
        call.filters.push([col, "eq", value]);
        return api;
      },
      in: (col: string, value: unknown[]) => {
        call.filters.push([col, "in", value]);
        return api;
      },
      order: (col: string, opts?: { ascending?: boolean }) => {
        orderSpec = { col, ascending: opts?.ascending ?? true };
        return api;
      },
      limit: (count: number) => {
        limitCount = count;
        return api;
      },
      upsert: (row: Record<string, unknown>, opts?: { onConflict?: string }) => {
        upsertRow = row;
        upsertConflict = opts?.onConflict?.split(",") ?? [];
        return api;
      },
      update: (row: Record<string, unknown>) => {
        updateRow = row;
        return api;
      },
      maybeSingle: () =>
        resolve().then(({ data, error }) => ({
          data: Array.isArray(data) ? data[0] ?? null : data,
          error,
        })),
      single: () =>
        resolve().then(({ data, error }) => ({
          data: Array.isArray(data) ? data[0] ?? null : data,
          error,
        })),
      then: (onFulfilled: (value: unknown) => unknown) =>
        resolve().then(onFulfilled),
    };
    return api;
  }

  return {
    client: { from: vi.fn(builder) } as unknown as TestClient,
    calls,
  };
}

describe("learner data layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists only latest published courses in title order", async () => {
    const state = emptyState({
      course: [
        course({ course_id: "draft", title: "Draft", status: "draft" }),
        course({ course_id: "old", title: "Old", is_latest_published: false }),
        course({ course_id: "b", title: "Beta" }),
        course({ course_id: "a", title: "Alpha" }),
      ],
    });
    const { client } = buildClient(state);

    const rows = await listPublishedCourses({ client });

    expect(rows.map((row) => row.title)).toEqual(["Alpha", "Beta"]);
  });

  it("builds course catalog summaries from published course modules", async () => {
    const state = emptyState({
      course: [course({ course_id: "course-1", title: "Agent Course" })],
      course_module_in_course: [
        membership({ course_id: "course-1", module_id: "module-1" }),
        membership({ course_id: "course-1", module_id: "module-2", ord: 1 }),
      ],
      course_module: [
        moduleRow({ module_id: "module-1", duration_min: 15 }),
        moduleRow({ module_id: "module-2", duration_min: 25 }),
      ],
    });
    const { client } = buildClient(state);

    const rows = await listPublishedCourseCatalog({ client });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      course: { title: "Agent Course" },
      moduleCount: 2,
      durationMinutes: 40,
    });
  });

  it("builds module catalog summaries with source counts and standalone completion", async () => {
    const state = emptyState({
      course_module: [
        moduleRow({ module_id: "module-1", title: "First" }),
        moduleRow({ module_id: "module-2", title: "Second" }),
      ],
      module_uses_artifact: [
        moduleUse({ module_id: "module-1", artifact_id: "asset-1" }),
        moduleUse({ module_id: "module-1", artifact_id: "asset-2" }),
        moduleUse({ module_id: "module-2", artifact_id: "asset-3" }),
      ],
      module_completion: [
        {
          attempts: 1,
          completed_at: "2026-04-27T00:00:00.000Z",
          module_id: "module-1",
          module_version: "1.0.0",
          quiz_responses: [],
          quiz_score: null,
          time_spent_seconds: null,
          user_id: "user-1",
        },
      ],
    });
    const { client } = buildClient(state);

    const rows = await listPublishedModuleCatalog({ userId: "user-1", client });

    expect(rows.map((row) => [row.module.title, row.sourceCount])).toEqual([
      ["First", 2],
      ["Second", 1],
    ]);
    expect(rows[0].completion?.module_id).toBe("module-1");
    expect(rows[1].completion).toBeNull();
  });

  it("shapes course syllabus in course order", async () => {
    const state = emptyState({
      course_module_in_course: [
        membership({ module_id: "module-2", ord: 1 }),
        membership({ module_id: "module-1", ord: 0 }),
      ],
      course_module: [
        moduleRow({ module_id: "module-1", title: "First" }),
        moduleRow({ module_id: "module-2", title: "Second" }),
      ],
    });
    const { client } = buildClient(state);

    const rows = await getCourseSyllabus("course-1", client);

    expect(rows.map((row) => row.module.title)).toEqual(["First", "Second"]);
  });

  it("lists course module completions for one learner course", async () => {
    const state = emptyState({
      course_module_completion: [
        courseCompletion({ module_id: "module-1" }),
        courseCompletion({ course_id: "course-2", module_id: "module-2" }),
        courseCompletion({ user_id: "user-2", module_id: "module-3" }),
      ],
    });
    const { client } = buildClient(state);

    const rows = await listCourseModuleCompletions("user-1", "course-1", client);

    expect(rows).toHaveLength(1);
    expect(rows[0].module_id).toBe("module-1");
  });

  it("lists soft prerequisite module labels", async () => {
    const state = emptyState({
      course_module_requires: [
        {
          created_at: "2026-04-27T00:00:00.000Z",
          module_id: "module-2",
          prereq_module_id: "module-1",
        },
      ],
      course_module: [
        moduleRow({ module_id: "module-1", title: "Agent Skills 101" }),
      ],
    });
    const { client } = buildClient(state);

    const rows = await listCourseModulePrerequisites(["module-2"], client);

    expect(rows).toHaveLength(1);
    expect(rows[0].prereqModule.title).toBe("Agent Skills 101");
  });

  it("builds the learner hub from course-context progress and standalone history", async () => {
    const state = emptyState({
      course: [course({ title: "Agent Course" })],
      course_enrollment: [enrollment()],
      course_module_in_course: [
        membership({ module_id: "module-1", ord: 0 }),
        membership({ module_id: "module-2", ord: 1 }),
      ],
      course_module: [
        moduleRow({ module_id: "module-1", title: "Intro" }),
        moduleRow({ module_id: "module-2", title: "Next" }),
        moduleRow({
          module_id: "standalone-1",
          slug: "standalone",
          title: "Standalone",
        }),
      ],
      course_module_completion: [courseCompletion({ module_id: "module-1" })],
      module_completion: [
        {
          attempts: 1,
          completed_at: "2026-04-28T00:00:00.000Z",
          module_id: "standalone-1",
          module_version: "1.0.0",
          quiz_responses: [],
          quiz_score: null,
          time_spent_seconds: null,
          user_id: "user-1",
        },
      ],
    });
    const { client } = buildClient(state);

    const hub = await listLearnerHub("user-1", { client });

    expect(hub.activeCourses).toHaveLength(1);
    expect(hub.activeCourses[0].progress).toMatchObject({
      completed_module_count: 1,
      total_module_count: 2,
      percent: 50,
    });
    expect(hub.activeCourses[0].nextModule?.title).toBe("Next");
    expect(hub.recentStandaloneModules[0].module.title).toBe("Standalone");
  });

  it("writes standalone completion only to module_completion and awards module XP", async () => {
    const state = emptyState({
      course_module: [moduleRow({ module_id: "module-1", version: "2.0.0" })],
    });
    const { client } = buildClient(state);

    const result = await completeStandaloneModule(
      "module-1",
      { quizScore: 0.9, metadata: { xp: 40 } },
      client,
    );

    expect(result.completion.module_version).toBe("2.0.0");
    expect(state.module_completion).toHaveLength(1);
    expect(state.course_module_completion).toHaveLength(0);
    expect(awardModuleCompletionXp).toHaveBeenCalledWith({
      userId: "user-1",
      moduleId: "module-1",
      metadata: {
        xp: 40,
        completion_context: "standalone",
        module_version: "2.0.0",
        quiz_score: 0.9,
      },
    });
    expect(awardCourseCompletionXp).not.toHaveBeenCalled();
  });

  it("writes course-context completion, recomputes course progress, and awards course XP only when newly complete", async () => {
    const state = emptyState({
      course: [course({ version: "1.0.0", metadata: { xp: 100 } })],
      course_module: [
        moduleRow({ module_id: "module-1", version: "1.0.0" }),
        moduleRow({ module_id: "module-2", title: "Module 2", version: "1.2.0" }),
      ],
      course_module_in_course: [
        membership({ module_id: "module-1", ord: 0, role: "core" }),
        membership({ module_id: "module-2", ord: 1, role: "core" }),
        membership({ module_id: "module-optional", ord: 2, role: "optional" }),
      ],
      course_enrollment: [enrollment()],
      module_completion: [
        {
          attempts: 1,
          completed_at: "2026-04-27T00:00:00.000Z",
          module_id: "module-2",
          module_version: "1.2.0",
          quiz_responses: [],
          quiz_score: 1,
          time_spent_seconds: null,
          user_id: "user-1",
        },
      ],
      course_module_completion: [courseCompletion({ module_id: "module-1" })],
    });
    const { client } = buildClient(state);

    const result = await completeCourseModule(
      "course-1",
      "module-2",
      { quizScore: 0.8, timeSpentSeconds: 180 },
      client,
    );

    expect(state.course_module_completion).toHaveLength(2);
    expect(state.module_completion).toHaveLength(1);
    expect(result.completion).toMatchObject({
      course_id: "course-1",
      module_id: "module-2",
      course_version: "1.0.0",
      module_version: "1.2.0",
      quiz_score: 0.8,
      time_spent_seconds: 180,
    });
    expect(result.progress).toMatchObject({
      completed_module_count: 2,
      total_module_count: 2,
      percent: 100,
      course_version: "1.0.0",
    });
    expect(state.course_enrollment[0].completed_at).toBe(
      "2026-04-27T00:00:00.000Z",
    );
    expect(awardModuleCompletionXp).toHaveBeenCalledWith({
      userId: "user-1",
      moduleId: "module-2",
      metadata: {
        completion_context: "course",
        course_id: "course-1",
        course_version: "1.0.0",
        module_version: "1.2.0",
        quiz_score: 0.8,
      },
    });
    expect(awardCourseCompletionXp).toHaveBeenCalledWith({
      userId: "user-1",
      courseId: "course-1",
      metadata: {
        course_version: "1.0.0",
        completed_module_count: 2,
        total_module_count: 2,
      },
    });
  });

  it("does not award course XP again when a repeat write updates completion details", async () => {
    const state = emptyState({
      course: [course()],
      course_module: [moduleRow({ module_id: "module-1" })],
      course_module_in_course: [membership({ module_id: "module-1" })],
      course_enrollment: [enrollment()],
      course_module_completion: [
        courseCompletion({
          module_id: "module-1",
          quiz_responses: [{ q_id: "q1", chosen: "a" }],
          quiz_score: 0.7,
          time_spent_seconds: 120,
        }),
      ],
    });
    const { client } = buildClient(state);

    const result = await completeCourseModule(
      "course-1",
      "module-1",
      { quizScore: 0.95 },
      client,
    );

    expect(result.completion.quiz_score).toBe(0.95);
    expect(result.completion.quiz_responses).toEqual([
      { q_id: "q1", chosen: "a" },
    ]);
    expect(result.completion.time_spent_seconds).toBe(120);
    expect(state.course_module_completion).toHaveLength(1);
    expect(result.courseXp).toBeNull();
    expect(awardModuleCompletionXp).toHaveBeenCalledTimes(1);
    expect(awardCourseCompletionXp).not.toHaveBeenCalled();
  });

  it("does not count old course-version completions toward current course progress", async () => {
    const state = emptyState({
      course: [course({ version: "2.0.0" })],
      course_module: [
        moduleRow({ module_id: "module-1", version: "2.0.0" }),
        moduleRow({ module_id: "module-2", title: "Module 2", version: "2.0.0" }),
      ],
      course_module_in_course: [
        membership({ module_id: "module-1", ord: 0 }),
        membership({ module_id: "module-2", ord: 1 }),
      ],
      course_enrollment: [enrollment()],
      course_module_completion: [
        courseCompletion({
          module_id: "module-1",
          course_version: "1.0.0",
          module_version: "1.0.0",
        }),
      ],
    });
    const { client } = buildClient(state);

    const result = await completeCourseModule("course-1", "module-2", {}, client);

    expect(result.progress).toMatchObject({
      completed_module_count: 1,
      total_module_count: 2,
      percent: 50,
      course_version: "2.0.0",
    });
    expect(awardCourseCompletionXp).not.toHaveBeenCalled();
  });
});
