import { describe, expect, it, vi } from "vitest";

import { exploreEntities } from "./explore";

type MockResponse = {
  data: unknown[] | null;
  error: { message: string } | null;
};

function mockClient(response: MockResponse) {
  const rpc = vi.fn().mockResolvedValue(response);
  return {
    client: { rpc } as unknown as Parameters<typeof exploreEntities>[2],
    rpc,
  };
}

const SAMPLE_ROW = {
  entity_id: "agenta",
  slug: "agenta",
  title: "Agenta",
  subtitle: "LLMOps platform",
  image_url: null,
  description: "Open-source LLMOps platform.",
  snippet: "Open-source <mark>LLMOps</mark> platform.",
  rank: 1.4,
  popularity: 1234,
  recent_at: "2026-04-01T00:00:00Z",
  total_count: 42,
  layer: "agents",
  category: "ai_infra_observability",
  out_tags: ["llmops", "evaluations"],
};

describe("exploreEntities", () => {
  it("routes the kind to the matching RPC name", async () => {
    const { client, rpc } = mockClient({ data: [], error: null });
    await exploreEntities("library", { q: "agenta" }, client);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls[0][0]).toBe("explore_libraries");
  });

  it("uses 'relevance' sort when q is non-empty (default)", async () => {
    const { client, rpc } = mockClient({ data: [], error: null });
    await exploreEntities("person", { q: "agents" }, client);
    expect(rpc.mock.calls[0][1]).toMatchObject({
      q: "agents",
      sort: "relevance",
    });
  });

  it("falls back to hidden relevance sort when q is empty for non-video kinds", async () => {
    const { client, rpc } = mockClient({ data: [], error: null });
    await exploreEntities("library", {}, client);
    expect(rpc.mock.calls[0][1]).toMatchObject({
      q: undefined,
      sort: "relevance",
    });
  });

  it("keeps youtube videos on the visible popularity default when q is empty", async () => {
    const { client, rpc } = mockClient({ data: [], error: null });
    await exploreEntities("youtube_video", {}, client);
    expect(rpc.mock.calls[0][1]).toMatchObject({
      q: undefined,
      sort: "popularity",
    });
  });

  it("respects an explicit sort override for video sorts", async () => {
    const { client, rpc } = mockClient({ data: [], error: null });
    await exploreEntities("youtube_video", { q: "x", sort: "alpha" }, client);
    expect(rpc.mock.calls[0][1]).toMatchObject({ sort: "alpha" });
  });

  it("strips invalid layer/category values, keeps free-text tags", async () => {
    const { client, rpc } = mockClient({ data: [], error: null });
    await exploreEntities(
      "library",
      {
        layers: ["agents", "not-a-layer"] as never,
        categories: ["evaluations", "bogus"] as never,
        tags: ["llmops", "  ", "evals"],
      },
      client,
    );
    expect(rpc.mock.calls[0][1]).toMatchObject({
      layers: ["agents"],
      categories: ["evaluations"],
      tags: ["llmops", "evals"],
    });
  });

  it("clamps limit and floors negative offset", async () => {
    const { client, rpc } = mockClient({ data: [], error: null });
    await exploreEntities(
      "paper",
      { limit: 9999, offset: -10 },
      client,
    );
    expect(rpc.mock.calls[0][1]).toMatchObject({
      limit_count: 100,
      offset_count: 0,
    });
  });

  it("parses rows and exposes total_count", async () => {
    const { client } = mockClient({ data: [SAMPLE_ROW], error: null });
    const out = await exploreEntities("library", { q: "agenta" }, client);
    expect(out.rows).toHaveLength(1);
    expect(out.rows[0].snippet).toContain("<mark>");
    expect(out.total).toBe(42);
  });

  it("filters out rows that don't match the schema", async () => {
    const { client } = mockClient({
      data: [SAMPLE_ROW, { entity_id: 123, title: null }],
      error: null,
    });
    const out = await exploreEntities("library", { q: "agenta" }, client);
    expect(out.rows).toHaveLength(1);
  });

  it("throws on RPC error", async () => {
    const { client } = mockClient({
      data: null,
      error: { message: "boom" },
    });
    await expect(
      exploreEntities("library", { q: "agenta" }, client),
    ).rejects.toThrow(/explore_libraries failed/);
  });
});
