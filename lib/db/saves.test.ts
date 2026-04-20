import { describe, expect, it, vi } from "vitest";

import {
  countSavesByType,
  deleteSave,
  insertSave,
  listSavesForEntities,
  listSavesForUser,
  refKey,
} from "./saves";

type BuilderCalls = {
  table: string;
  select: { what: string; opts?: { count?: string; head?: boolean } } | null;
  filters: Array<[string, string, unknown]>;
  insert: Record<string, unknown> | null;
  delete: boolean;
  range?: [number, number];
  order?: { col: string; ascending: boolean };
};

function buildMock(handlers: Record<string, (c: BuilderCalls) => unknown>) {
  const calls: BuilderCalls[] = [];

  function builder(table: string): unknown {
    const c: BuilderCalls = {
      table,
      select: null,
      filters: [],
      insert: null,
      delete: false,
    };
    calls.push(c);
    const resolve = () => {
      const data = handlers[table]?.(c) ?? null;
      const count = c.select?.opts?.count
        ? Array.isArray(data)
          ? (data as unknown[]).length
          : data === null
            ? 0
            : 1
        : undefined;
      return Promise.resolve({ data, error: null, count });
    };
    const api: Record<string, unknown> = {
      select: (what: string, opts?: { count?: string; head?: boolean }) => {
        c.select = { what, opts };
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
      order: (col: string, opts?: { ascending?: boolean }) => {
        c.order = { col, ascending: opts?.ascending ?? true };
        return api;
      },
      range: (from: number, to: number) => {
        c.range = [from, to];
        return api;
      },
      maybeSingle: () => resolve(),
      single: () => resolve(),
      then: (onFulfilled: (v: unknown) => unknown) => resolve().then(onFulfilled),
    };
    return api;
  }

  return {
    client: { from: vi.fn(builder) } as unknown as Parameters<typeof insertSave>[1],
    calls,
  };
}

describe("saves DAL", () => {
  it("refKey produces the canonical kind:id string", () => {
    expect(refKey({ kind: "person", id: "uuid-1" })).toBe("person:uuid-1");
  });

  it("listSavesForEntities returns only the requested (kind,id) pairs", async () => {
    const { client } = buildMock({
      saved_items: () => [
        { entity_type: "person", entity_id: "p1" },
        // intentional noise — same id, different type
        { entity_type: "library", entity_id: "p1" },
        { entity_type: "person", entity_id: "p2" },
      ],
    });
    const set = await listSavesForEntities(
      "user-1",
      [
        { kind: "person", id: "p1" },
        { kind: "person", id: "p2" },
      ],
      client,
    );
    expect(set.has("person:p1")).toBe(true);
    expect(set.has("person:p2")).toBe(true);
    expect(set.has("library:p1")).toBe(false); // filtered out
    expect(set.size).toBe(2);
  });

  it("listSavesForEntities short-circuits on empty refs", async () => {
    const { client, calls } = buildMock({});
    const set = await listSavesForEntities("user-1", [], client);
    expect(set.size).toBe(0);
    expect(calls.length).toBe(0); // no DB call
  });

  it("insertSave nulls subtitle when omitted", async () => {
    const { client, calls } = buildMock({
      saved_items: (c) => ({ id: "new", ...c.insert }),
    });
    const row = await insertSave(
      {
        user_id: "u",
        entity_type: "library",
        entity_id: "agenta",
        entity_title: "Agenta",
      },
      client,
    );
    expect(row).toMatchObject({
      entity_type: "library",
      entity_id: "agenta",
      entity_subtitle: null,
    });
    expect(calls[0].insert).toMatchObject({ entity_subtitle: null });
  });

  it("deleteSave filters by user, type, and id", async () => {
    const { client, calls } = buildMock({
      saved_items: () => null,
    });
    await deleteSave(
      { userId: "u", kind: "paper", id: "gepa-2024" },
      client,
    );
    expect(calls[0].delete).toBe(true);
    expect(calls[0].filters).toContainEqual(["user_id", "eq", "u"]);
    expect(calls[0].filters).toContainEqual(["entity_type", "eq", "paper"]);
    expect(calls[0].filters).toContainEqual(["entity_id", "eq", "gepa-2024"]);
  });

  it("listSavesForUser clamps limit to 100 and orders by recency by default", async () => {
    const rows = [{ id: "1", entity_type: "person", entity_id: "p" }];
    const { client, calls } = buildMock({ saved_items: () => rows });
    const out = await listSavesForUser(
      { userId: "u", limit: 9999 },
      client,
    );
    expect(out.rows).toEqual(rows);
    expect(calls[0].range).toEqual([0, 99]);
    expect(calls[0].order).toEqual({ col: "created_at", ascending: false });
  });

  it("listSavesForUser supports alpha sort", async () => {
    const { client, calls } = buildMock({ saved_items: () => [] });
    await listSavesForUser({ userId: "u", sort: "alpha" }, client);
    expect(calls[0].order).toEqual({
      col: "entity_title",
      ascending: true,
    });
  });

  it("countSavesByType folds rows into a per-type tally", async () => {
    const { client } = buildMock({
      saved_items: () => [
        { entity_type: "person" },
        { entity_type: "person" },
        { entity_type: "library" },
      ],
    });
    const out = await countSavesByType("u", client);
    expect(out).toEqual({ person: 2, library: 1 });
  });
});
