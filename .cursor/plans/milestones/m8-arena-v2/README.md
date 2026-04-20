# M8 — Arena v2: Capstones + Leaderboard

> **"Capstones close out courses; XP and the leaderboard make progress visible."**
>
> Canonical sequencing + gate: [`../../05-milestones.md#m8--arena-v2-capstones--leaderboard`](../../05-milestones.md)

- **Branch:** `m8-arena-v2` (one PR for the whole milestone — see [`git-branch-workflow.mdc`](../../../rules/git-branch-workflow.mdc))
- **Status:** not-started
- **PR:** —

## Units

| Unit | File | Status | PR |
|---|---|---|---|
| U8.6 | [u8-6-capstone-leaderboard.md](./u8-6-capstone-leaderboard.md) | not-started | — |
| U9.4 | [u9-4-public-profile.md](./u9-4-public-profile.md) | not-started | — |
| U9.5 | [u9-5-e2e-tests.md](./u9-5-e2e-tests.md) | not-started | — |

## Gate to launch

A real user can sign up, get oriented, save and learn, finish a course
capstone, and see themselves on the leaderboard — all without engineering
hand-holding.

## Decisions that shape this milestone

- **Q11** — public profile uses the `public_profile` view from
  [U0.7](../../prereqs/u0-7-public-profile-view.md); never exposes
  notes / saves / attempts.
- **Q10** — publishing the capstone flips `challenge.status` to
  `published` via the admin-only RPC. Until then RLS keeps it hidden
  from non-admin users.
