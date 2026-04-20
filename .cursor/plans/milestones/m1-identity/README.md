# M1 — Identity

> **"I can sign up, finish onboarding, and edit my profile."**
>
> Canonical sequencing + gate: [`../../05-milestones.md#m1--identity`](../../05-milestones.md)

## Units

| Unit | File | Status | PR |
|---|---|---|---|
| U2.1 | [u2-1-profile-surface.md](./u2-1-profile-surface.md) | not-started | — |
| U2.2 | [u2-2-onboarding-wizard.md](./u2-2-onboarding-wizard.md) | not-started | — |
| U2.3 | [u2-3-profile-settings.md](./u2-3-profile-settings.md) | not-started | — |
| U9.1 | [u9-1-analytics.md](./u9-1-analytics.md) | not-started | — |

## Gate to M2

A brand-new user can finish onboarding in ≤ 90 s and see their saved tags
reflected in `/settings/profile`.

## Decisions that shape this milestone

- **Q3** — auto-create `profiles` row via trigger
  ([U0.1](../../prereqs/u0-1-auth-trigger.md)). U2.1 never inserts a
  `profiles` row; it only updates.
- **Q10** — single admin (`profiles.is_admin`) via
  [U0.6](../../prereqs/u0-6-admin-bit.md). U2.1 exposes `isAdmin()` helper
  but no admin UI yet.
- **Q11** — public profile visibility is XP + tags + bio only; rendered via
  `public_profile` view ([U0.7](../../prereqs/u0-7-public-profile-view.md)).
- **Q15** — tag pickers bind to `taxonomy.ts` constants, not free-text
  ([U0.10](../../prereqs/u0-10-taxonomy-constants.md)).
