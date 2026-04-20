import { z } from "zod";

import {
  CategoryKeySchema,
  DomainLayerSchema,
  ExperienceLevelSchema,
  GoalKeySchema,
  OnboardingStatusSchema,
} from "@/lib/schema/taxonomy";

const trimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => (s === "" ? null : s));

/**
 * Allow-listed fields the user is permitted to write on their own
 * profile. xp_total / is_admin / id / email / created_at are NOT in
 * the list — they're managed server-side or by triggers.
 */
export const ProfileUpdateSchema = z
  .object({
    display_name: trimmedString(80).nullable().optional(),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^[a-z0-9][a-z0-9_-]{2,38}$/,
        "Username must be 3–39 characters, start with a letter or digit, and only contain a–z, 0–9, _ or -.",
      )
      .nullable()
      .optional(),
    headline: trimmedString(140).nullable().optional(),
    bio: z.string().trim().max(2000).nullable().optional(),
    country: trimmedString(60).nullable().optional(),
    location: trimmedString(120).nullable().optional(),
    timezone: trimmedString(60).nullable().optional(),
    current_role_title: trimmedString(120).nullable().optional(),
    is_public: z.boolean().optional(),
    experience_level: ExperienceLevelSchema.nullable().optional(),
    home_layer: DomainLayerSchema.nullable().optional(),
    interest_tags: z.array(CategoryKeySchema).max(20).optional(),
    expertise_tags: z.array(CategoryKeySchema).max(20).optional(),
    goals: z.array(GoalKeySchema).max(10).optional(),
    avatar_url: z.string().url().nullable().optional(),
  })
  .strict();

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

export const SetOnboardingStatusSchema = z.object({
  status: OnboardingStatusSchema,
});

export type SetOnboardingStatusInput = z.infer<typeof SetOnboardingStatusSchema>;
