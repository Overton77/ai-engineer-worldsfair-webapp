import { describe, expect, it, vi } from "vitest";

import {
  countNotesForEntity,
  deleteNote,
  listNotesForEntity,
  listNotesForUser,
  upsertNote,
} from "./notes";
import type { NoteDoc } from "@/lib/notes/types";

type BuilderCalls = {
  table: string;
  filters: Array<[string, string, unknown]>;
  textSearch: { col: string; q: string; opts?: unknown } | null;
  or: string | null;
  insert: Record<string, unknown> | null;
  update: Record<string, unknown> | null;
  delete: boolean;
  selectOpts: { count?: string; head?: boolean } | null;
  order?: { col: string; ascending: boolean };
  range?: [number, number];
  limit?: number;
};

function buildMock(handlers: Record<string, (c: BuilderCalls) => unknown>) {
  const calls: BuilderCalls[] = [];
  function builder(table: string): unknown {
    const c: BuilderCalls = {
      table,
      filters: [],
      textSearch: null,
      or: null,
      insert: null,
      update: null,
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
      update: (row: Record<string, unknown>) => {
        c.update = row;
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
      is: (col: string, v: unknown) => {
        c.filters.push([col, "is", v]);
        return api;
      },
      textSearch: (col: string, q: string, opts: unknown) => {
        c.textSearch = { col, q, opts };
        return api;
      },
      or: (filters: string) => {
        c.or = filters;
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
      limit: (n: number) => {
        c.limit = n;
        return api;
      },
      maybeSingle: () => resolve(),
      single: () => resolve(),
      then: (onFulfilled: (v: unknown) => unknown) => resolve().then(onFulfilled),
    };
    return api;
  }
  return {
    client: { from: vi.fn(builder) } as unknown as Parameters<typeof upsertNote>[1],
    calls,
  };
}

const SAMPLE_DOC: NoteDoc = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Watch " },
        { type: "timestampMention", attrs: { videoId: "v1", seconds: 842 } },
        { type: "text", text: " for calibration." },
      ],
    },
  ],
};

describe("notes DAL", () => {
  it("upsertNote(insert) derives content_text and writes pin fields", async () => {
    const { client, calls } = buildMock({
      notes: (c) => ({ id: "n1", ...c.insert, updated_at: "now" }),
    });
    const row = await upsertNote(
      {
        user_id: "u",
        title: "Test",
        contentJson: SAMPLE_DOC,
        pin: { kind: "youtube_video", id: "v1", title: "Vid" },
      },
      client,
    );
    expect(row).toMatchObject({
      id: "n1",
      title: "Test",
      entity_type: "youtube_video",
      entity_id: "v1",
      entity_title: "Vid",
    });
    // Server-derived content_text includes the timestamp as MM:SS.
    expect(calls[0].insert?.content_text).toBe("Watch 14:02 for calibration.");
  });

  it("upsertNote(update) routes through update path with id+user filter", async () => {
    const { client, calls } = buildMock({
      notes: (c) => ({ id: "n1", ...c.update, updated_at: "now" }),
    });
    await upsertNote(
      {
        id: "n1",
        user_id: "u",
        title: "  ",
        contentJson: SAMPLE_DOC,
      },
      client,
    );
    expect(calls[0].update).toBeTruthy();
    expect(calls[0].update?.title).toBe("Untitled"); // trimmed empty → fallback
    expect(calls[0].update?.entity_type).toBeNull();
    expect(calls[0].filters).toContainEqual(["id", "eq", "n1"]);
    expect(calls[0].filters).toContainEqual(["user_id", "eq", "u"]);
  });

  it("listNotesForUser OR-searches FTS + ILIKE on title/content_text/entity_title when q is set", async () => {
    const rows = [
      {
        id: "n1",
        title: "GEPA notes",
        content_text: "Watch 14:02 for calibration.",
        entity_type: "youtube_video",
        entity_id: "v1",
        entity_title: "Vid",
        updated_at: "now",
        created_at: "earlier",
      },
    ];
    const { client, calls } = buildMock({ notes: () => rows });
    const out = await listNotesForUser(
      { userId: "u", q: "calibration" },
      client,
    );
    expect(out.total).toBe(1);
    expect(out.rows[0].preview).toContain("14:02");
    expect(calls[0].textSearch).toBeNull();
    expect(calls[0].or).toContain(`fts.wfts(english)."calibration"`);
    expect(calls[0].or).toContain(`title.ilike."%calibration%"`);
    expect(calls[0].or).toContain(`content_text.ilike."%calibration%"`);
    expect(calls[0].or).toContain(`entity_title.ilike."%calibration%"`);
  });

  it("listNotesForUser escapes ILIKE wildcards and strips embedded quotes", async () => {
    const { client, calls } = buildMock({ notes: () => [] });
    await listNotesForUser(
      { userId: "u", q: `50% "off"_sale` },
      client,
    );
    // `%` and `_` must be escaped so the literal characters are matched,
    // and embedded double quotes are stripped (the value is wrapped in
    // double quotes to survive commas/parens in PostgREST `or`).
    expect(calls[0].or).toContain(`title.ilike.`);
    expect(calls[0].or).toContain(`\\%`);
    expect(calls[0].or).toContain(`\\_`);
    expect(calls[0].or).not.toContain(`"off"_sale`);
  });

  it("listNotesForEntity filters on (kind, id)", async () => {
    const { client, calls } = buildMock({
      notes: () => [
        {
          id: "n1",
          title: "Pinned note",
          content_text: "body",
          entity_type: "person",
          entity_id: "shreya",
          entity_title: "Shreya",
          updated_at: "now",
          created_at: "earlier",
        },
      ],
    });
    const out = await listNotesForEntity(
      { userId: "u", kind: "person", id: "shreya" },
      client,
    );
    expect(out.length).toBe(1);
    expect(calls[0].filters).toContainEqual(["entity_type", "eq", "person"]);
    expect(calls[0].filters).toContainEqual(["entity_id", "eq", "shreya"]);
    expect(calls[0].order).toEqual({ col: "updated_at", ascending: false });
  });

  it("countNotesForEntity uses head:true count and (user, type, id) filter", async () => {
    const { client, calls } = buildMock({ notes: () => [] });
    const n = await countNotesForEntity(
      { userId: "u", kind: "library", id: "agenta" },
      client,
    );
    expect(n).toBe(0);
    expect(calls[0].selectOpts).toEqual({ count: "exact", head: true });
    expect(calls[0].filters).toContainEqual(["entity_type", "eq", "library"]);
  });

  it("deleteNote scopes by id+user (RLS belt-and-suspenders)", async () => {
    const { client, calls } = buildMock({ notes: () => null });
    await deleteNote("n1", "u", client);
    expect(calls[0].delete).toBe(true);
    expect(calls[0].filters).toContainEqual(["id", "eq", "n1"]);
    expect(calls[0].filters).toContainEqual(["user_id", "eq", "u"]);
  });
});
