# M5 — Curriculum v1

> **"I can browse, enroll, and learn modules with quizzes, notes, and progress."**
>
> Canonical sequencing + gate: [`../../05-milestones.md#m5--curriculum-v1`](../../05-milestones.md)

## Units

| Unit | File | Status | PR |
|---|---|---|---|
| U7.1 | [u7-1-course-data.md](./u7-1-course-data.md) | not-started | — |
| U7.2 | [u7-2-learn-hub.md](./u7-2-learn-hub.md) | not-started | — |
| U7.3 | [u7-3-module-reader.md](./u7-3-module-reader.md) | not-started | — |
| U7.4 | [u7-4-progress.md](./u7-4-progress.md) | not-started | — |

## Gate to M6

A course with ≥ 3 modules ships end-to-end; a user can finish it and see
100% on the course landing.

## Decisions that shape this milestone

- **Q5** — `course_module` is an allowed `notes.entity_type`; U7.3's right
  rail queries `notes where entity_type='course_module' and entity_id =
  module_id`.
- **Q10** — publish flow (flip `status: draft → published` + insert
  `course_module_review`) is gated to `profiles.is_admin = true` via
  RLS + server-side `assertAdmin()`. U7.x is consumer-side only; no
  curator UI in v1.
- **Seed content** — `agent-orchestration-skills-mini` (1 course, 3
  modules, 1 draft challenge) is already in the DB from the
  2026-04-20 pass. M5 builds against that seed.
