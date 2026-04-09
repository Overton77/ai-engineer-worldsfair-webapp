import { z } from "zod";

export const ENTITY_TYPES = [
  "person",
  "organization",
  "session",
  "youtube_video",
] as const;

export const entityTypeSchema = z.enum(ENTITY_TYPES);

export type EntityType = z.infer<typeof entityTypeSchema>;

export type EntityReference = {
  entityType: EntityType;
  entityId: string;
  entityTitle: string;
  entitySubtitle?: string | null;
};

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().max(120).nullable().optional(),
  bio: z.string().trim().max(1200).nullable().optional(),
  avatarUrl: z.string().trim().url().nullable().optional(),
});

export const savedItemSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().trim().min(1).max(255),
  entityTitle: z.string().trim().min(1).max(255),
  entitySubtitle: z.string().trim().max(255).nullable().optional(),
});

function isReasonableJsonPayload(value: unknown): boolean {
  try {
    return JSON.stringify(value).length <= 50_000;
  } catch {
    return false;
  }
}

export const noteBaseSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    contentJson: z.unknown().refine(isReasonableJsonPayload, {
      message: "Note content is too large.",
    }),
    contentText: z.string().trim().max(20000),
    entityType: entityTypeSchema.nullable().optional(),
    entityId: z.string().trim().min(1).max(255).nullable().optional(),
    entityTitle: z.string().trim().max(255).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    const hasType = !!value.entityType;
    const hasId = !!value.entityId;

    if (hasType !== hasId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entityId"],
        message: "Entity type and entity id must be provided together.",
      });
    }
  });

export const noteCreateSchema = noteBaseSchema;

export const noteUpdateSchema = noteBaseSchema.extend({
  id: z.string().uuid(),
});

export function entityTypeLabel(entityType: EntityType): string {
  switch (entityType) {
    case "person":
      return "Person";
    case "organization":
      return "Organization";
    case "session":
      return "Session";
    case "youtube_video":
      return "Video";
    default:
      return entityType;
  }
}
