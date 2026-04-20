# U0.3 — `lib/schema/entity-kind.ts` (canonical union + zod)

- **Folder:** [prereqs](./README.md)
- **Source:** [`06-open-questions.md` § Q4 / Q5](../06-open-questions.md)
- **Commit prefix:** `[U0.3]` (lands on branch [`prereqs`](./README.md))
- **Status:** not-started
- **PR:** —
- **Kind:** library file (no migration)

## What lands

```ts
// aiengineerapp/lib/schema/entity-kind.ts
export const ENTITY_KINDS = [
  'person', 'organization', 'session', 'youtube_video',
  'library', 'product', 'event', 'paper', 'report', 'news_item', 'repo',
  'course', 'course_module', 'challenge', 'attempt', 'image',
] as const;
export type EntityKind = typeof ENTITY_KINDS[number];
export const EntityKindSchema = z.enum(ENTITY_KINDS);
```

Also exports `FOLLOW_ENTITY_KINDS` that adds `'category' | 'domain_layer'`
for `profile_followed_entity`, and `ARTIFACT_KINDS` for
`module_uses_artifact`. Every polymorphic insert path in the app imports
from here — no string literal duplication.

## Acceptance

- [ ] Single source of truth in `lib/schema/`
- [ ] zod schema for runtime validation at Server-Action boundaries
- [ ] Comment cross-references the matching DB CHECK constraint names

## Working log

- _2026-04-20_ — unit file created.
