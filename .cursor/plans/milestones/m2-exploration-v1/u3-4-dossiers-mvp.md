# U3.4 — Entity dossier (MVP set: people, orgs, libraries)

- **Milestone:** [M2 — Exploration v1](./README.md)
- **Spec:** [`04-implementation-units.md` § U3.4](../../04-implementation-units.md)
- **Wireframe:** [`03-wireframes.md` — D. Entity Dossier](../../03-wireframes.md)
- **Commit prefix:** `[U3.4]` (lands on milestone branch [`m2-exploration-v1`](./README.md))
- **Status:** done-on-branch
- **PR:** —
- **Depends on:** U3.3

## Acceptance (link to spec)

- [x] `/p/[slug]` person dossier with hero, employed-at, founded,
  presented-sessions, attended-events, talks, authored-papers
- [x] `/o/[slug]` organization dossier with CEO, founders, team,
  libraries, products, repos, sponsored events
- [x] `/lib/[slug]` library dossier with owner org, repos, dep edges,
  appeared-in talks/sessions, GitHub stats + outbound links
- [x] Every relationship chip clicks through to its own dossier route
- [x] Missing data degrades to empty hints, never throws
- [x] SSR via `getPersonDossier` / `getOrganizationDossier` /
  `getLibraryDossier` — single fan-out per page

## Working log

- _2026-04-20_ — unit file created.
- _2026-04-20_ — implemented on `m2-exploration-v1`.
