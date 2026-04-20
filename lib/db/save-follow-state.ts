/**
 * Tiny helper used by dossier pages and any list page that wants to
 * pre-render the saved / following state for a batch of entities in
 * one round trip per relation.
 *
 * Use:
 *   const state = await getSaveFollowState([{kind:'person', id:'…'}]);
 *   <SaveButton initialSaved={state.saved.has('person:…')} />
 */

import "server-only";

import { getOptionalUser } from "@/lib/auth/require-user";
import { listFollowsForEntities } from "@/lib/db/follows";
import { listSavesForEntities } from "@/lib/db/saves";
import type { EntityRef, FollowEntityKind } from "@/lib/schema/entity-kind";

export type SaveFollowState = {
  userId: string | null;
  saved: Set<string>;
  following: Set<string>;
};

export async function getSaveFollowState(
  refs: ReadonlyArray<Pick<EntityRef, "kind" | "id">>,
): Promise<SaveFollowState> {
  const user = await getOptionalUser();
  if (!user || refs.length === 0) {
    return { userId: user?.id ?? null, saved: new Set(), following: new Set() };
  }
  const followRefs = refs.map((r) => ({
    kind: r.kind as FollowEntityKind,
    id: r.id,
  }));
  const [saved, following] = await Promise.all([
    listSavesForEntities(user.id, refs),
    listFollowsForEntities(user.id, followRefs),
  ]);
  return { userId: user.id, saved, following };
}
