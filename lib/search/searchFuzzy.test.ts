import { describe, expect, it, vi } from "vitest";

import { searchFuzzy } from "./searchFuzzy";

function mockClient(response: { data: unknown[] | null; error: { message: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(response);
  return {
    client: { rpc } as unknown as Parameters<typeof searchFuzzy>[1],
    rpc,
  };
}

describe("searchFuzzy", () => {
  it("returns [] for an empty prefix", async () => {
    const { client, rpc } = mockClient({ data: [], error: null });
    expect(await searchFuzzy({ prefix: "" }, client)).toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("clamps limits and forwards trimmed prefix", async () => {
    const { client, rpc } = mockClient({ data: [], error: null });
    await searchFuzzy({ prefix: "  ag  ", limit: -10 }, client);
    expect(rpc).toHaveBeenCalledWith("search_fuzzy", {
      prefix: "ag",
      kinds: undefined,
      limit_count: 10,
    });
  });

  it("parses valid rows and skips invalid ones", async () => {
    const { client } = mockClient({
      data: [
        {
          entity_kind: "person",
          entity_id: "p1",
          slug: "shreya",
          title: "Shreya",
          similarity: 0.92,
        },
        {
          entity_kind: "ufo",
          entity_id: "u1",
          slug: null,
          title: "Bogus",
          similarity: 0.5,
        },
      ],
      error: null,
    });

    const out = await searchFuzzy({ prefix: "sh" }, client);
    expect(out.map((r) => r.entity_kind)).toEqual(["person"]);
  });
});
