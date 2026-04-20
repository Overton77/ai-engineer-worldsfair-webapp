# U3.5 — Entity dossier — secondary set (papers, talks, videos, events)

- **Milestone:** [M2 — Exploration v1](./README.md)
- **Spec:** [`04-implementation-units.md` § U3.5](../../04-implementation-units.md)
- **Wireframe:** [`03-wireframes.md` — D. Entity Dossier variants](../../03-wireframes.md)
- **Commit prefix:** `[U3.5]` (lands on milestone branch [`m2-exploration-v1`](./README.md))
- **Status:** merged via f1efd2b
- **PR:** —
- **Depends on:** U3.4

## Acceptance (link to spec)

- [x] `/paper/[slug]` — abstract + venue + arXiv/DOI/PDF links + author
  chips (via `paper_authored_by`) + "Cited / discussed in" talks
- [x] `/talk/[slug]` — title + track + scheduled_at + speakers + linked
  event + linked recording + libraries discussed
- [x] `/video/[id]` — lazy YouTube embed + chapter rail + `?t=` URL
  param synced to `seekTo`; speakers / libraries / papers / products /
  linked talk / linked event panels
- [x] `/event/[slug]` — date range + venue + topic_tags + sponsors /
  attendees / scheduled sessions
- [x] Clicking a chapter jumps the embedded player and writes the
  timestamp to the URL
- [x] Talk dossier links to its video and event when both exist

## Working log

- _2026-04-20_ — unit file created.
- _2026-04-20_ — implemented on `m2-exploration-v1` at `e2ee7ee`.
