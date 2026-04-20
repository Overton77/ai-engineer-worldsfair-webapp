/**
 * Helper that bundles the per-dossier note context: count for the
 * hero badge + first-page list for the footer panel. Called once per
 * dossier render so we only round-trip twice (the count is one query
 * and the list is another).
 */

import "server-only";

import { getOptionalUser } from "@/lib/auth/require-user";
import {
  countNotesForEntity,
  listNotesForEntity,
} from "@/lib/db/notes";
import type { EntityKind } from "@/lib/schema/entity-kind";
import type { NoteSummary } from "@/lib/notes/types";

export type DossierNotesContext = {
  count: number;
  notes: NoteSummary[];
};

export async function getDossierNotesContext(
  ref: { kind: EntityKind; id: string },
  limit = 10,
): Promise<DossierNotesContext> {
  const user = await getOptionalUser();
  if (!user) return { count: 0, notes: [] };
  const [count, notes] = await Promise.all([
    countNotesForEntity({ userId: user.id, kind: ref.kind, id: ref.id }),
    listNotesForEntity({
      userId: user.id,
      kind: ref.kind,
      id: ref.id,
      limit,
    }),
  ]);
  return { count, notes };
}
