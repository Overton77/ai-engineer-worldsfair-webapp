import { describe, expect, it, vi } from "vitest";

import {
  countFollowsByKind,
  deleteFollow,
  followKey,
  insertFollow,
  listFollowsForEntities,
} from "./follows";

type BuilderCalls = {
  table: string;
  filters: Array<[string, string, unknown]>;
  insert: Record<string, unknown> | null;
  delete: boolean;
  selectOpts: { count?: string; head?: boolean } | null;
};

function buildMock(handlers: Record<string, (c: BuilderCalls) => unknown>) {
  const calls: BuilderCalls[] = [];
  function builder(table: string): unknown {
    const c: BuilderCalls = {
      table,
      filters: [],
      insert: null,
      delete: false,
      selectOpts: null,
    };
    calls.push(c);
    const resolve = () => {
      const data = handlers[table]?.(c) ?? null;
      const count = c.selectOpts?.count
        ? Array.isArray(data)
          ? (data as unknown[]).length
          : data === null
            ? 0
            : 1
        : undefined;
      return Promise.resolve({ data, error: null, count });
    };
    const api: Record<string, unknown> = {
      select: (_: string, opts?: { count?: string; head?: boolean }) => {
        c.selectOpts = opts ?? null;
        return api;
      },
      insert: (row: Record<string, unknown>) => {
        c.insert = row;
        return api;
      },
      delete: () => {
        c.delete = true;
        return api;
      },
      eq: (col: string, v: unknown) => {
        c.filters.push([col, "eq", v]);
        return api;
      },
      in: (col: string, v: unknown) => {
        c.filters.push([col, "in", v]);
        return api;
      },
      maybeSingle: () => resolve(),
      single: () => resolve(),
      order: () => api,
      range: () => api,
      then: (onFulfilled: (v: unknown) => unknown) => resolve().then(onFulfilled),
    };
    return api;
  }
  return {
    client: { from: vi.fn(builder) } as unknown as Parameters<typeof insertFollow>[1],
    calls,
  };
}

describe("follows DAL", () => {
  it("followKey produces kind:id", () => {
    expect(followKey({ kind: "person", id: "u" })).toBe("person:u");
  });

  it("listFollowsForEntities short-circuits on empty refs", async () => {
    const { client, calls } = buildMock({});
    const set = await listFollowsForEntities("user-1", [], client);
    expect(set.size).toBe(0);
    expect(calls.length).toBe(0);
  });

  it("listFollowsForEntities filters returned cross-pairs to wanted set", async () => {
    const { client } = buildMock({
      profile_followed_entity: () => [
        { entity_kind: "person", entity_id: "x" },
        { entity_kind: "person", entity_id: "y" },
        { entity_kind: "library", entity_id: "x" }, // noise
      ],
    });
    const set = await listFollowsForEntities(
      "u",
      [
        { kind: "person", id: "x" },
        { kind: "library", id: "y" },
      ],
      client,
    );
    expect(set.has("person:x")).toBe(true);
    expect(set.has("library:y")).toBe(false);
    expect(set.size).toBe(1);
  });

  it("insertFollow writes kind+id and returns the row", async () => {
    const { client, calls } = buildMock({
      profile_followed_entity: (c) => ({ created_at: "now", ...c.insert }),
    });
    const row = await insertFollow(
      { user_id: "u", entity_kind: "category", entity_id: "agents" },
      client,
    );
    expect(row).toMatchObject({
      user_id: "u",
      entity_kind: "category",
      entity_id: "agents",
    });
    expect(calls[0].insert).toMatchObject({
      entity_kind: "category",
      entity_id: "agents",
    });
  });

  it("deleteFollow uses the composite key for the WHERE clause", async () => {
    const { client, calls } = buildMock({
      profile_followed_entity: () => null,
    });
    await deleteFollow(
      { userId: "u", kind: "domain_layer", id: "L5" },
      client,
    );
    expect(calls[0].delete).toBe(true);
    expect(calls[0].filters).toContainEqual(["user_id", "eq", "u"]);
    expect(calls[0].filters).toContainEqual(["entity_kind", "eq", "domain_layer"]);
    expect(calls[0].filters).toContainEqual(["entity_id", "eq", "L5"]);
  });

  it("countFollowsByKind folds rows into a per-kind tally", async () => {
    const { client } = buildMock({
      profile_followed_entity: () => [
        { entity_kind: "person" },
        { entity_kind: "person" },
        { entity_kind: "category" },
      ],
    });
    const out = await countFollowsByKind("u", client);
    expect(out).toEqual({ person: 2, category: 1 });
  });
});
