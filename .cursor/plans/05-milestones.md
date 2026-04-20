# 05 — Draft Milestones

These are **pre-official drafts** rolled up from the implementation units in
doc 04. They are sequenced by **dependency**, not calendar. Each milestone
is a "thing you can demo and that people can actually use." We deliberately
end with the Arena because it requires every other piece.

The user's suggested order was followed with **two intentional adjustments**:

1. **Search & exploration ships before the personalized home.** A working
   directory + cmd-K is a prerequisite for personalization to feel valuable
   *and* validates retrieval before we invest in a recommender.
2. **Notes/Saves/Follows ship in two passes.** The first pass (just
   save/follow + freeform notes) ships *with* exploration so each dossier
   has working CTAs. The richer notes workspace + entity-pinned notes ship
   right after, before personalization.

---

## Milestone overview

| M | Name | Demo statement |
|---|---|---|
| M0 | **Foundations** | "Auth works, the shell renders, types compile." |
| M1 | **Identity** | "I can sign up, finish onboarding, and edit my profile." |
| M2 | **Exploration v1** | "I can find and read about anything in the AI engineering ecosystem via cmd-K, search, and dossiers." |
| M3 | **Capture v1** | "I can save, follow, and write notes (freeform & entity-pinned) about anything I explored." |
| M4 | **Personalized Home + Assistant v1** | "My home feels like mine, and I can ask an AI for grounded answers with citations." |
| M5 | **Curriculum v1** | "I can browse, enroll, and learn modules with quizzes, notes, and progress." |
| M6 | **Recommender v2 + Assistant v2** | "Recommendations are personalized; the assistant can take actions for me." |
| M7 | **Arena v1 (the big one)** | "I can take a coding challenge, run it in a sandbox, get tests + LLM judging, and earn XP." |
| M8 | **Arena v2 + Capstones + Leaderboard** | "Capstones close out courses; XP and the leaderboard make progress visible." |

---

## M0 — Foundations
**Units:** U1.1, U1.2, U1.3, U1.4, U1.5
**Outcome:** new repo state with shell, auth, types, search wrappers.
**Gate to M1:** any logged-in user lands on a themed shell at `/` (which is
allowed to be empty). `pnpm typecheck`, `pnpm test`, `pnpm build` all green.

## M1 — Identity
**Units:** U2.1, U2.2, U2.3, U9.1 (analytics init)
**Outcome:** end-to-end signup → onboarding wizard → profile edit; PostHog
firing `onboarding_*` events.
**Gate to M2:** a brand-new user can finish onboarding in ≤ 90 s and see
their saved tags reflected in `/settings/profile`.

## M2 — Exploration v1
**Units:** U3.1 (cmd-K), U3.2 (search), U3.3 (explore index), U3.4 (mvp
dossiers), U3.5 (secondary dossiers)
**Outcome:** user can navigate the entire entity graph (people, orgs,
libraries, papers, talks, videos, events). Save/Follow buttons render but
no-op with a "coming soon" toast.
**Gate to M3:** every dossier loads SSR p95 < 700 ms; every relationship
chip is clickable and lands somewhere; cmd-K returns results in < 200 ms.

## M3 — Capture v1
**Units:** U4.1 (save/follow primitives), U4.2 (saved/follows pages),
U4.3 (notes data), U4.4 (Tiptap editor), U4.5 (notes workspace),
U4.6 (entity-pinned notes UI)
**Outcome:** every CTA on every dossier is functional; a user can take a
note about an entity, mention other entities, search across notes, and see
their saved/follows lists.
**Gate to M4:** a dogfood user produces ≥ 5 notes and ≥ 10 saves in a
session without confusion.

## M4 — Personalized Home + Assistant v1
**Units:** U5.1 (rules-based home), U6.1 (assistant + RAG),
U6.2 (assistant drawer), U9.2 (rate limits before launch)
**Outcome:** `/` is full of personalized carousels; assistant drawer
streams grounded answers with clickable citations.
**Gate to M5:** assistant returns answers with ≥ 1 citation on 95% of
in-corpus questions (manual eval set).

## M5 — Curriculum v1
**Units:** U7.1 (data layer), U7.2 (learn hub + course landing),
U7.3 (module reader + mini-quiz), U7.4 (progress)
**Outcome:** user can complete a published module, score the mini-quiz,
earn XP, and see progress on a course.
**Gate to M6:** a course with ≥ 3 modules ships end-to-end; a user can
finish it and see 100% on the course landing.

## M6 — Recommender v2 + Assistant v2
**Units:** U5.2 (interest-vector recommender), U6.3 (assistant tool calls),
U6.4 (full-page chat + history), U9.3 (Inngest jobs)
**Outcome:** home is personalized via embeddings; the assistant can save,
follow, create notes, and enroll on the user's behalf — every action with a
visible "AI did this" affordance and an undo.
**Gate to M7:** the assistant tool-call success rate > 90% on a fixed
prompt suite; recommender CTR beats rule-based in a 1-week dogfood A/B.

## M7 — Arena v1
**Units:** U8.1 (sandbox), U8.2 (challenge index), U8.3 (workspace + run),
U8.4 (judge + composite scoring + XP), U8.5 (tutor)
**Outcome:** user picks a challenge, codes in Monaco, runs in E2B sandbox,
submits, gets tests + LLM judge feedback + composite score + XP.
**Gate to M8:** judge variance < 10% across 5 reruns of the same correct
solution on a calibration challenge; sandbox cold-start p95 < 8 s.

## M8 — Arena v2: Capstones + Leaderboard
**Units:** U8.6 (capstone wiring + leaderboard), U9.4 (public profile),
U9.5 (full e2e suite)
**Outcome:** courses close out via capstones; a public leaderboard exists;
public profiles show XP and (opt-in) public attempts.
**Gate to launch:** a real user can sign up, get oriented, save and learn,
finish a course capstone, and see themselves on the leaderboard — all
without engineering hand-holding.

---

## Why this ordering (rationale recap)

- **M0 → M1** is non-negotiable: nothing personal can exist without auth +
  profile.
- **M2 before M3:** people need *things to save* before save buttons matter.
- **M3 before M4:** the recommender's signal depends on saves/follows/notes;
  building it before any signals exist is premature optimization.
- **M5 before M6's tool-calling assistant:** the assistant needs `enrollCourse`
  to be a meaningful action, which needs Curriculum live.
- **M7 last:** challenges depend on every other system — courses for
  capstone wiring, assistant for tutoring, notes for in-flight scratchpads,
  recommender for "next challenge", saves for "save for later", and they
  introduce the most operational risk (sandbox infra, cost, judging
  variance).

## Out-of-milestone backlog

- Linked-account OAuth re-flows (GitHub/LinkedIn/Twitter) → M3+ optional
- News ingestion pipeline (currently relies on existing scripts)
- Curator review UI for `course_module_review`
- Real-time collaborative notes (Yjs)
- Voice input / dictation for the assistant
- Email digests (`Resend` + `react-email`)
- Course version diff viewer
- Multi-runtime sandboxes (TS, Bun)
- Public attempts gallery
