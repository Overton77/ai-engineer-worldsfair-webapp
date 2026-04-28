import { describe, expect, it } from "vitest";

import { listRecommendationsForUser } from "./recommendations";

type BuilderCall = {
  table: string;
  filters: Array<[string, unknown]>;
  order: { column: string; ascending: boolean } | null;
  limit: number | null;
};

function buildMockClient(rows: unknown[]) {
  const calls: BuilderCall[] = [];

  function from(table: string) {
    const call: BuilderCall = {
      table,
      filters: [],
      order: null,
      limit: null,
    };
    calls.push(call);
    const api = {
      select() {
        return api;
      },
      eq(column: string, value: unknown) {
        call.filters.push([column, value]);
        return api;
      },
      order(column: string, opts?: { ascending?: boolean }) {
        call.order = { column, ascending: opts?.ascending ?? true };
        return api;
      },
      limit(count: number) {
        call.limit = count;
        return api;
      },
      then(onFulfilled: (value: unknown) => unknown) {
        return Promise.resolve({ data: rows, error: null }).then(onFulfilled);
      },
    };
    return api;
  }

  return { client: { from }, calls };
}

describe("recommendations DAL", () => {
  it("lists a user's materialized recommendations by rank", async () => {
    const rows = [
      {
        user_id: "u",
        entity_kind: "paper",
        entity_id: "gepa",
        rank: 1,
        score: 5,
        title: "GEPA",
        subtitle: null,
        image_url: null,
        href: "/paper/gepa",
        reason_codes: ["popular_recently"],
        algorithm_version: "entity-recs-v1-sql-hybrid",
        computed_at: "2026-04-28T20:00:00Z",
        expires_at: null,
        metadata: {},
      },
    ];
    const { client, calls } = buildMockClient(rows);

    const result = await listRecommendationsForUser(
      "u",
      4,
      client as unknown as Parameters<typeof listRecommendationsForUser>[2],
    );

    expect(result).toEqual(rows);
    expect(calls[0].table).toBe("user_entity_recommendation");
    expect(calls[0].filters).toContainEqual(["user_id", "u"]);
    expect(calls[0].order).toEqual({ column: "rank", ascending: true });
    expect(calls[0].limit).toBe(4);
  });
});
