# Plans — Build Queue

This folder is the **work tracker** mirrored from the planning docs.

- **Planning docs** (immutable source of truth):
  [`../00-overview.md`](../00-overview.md) …
  [`../05-milestones.md`](../05-milestones.md) …
  [`../06-open-questions.md`](../06-open-questions.md).
- **Build queue** (this folder, live-edited as work progresses): one folder
  per milestone, one Markdown file per unit. Each file carries branch name,
  status, and PR link. Don't duplicate spec content here — **link back** to
  the section of `../04-implementation-units.md` that owns it.

## Structure

```
milestones/
├── README.md                     (you are here)
├── m0-foundations/               (M0)
│   ├── README.md                 (milestone overview + gate)
│   ├── u1-1-project-shell.md
│   ├── u1-2-auth-route-protection.md
│   ├── u1-3-app-shell.md
│   ├── u1-4-domain-types.md
│   └── u1-5-search-infra.md
├── m1-identity/                  (M1)
├── m2-exploration-v1/            (M2)
├── m3-capture-v1/                (M3)
├── m4-home-assistant-v1/         (M4)
├── m5-curriculum-v1/             (M5)
├── m6-recommender-assistant-v2/  (M6)
├── m7-arena-v1/                  (M7)
└── m8-arena-v2/                  (M8)
```

Plus a sibling [`../prereqs/`](../prereqs/) folder for the **U0.x
micro-units** surfaced by the 2026-04-20 pass through
[`../06-open-questions.md`](../06-open-questions.md). Those must ship
before M0 is sealed.

## How to use this folder

**One branch per milestone.** Units become commits with a `[UX.Y]` prefix.

1. **Open the milestone's `README.md`**. The top of the file lists the
   branch name and the ordered unit table.
2. **Create the milestone branch once** — e.g. `git checkout -b
   m2-exploration-v1` from `main`. See
   [`.cursor/rules/git-branch-workflow.mdc`](../../rules/git-branch-workflow.mdc).
3. **Pick the next unit** in the table. Open its `.md` stub and flip
   `Status: not-started → in-progress`.
4. **Do the work** against the spec in `../04-implementation-units.md`
   and the wireframe in `../03-wireframes.md`. Commit with `[UX.Y] …`
   prefix on every commit.
5. **Finish the unit** → flip its status to `done-on-branch`, tick
   acceptance boxes. Move to the next unit on the same branch.
6. **Open ONE PR for the milestone** as soon as the first unit is
   reviewable. Title = `M2 — Exploration v1`. Keep pushing more units to
   the same branch; the PR updates in place.
7. **Merge with a merge commit** (NOT squash) so per-unit `[UX.Y]` history
   survives in `main`. Delete the branch.
8. **Flip every unit's status to `merged`** and paste the merge SHA.
   Update the milestone README's status row.

## Status legend (per unit)

| Status | Meaning |
|---|---|
| `not-started` | Not begun on the milestone branch yet. |
| `in-progress` | Currently being written; commits exist on the branch. |
| `done-on-branch` | All acceptance boxes ticked; awaiting milestone PR merge. |
| `merged` | Milestone PR merged into `main`. |
| `blocked` | Waiting on another unit or an open question (link it). |

## Status legend (per milestone)

| Status | Meaning |
|---|---|
| `not-started` | Branch not yet created. |
| `in-progress` | Branch exists; some units `done-on-branch`, others not. |
| `in-review` | PR open, all units `done-on-branch`. |
| `merged` | PR merged into `main`. |

## Top-down reading order for new contributors

1. Skim [`../00-overview.md`](../00-overview.md) and [`../05-milestones.md`](../05-milestones.md).
2. Open the current milestone's `README.md` in this folder.
3. Open the current `u*.md` file.
4. Read the spec section it links to in `../04-implementation-units.md`.
5. Start the branch per [`.cursor/rules/git-branch-workflow.mdc`](../../rules/git-branch-workflow.mdc).
