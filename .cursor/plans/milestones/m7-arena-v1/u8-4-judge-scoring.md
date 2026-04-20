# U8.4 — Judge + composite scoring + XP

- **Milestone:** [M7 — Arena v1](./README.md)
- **Spec:** [`04-implementation-units.md` § U8.4](../../04-implementation-units.md)
- **Commit prefix:** `[U8.4]` (lands on milestone branch [`m7-arena-v1`](./README.md))
- **Status:** not-started
- **PR:** —
- **Depends on:** U8.3, U6.1, [U0.5](../../prereqs/u0-5-judge-model-swap.md) (judge model = gpt-4.1-mini)

## Acceptance (link to spec + Q9 cap)

- [ ] Spec acceptance
- [ ] Judge token budget capped at 15k in / 4k out (Q9)
- [ ] `attempt.metadata.judge_model_used` records the actual model used
  for reproducibility
- [ ] `score_event` write is idempotent on `(user_id, kind, ref_kind,
  ref_id)` — replays do not double-award

## Working log

- _2026-04-20_ — unit file created.
