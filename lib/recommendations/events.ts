import "server-only";

import { send } from "@vercel/queue";

import { createServiceClient } from "@/lib/supabase/admin";

import {
  RECOMMENDATION_TOPIC,
  type EntityInteractionEventType,
  type EntityInteractionQueueMessage,
} from "./types";

type DbClient = {
  from: (table: string) => QueryBuilder;
};

type QueryResult<T = Record<string, unknown>> = {
  data: T | null;
  error: { message: string } | null;
};

type QueryBuilder = {
  insert: (values: unknown) => QueryBuilder;
  update: (values: unknown) => QueryBuilder;
  select: (columns: string) => QueryBuilder;
  eq: (column: string, value: unknown) => QueryBuilder;
  single: () => Promise<QueryResult>;
  then: Promise<QueryResult>["then"];
};

type QueueSend = (
  topic: string,
  payload: EntityInteractionQueueMessage,
  options?: { idempotencyKey?: string },
) => Promise<{ messageId: string | null }>;

export type EmitEntityInteractionArgs = {
  userId: string;
  type: EntityInteractionEventType;
  entity: {
    kind: string;
    id: string;
    title?: string | null;
    subtitle?: string | null;
  };
  metadata?: Record<string, unknown>;
};

export type EmitEntityInteractionResult = {
  eventId: string | null;
  queued: boolean;
};

export async function emitEntityInteractionEvent(
  args: EmitEntityInteractionArgs,
  opts: {
    client?: DbClient;
    queueSend?: QueueSend;
    now?: () => Date;
  } = {},
): Promise<EmitEntityInteractionResult> {
  const occurredAt = (opts.now ?? (() => new Date()))().toISOString();

  try {
    const client = opts.client ?? (createServiceClient() as unknown as DbClient);
    const queueSend = opts.queueSend ?? send;
    const { data, error } = await client
      .from("entity_interaction_event")
      .insert({
        user_id: args.userId,
        event_type: args.type,
        entity_kind: args.entity.kind,
        entity_id: args.entity.id,
        entity_title: args.entity.title ?? null,
        entity_subtitle: args.entity.subtitle ?? null,
        occurred_at: occurredAt,
        status: "pending",
        metadata: args.metadata ?? {},
      })
      .select("event_id, occurred_at")
      .single();

    const inserted = data as {
      event_id?: string;
      occurred_at?: string | null;
    } | null;

    if (error || !inserted?.event_id) {
      console.warn(
        `recommendations.emitEntityInteractionEvent.insert: ${error?.message ?? "missing event id"}`,
      );
      return { eventId: null, queued: false };
    }

    const message: EntityInteractionQueueMessage = {
      eventId: inserted.event_id,
      userId: args.userId,
      type: args.type,
      entity: {
        kind: args.entity.kind,
        id: args.entity.id,
        title: args.entity.title ?? null,
        subtitle: args.entity.subtitle ?? null,
      },
      occurredAt,
    };

    try {
      await queueSend(RECOMMENDATION_TOPIC, message, {
        idempotencyKey: inserted.event_id,
      });
      await client
        .from("entity_interaction_event")
        .update({
          status: "queued",
          queued_at: new Date().toISOString(),
          error: null,
        })
        .eq("event_id", inserted.event_id);
      return { eventId: inserted.event_id, queued: true };
    } catch (queueError) {
      const message =
        queueError instanceof Error ? queueError.message : String(queueError);
      console.warn(`recommendations.queueSend: ${message}`);
      await client
        .from("entity_interaction_event")
        .update({
          status: "pending",
          error: message,
        })
        .eq("event_id", inserted.event_id);
      return { eventId: inserted.event_id, queued: false };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`recommendations.emitEntityInteractionEvent: ${message}`);
    return { eventId: null, queued: false };
  }
}
