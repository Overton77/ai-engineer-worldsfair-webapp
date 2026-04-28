import { describe, expect, it, vi } from "vitest";

import { emitEntityInteractionEvent } from "./events";

type BuilderCall = {
  table: string;
  insert: unknown;
  update: unknown;
  filters: Array<[string, unknown]>;
};

function buildMockClient() {
  const calls: BuilderCall[] = [];

  function from(table: string) {
    const call: BuilderCall = {
      table,
      insert: null,
      update: null,
      filters: [],
    };
    calls.push(call);

    const api = {
      insert(value: unknown) {
        call.insert = value;
        return api;
      },
      update(value: unknown) {
        call.update = value;
        return api;
      },
      select() {
        return api;
      },
      eq(column: string, value: unknown) {
        call.filters.push([column, value]);
        return api;
      },
      single() {
        return Promise.resolve({
          data: {
            event_id: "11111111-1111-4111-8111-111111111111",
            occurred_at: "2026-04-28T20:00:00.000Z",
          },
          error: null,
        });
      },
      then(onFulfilled: (value: unknown) => unknown) {
        return Promise.resolve({ data: null, error: null }).then(onFulfilled);
      },
    };
    return api;
  }

  return { client: { from }, calls };
}

describe("recommendation events", () => {
  it("marks the outbox row queued after a successful queue send", async () => {
    const { client, calls } = buildMockClient();
    const queueSend = vi.fn().mockResolvedValue({ messageId: "msg_1" });

    const result = await emitEntityInteractionEvent(
      {
        userId: "22222222-2222-4222-8222-222222222222",
        type: "entity.saved",
        entity: { kind: "paper", id: "gepa", title: "GEPA" },
      },
      {
        client: client as unknown as NonNullable<
          Parameters<typeof emitEntityInteractionEvent>[1]
        >["client"],
        queueSend,
      },
    );

    expect(result).toEqual({
      eventId: "11111111-1111-4111-8111-111111111111",
      queued: true,
    });
    expect(queueSend).toHaveBeenCalledWith(
      "entity-interactions",
      expect.objectContaining({ eventId: "11111111-1111-4111-8111-111111111111" }),
      { idempotencyKey: "11111111-1111-4111-8111-111111111111" },
    );
    expect(calls[1].update).toMatchObject({ status: "queued" });
  });

  it("keeps the outbox row pending when queue send fails", async () => {
    const { client, calls } = buildMockClient();
    const queueSend = vi.fn().mockRejectedValue(new Error("queue offline"));

    const result = await emitEntityInteractionEvent(
      {
        userId: "22222222-2222-4222-8222-222222222222",
        type: "entity.followed",
        entity: { kind: "person", id: "p1", title: "Ada" },
      },
      {
        client: client as unknown as NonNullable<
          Parameters<typeof emitEntityInteractionEvent>[1]
        >["client"],
        queueSend,
      },
    );

    expect(result).toMatchObject({ queued: false });
    expect(calls[1].update).toMatchObject({
      status: "pending",
      error: "queue offline",
    });
  });
});
