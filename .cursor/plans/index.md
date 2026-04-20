# AI Engineer App — Architecture & Implementation Plan

This folder is the **planning workspace** for a complete redesign of the AI Engineer
exploration / notes / search / recommendation / course / challenge application.

> Status: **planning only**. No production code is being written yet. Phases are
> grounded in `aiengineerapp/types/database.types.ts` and the wiki at `aiwiki/docs/`.

## Documents

| # | Doc | Contents |
|---|---|---|
| 00 | [`00-overview.md`](./00-overview.md) | Executive summary, problem framing, assumptions, what's inferred vs recommended |
| 01 | [`01-feature-architecture.md`](./01-feature-architecture.md) | Product domains, subdomains, screens, data dependencies, MVP vs later |
| 02 | [`02-tech-stack.md`](./02-tech-stack.md) | Library decisions per concern, justifications, "now vs deferred" |
| 03 | [`03-wireframes.md`](./03-wireframes.md) | Low-fi textual wireframes for every major screen and flow |
| 04 | [`04-implementation-units.md`](./04-implementation-units.md) | Buildable units in dependency order, with scope / risks / acceptance |
| 05 | [`05-milestones.md`](./05-milestones.md) | Draft milestone groupings rolled up from units |
| 06 | [`06-open-questions.md`](./06-open-questions.md) | Decisions that need future validation before implementation |

## Reading order

1. Skim `00-overview.md` for the framing and assumption list.
2. Read `01-feature-architecture.md` to understand the domain model.
3. Read `02-tech-stack.md` for library choices.
4. Use `03-wireframes.md` as a visual reference while reading the rest.
5. Use `04-implementation-units.md` as the actual build queue.
6. Use `05-milestones.md` as the rollup for stakeholder communication.
7. Resolve `06-open-questions.md` items before sealing scope of any unit.

## Source-of-truth references

- Schema: `aiengineerapp/types/database.types.ts`
- Taxonomy: `aiwiki/docs/03-taxonomy.md` (26 categories × 5 layers)
- Curriculum format: `aiwiki/docs/06-courses-and-components.md`
- Existing slice plan (vault-side): `aiwiki/docs/07-roadmap-slices.md`
