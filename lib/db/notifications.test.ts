import { describe, expect, it, vi } from "vitest";

import {
  insertNotification,
  listRecent,
  listUnreadCount,
  markRead,
} from "./notifications";

type Resp<T> = { data: T | null; error: { message: string } | null; count?: number };

type BuilderCalls = {
  table: string;
  select: string | null;
  selectOptions: { count?: string; head?: boolean } | null;
  filters: Array<[string, string, unknown]>;
  update: Record<string, unknown> | null;
  insert: Record<string, unknown> | null;
  order?: { col: string; ascending: boolean };
  limit?: number;
  isSingle: boolean;
};

/**
 * Minimal chainable mock: every method returns `this`, terminal
 * methods (`single`, `then`) resolve. We assert against the registered
 * handler call list to verify the right filters were applied.
 */
function buildMock(
  handlers: Record<string, (b: BuilderCalls) => unknown>,
) {

  const calls: BuilderCalls[] = [];

  function builder(table: string): unknown {
    const c: BuilderCalls = {
      table,
      select: null,
      selectOptions: null,
      filters: [],
      update: null,
      insert: null,
      isSingle: false,
    };
    calls.push(c);

    const resolve = (): Promise<Resp<unknown>> => {
      const handler = handlers[table];
      const data = handler ? handler(c) : null;
      const r: Resp<unknown> = {
        data: data as never,
        error: null,
        count: c.selectOptions?.count
          ? Array.isArray(data)
            ? (data as unknown[]).length
            : data === null
              ? 0
              : 1
          : undefined,
      };
      return Promise.resolve(r);
    };

    const api: Record<string, unknown> = {
      select: (s: string, opts?: { count?: string; head?: boolean }) => {
        c.select = s;
        c.selectOptions = opts ?? null;
        return api;
      },
      insert: (row: Record<string, unknown>) => {
        c.insert = row;
        return api;
      },
      update: (row: Record<string, unknown>) => {
        c.update = row;
        return api;
      },
      eq: (col: string, v: unknown) => {
        c.filters.push([col, "eq", v]);
        return api;
      },
      is: (col: string, v: unknown) => {
        c.filters.push([col, "is", v]);
        return api;
      },
      order: (col: string, opts?: { ascending?: boolean }) => {
        c.order = { col, ascending: opts?.ascending ?? true };
        return api;
      },
      limit: (n: number) => {
        c.limit = n;
        return api;
      },
      single: () => {
        c.isSingle = true;
        return resolve();
      },
      then: (onFulfilled: (v: unknown) => unknown) => resolve().then(onFulfilled),
    };
    return api;
  }

  return {
    client: { from: vi.fn(builder) } as unknown as Parameters<typeof listUnreadCount>[1],
    calls,
  };
}

describe("notifications DAL", () => {
  it("listUnreadCount returns the count from a head:true select", async () => {
    const { client, calls } = buildMock({
      notification: () => [],
    });
    const n = await listUnreadCount("user-1", client);
    expect(n).toBe(0);
    expect(calls[0].table).toBe("notification");
    expect(calls[0].selectOptions).toEqual({ count: "exact", head: true });
    expect(calls[0].filters).toContainEqual(["user_id", "eq", "user-1"]);
    expect(calls[0].filters).toContainEqual(["read_at", "is", null]);
  });

  it("listRecent orders by created_at desc and clamps the limit to 100", async () => {
    const rows = [{ id: "n1", title: "Hi" }];
    const { client, calls } = buildMock({
      notification: () => rows,
    });
    const out = await listRecent("user-2", 9999, client);
    expect(out).toEqual(rows);
    expect(calls[0].order).toEqual({ col: "created_at", ascending: false });
    expect(calls[0].limit).toBe(100);
  });

  it("insertNotification fills nullable fields with explicit nulls", async () => {
    const { client, calls } = buildMock({
      notification: (c) => ({ id: "new", ...c.insert }),
    });
    const out = await insertNotification(
      {
        user_id: "user-3",
        kind: "follow_created",
        title: "Following Shreya",
        url: "/p/shreya",
        ref_kind: "person",
        ref_id: "shreya",
      },
      client,
    );
    expect(out).toMatchObject({
      id: "new",
      user_id: "user-3",
      kind: "follow_created",
      ref_kind: "person",
      ref_id: "shreya",
      url: "/p/shreya",
      body: null,
    });
  });

  it("markRead('all') updates only unread rows for this user", async () => {
    const { client, calls } = buildMock({
      notification: () => [{ id: "a" }, { id: "b" }],
    });
    const out = await markRead("all", "user-4", client);
    expect(out.updated).toBe(2);
    const filters = calls[0].filters;
    expect(filters).toContainEqual(["user_id", "eq", "user-4"]);
    expect(filters).toContainEqual(["read_at", "is", null]);
    // No id filter when 'all'
    expect(filters.find((f) => f[0] === "id")).toBeUndefined();
    expect(calls[0].update).toMatchObject({ read_at: expect.any(String) });
  });

  it("markRead(id) adds the id filter", async () => {
    const { client, calls } = buildMock({
      notification: () => [{ id: "abc" }],
    });
    const out = await markRead("abc", "user-5", client);
    expect(out.updated).toBe(1);
    expect(calls[0].filters).toContainEqual(["id", "eq", "abc"]);
  });
});
