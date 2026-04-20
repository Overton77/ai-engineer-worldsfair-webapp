import { describe, expect, it, vi } from "vitest";

import { getPersonDossier } from "./dossier";

type MockResp<T> = { data: T | null; error: { message: string } | null };

/**
 * Build a chainable Supabase-like mock. Each .from() returns a fresh
 * builder; we register per-table responses by name.
 *
 * Builder implements:
 *   .select(...).eq(...).order(...).limit(...).maybeSingle()
 * .maybeSingle() resolves to a single-row response; otherwise the
 * builder is a thenable that resolves to a list response.
 */
type TableHandler = (calls: BuilderCalls) => unknown;
type BuilderCalls = {
  select: string;
  filters: Array<[string, unknown]>;
  isSingle: boolean;
};

function buildMockClient(
  handlers: Record<string, TableHandler | undefined>,
) {
  function builder(table: string): unknown {
    const calls: BuilderCalls = {
      select: "*",
      filters: [],
      isSingle: false,
    };

    const resolve = () => {
      const handler = handlers[table];
      const data = handler ? handler(calls) : null;
      const wrapped: MockResp<unknown> = { data: data as never, error: null };
      return Promise.resolve(wrapped);
    };

    const builderApi: Record<string, unknown> = {
      select: (s: string) => {
        calls.select = s;
        return builderApi;
      },
      eq: (col: string, v: unknown) => {
        calls.filters.push([col, v]);
        return builderApi;
      },
      order: () => builderApi,
      limit: () => builderApi,
      maybeSingle: () => {
        calls.isSingle = true;
        return resolve();
      },
      then: (onFulfilled: (v: unknown) => unknown) =>
        resolve().then(onFulfilled),
    };
    return builderApi;
  }

  return {
    from: vi.fn((table: string) => builder(table)),
  };
}

describe("getPersonDossier", () => {
  it("returns null when person not found", async () => {
    const sb = buildMockClient({
      person: () => null,
    });
    const out = await getPersonDossier("ghost", sb as never);
    expect(out).toBeNull();
  });

  it("fans out parallel relationship reads and maps to EntitySummary", async () => {
    const personRow = {
      person_id: "p1",
      slug: "ada-lovelace",
      full_name: "Ada Lovelace",
      tag_line: "First programmer",
      role_title: null,
      sessionize_profile_picture_url: null,
      bio: null,
      notable_for: null,
      expertise_tags: ["math", "computing"],
      domain_layer: null,
      updated_at: "2026-04-01",
    };
    const sb = buildMockClient({
      person: () => personRow,
      person_employed_by: () => [
        {
          organization: {
            organization_id: "o1",
            slug: "babbage-inc",
            name: "Babbage Inc",
          },
        },
      ],
      person_founded_organization: () => [],
      person_appeared_in_video: () => [
        {
          video: {
            video_id: "v1",
            slug: "v1",
            title: "Analytical Engine 101",
            thumbnail_url: "https://i.example/v1.jpg",
          },
        },
      ],
      person_presented_at_session: () => [],
      paper_authored_by: () => [
        {
          paper: { slug: "first-program", title: "Notes on the Analytical Engine" },
        },
      ],
      person_attended_event: () => [],
    });

    const out = await getPersonDossier("ada-lovelace", sb as never);
    expect(out).not.toBeNull();
    expect(out!.person.slug).toBe("ada-lovelace");
    expect(out!.employedAt).toHaveLength(1);
    expect(out!.employedAt[0].href).toBe("/o/babbage-inc");
    expect(out!.talks).toHaveLength(1);
    expect(out!.talks[0].href).toBe("/video/v1");
    expect(out!.authoredPapers).toHaveLength(1);
    expect(out!.authoredPapers[0].href).toBe("/paper/first-program");
    expect(out!.founded).toEqual([]);
    expect(out!.presentedSessions).toEqual([]);
    expect(out!.attendedEvents).toEqual([]);
  });

  it("degrades to empty arrays when relationship reads error", async () => {
    const personRow = {
      person_id: "p1",
      slug: "shreya",
      full_name: "Shreya",
      expertise_tags: [],
      updated_at: "2026-04-01",
    };
    // Each relationship table not registered => returns null => maps to []
    const sb = buildMockClient({ person: () => personRow });
    const out = await getPersonDossier("shreya", sb as never);
    expect(out).not.toBeNull();
    expect(out!.employedAt).toEqual([]);
    expect(out!.founded).toEqual([]);
    expect(out!.talks).toEqual([]);
    expect(out!.presentedSessions).toEqual([]);
    expect(out!.authoredPapers).toEqual([]);
    expect(out!.attendedEvents).toEqual([]);
  });
});
