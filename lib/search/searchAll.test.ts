import { describe, expect, it, vi } from "vitest";

import { searchAll } from "./searchAll";

type MockResponse = { data: unknown[] | null; error: { message: string } | null };

function mockClient(response: MockResponse) {
  const rpc = vi.fn().mockResolvedValue(response);
  return {
    client: { rpc } as unknown as Parameters<typeof searchAll>[1],
    rpc,
  };
}

describe("searchAll", () => {
  it("returns [] for an empty query without calling the RPC", async () => {
    const { client, rpc } = mockClient({ data: [], error: null });
    const out = await searchAll({ query: "   " }, client);
    expect(out).toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("calls search_all with sanitized kinds + clamped limit", async () => {
    const { client, rpc } = mockClient({ data: [], error: null });
    await searchAll(
      {
        query: "evals",
        kinds: ["person", "library", "person", "not-a-kind"] as never,
        limit: 9999,
      },
      client,
    );
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("search_all", {
      q: "evals",
      kinds: ["person", "library"],
      limit_count: 100,
    });
  });

  it("drops rows whose entity_kind is not in the union", async () => {
    const { client } = mockClient({
      data: [
        {
          entity_kind: "library",
          entity_id: "agenta",
          slug: "agenta",
          title: "Agenta",
          subtitle: null,
          snippet: null,
          rank: 0.81,
        },
        {
          entity_kind: "spaceship",
          entity_id: "x",
          slug: null,
          title: "Bogus",
          subtitle: null,
          snippet: null,
          rank: 0.1,
        },
      ],
      error: null,
    });

    const out = await searchAll({ query: "agenta" }, client);
    expect(out).toHaveLength(1);
    expect(out[0].entity_kind).toBe("library");
    expect(out[0].rank).toBeCloseTo(0.81);
  });

  it("preserves notes rows (own-note hits surface in cmd-K)", async () => {
    const { client } = mockClient({
      data: [
        {
          entity_kind: "notes",
          entity_id: "11111111-1111-1111-1111-111111111111",
          slug: "11111111-1111-1111-1111-111111111111",
          title: "Why GEPA matters",
          subtitle: "library",
          snippet: "GEPA pairs <mark>judge</mark> outputs with…",
          rank: 0.5,
        },
      ],
      error: null,
    });
    const out = await searchAll({ query: "gepa" }, client);
    expect(out).toHaveLength(1);
    expect(out[0].entity_kind).toBe("notes");
    expect(out[0].title).toBe("Why GEPA matters");
  });

  it("throws on RPC error", async () => {
    const { client } = mockClient({
      data: null,
      error: { message: "boom" },
    });
    await expect(searchAll({ query: "x" }, client)).rejects.toThrow(/boom/);
  });
});
