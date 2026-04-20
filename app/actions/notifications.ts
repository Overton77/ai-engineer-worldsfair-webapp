"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import { markRead } from "@/lib/db/notifications";

const ArgsSchema = z.object({
  target: z.union([z.string().min(1), z.literal("all")]),
});

export async function markNotificationRead(
  input: z.input<typeof ArgsSchema>,
): Promise<{ updated: number }> {
  const parsed = ArgsSchema.safeParse(input);
  if (!parsed.success) return { updated: 0 };
  const user = await requireUser();
  const result = await markRead(parsed.data.target, user.id);
  // Bell badge in the layout reads from a Server Component; bust the
  // route cache so the badge re-renders on next navigation.
  revalidatePath("/", "layout");
  return result;
}
