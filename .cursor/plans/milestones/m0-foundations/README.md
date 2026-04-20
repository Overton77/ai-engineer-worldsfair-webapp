# M0 — Foundations

> **"Auth works, the shell renders, types compile."**
>
> Canonical sequencing + gate: [`../../05-milestones.md#m0--foundations`](../../05-milestones.md)

- **Branch:** `m0-foundations` (one PR for the whole milestone — see [`git-branch-workflow.mdc`](../../../rules/git-branch-workflow.mdc))
- **Status:** not-started
- **PR:** —

**Prereqs folder:** the [U0.x micro-units](../../prereqs/README.md) from the
2026-04-20 open-questions resolutions must land before M0 is sealed. They're
small (mostly migrations + tiny helpers) and don't themselves block U1.x
coding, but some acceptance criteria here depend on them.

## Units

| Unit | File | Status | PR |
|---|---|---|---|
| U1.1 | [u1-1-project-shell.md](./u1-1-project-shell.md) | not-started | — |
| U1.2 | [u1-2-auth-route-protection.md](./u1-2-auth-route-protection.md) | not-started | — |
| U1.3 | [u1-3-app-shell.md](./u1-3-app-shell.md) | not-started | — |
| U1.4 | [u1-4-domain-types.md](./u1-4-domain-types.md) | not-started | — |
| U1.5 | [u1-5-search-infra.md](./u1-5-search-infra.md) | not-started | — |

## Gate to M1

Any logged-in user lands on a themed shell at `/` (which is allowed to be
empty). `pnpm typecheck`, `pnpm test`, `pnpm build` all green.

## Decisions that shape this milestone

- **Q1** — embeddings already on disk are `cohere.embed-v4:0` @ 1536d. U1.5's
  adapter types the dim explicitly.
- **Q2** — RLS + server-side `assertOwner` pattern is mandatory for every
  write-path unit. U1.2 establishes `requireUser()` / `assertOwner()`.
- **Q3** — `handle_new_user()` trigger lives in [U0.1](../../prereqs/u0-1-auth-trigger.md);
  U2.1 assumes the trigger has fired.
- **Q4** — `EntityKind` union lives in [U0.3](../../prereqs/u0-3-entity-kind-lib.md);
  U1.4 imports from it rather than redefining.
