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

1. **Pick the next unit** from the milestone's `README.md` (top-down).
2. **Create the branch** — name = unit-id kebab, e.g. `u1-1-project-shell`.
   See [`.cursor/rules/git-branch-workflow.mdc`](../../rules/git-branch-workflow.mdc).
3. **Open the unit's file** and flip `Status: not-started → in-progress`.
4. **Do the work** against the spec in `../04-implementation-units.md` and
   the relevant wireframe section in `../03-wireframes.md`.
5. **Open a PR** — title = `UX.Y — <unit title>` (matches the unit's H1).
   Paste the PR URL into the unit file.
6. **Merge** — squash merge into `main`, delete the branch, flip
   `Status: in-progress → merged`, paste the merge commit SHA.
7. **Update the milestone README** table row.

## Status legend

| Status | Meaning |
|---|---|
| `not-started` | No branch, no PR. |
| `in-progress` | Branch exists, code being written, not yet reviewable. |
| `in-review` | PR open, awaiting review / CI. |
| `merged` | Squash-merged into `main`, branch deleted. |
| `blocked` | Waiting on another unit (link it) or an open question. |

## Top-down reading order for new contributors

1. Skim [`../00-overview.md`](../00-overview.md) and [`../05-milestones.md`](../05-milestones.md).
2. Open the current milestone's `README.md` in this folder.
3. Open the current `u*.md` file.
4. Read the spec section it links to in `../04-implementation-units.md`.
5. Start the branch per [`.cursor/rules/git-branch-workflow.mdc`](../../rules/git-branch-workflow.mdc).
