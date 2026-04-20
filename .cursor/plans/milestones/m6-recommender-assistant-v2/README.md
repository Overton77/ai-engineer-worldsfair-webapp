# M6 — Recommender v2 + Assistant v2

> **"Recommendations are personalized; the assistant can take actions for me."**
>
> Canonical sequencing + gate: [`../../05-milestones.md#m6--recommender-v2--assistant-v2`](../../05-milestones.md)

## Units

| Unit | File | Status | PR |
|---|---|---|---|
| U5.2 | [u5-2-interest-vector-recommender.md](./u5-2-interest-vector-recommender.md) | not-started | — |
| U6.3 | [u6-3-tool-calls.md](./u6-3-tool-calls.md) | not-started | — |
| U6.4 | [u6-4-ask-chat.md](./u6-4-ask-chat.md) | not-started | — |
| U9.3 | [u9-3-inngest.md](./u9-3-inngest.md) | not-started | — |

## Gate to M7

Assistant tool-call success rate > 90% on a fixed prompt suite; recommender
CTR beats rule-based in a 1-week dogfood A/B.

## Decisions that shape this milestone

- **Q12** — conversations live in **dedicated tables**
  (`assistant_conversation`, `assistant_message`) that mirror the Vercel
  AI SDK message shape. U6.4 rewrites the spec-in-04's "co-opt notes"
  proposal. Migration lives in
  [U0.8](../../prereqs/u0-8-assistant-tables.md).
- **Q15** — U5.2's tag-overlap signal uses canonical taxonomy constants;
  free-text tags on legacy profiles are normalized by the one-shot in
  [U0.10](../../prereqs/u0-10-taxonomy-constants.md).
- **Q9** — tool-call responses that include LLM-written text use
  `gpt-4.1-mini` / `gemini-2.x-flash`; structured outputs preferred
  wherever possible.
