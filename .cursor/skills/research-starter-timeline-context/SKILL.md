---
name: research-starter-timeline-context
description: Research the AI world-context around a two-month bucket of AI Engineer talks and write a sourced context brief. Use when asked to contextualize, summarize, or build the AI story background for a research-starter-timeline chunk, to connect what the talks were about to what was shipping/funding/breaking in AI that month, or to produce the world-events layer for the animated timeline. Owns the by-two-months output contract, the tavily/arxiv/context7/gh evidence rules, and the read-only research_starter_videos query path.
---

# Research starter timeline context

You are given a **two-month window** of AI Engineer conference talks. Your job is to figure out
**what was happening in AI and AI software during that window**, and to connect it to **what the
talks were actually about** — so the timeline can say "this is the month the field turned, and
here is why."

You write one context brief per window. You do not write to the database.

## Read this first

- Input chunks: `aiengineerapp/.cache/research-starter-timeline/by-two-months/`
- Output briefs: **the same directory** — `NN-<label>.context.md` + `NN-<label>.context.json`
- Companion design spec: [`internal/specs/ai-timeline-story-scene.md`](../../../../internal/specs/ai-timeline-story-scene.md)
  — the JSON you emit is the `world` + `theme` layer that spec consumes. Read §7 before your
  first brief.

Run every command from `aiengineerapp/`.

---

## 1. Pick your window

```bash
cat .cache/research-starter-timeline/by-two-months/00-manifest.json
```

14 chunks cover 2023-10 → 2026-08 (27 non-empty months, 1,049 videos as of 2026-08-21). Each
chunk file has `label`, `month_keys`, `start_iso`/`end_iso`, `buckets[]` (per-month) and
`videos[]` (title, published_at, url, duration, views, `transcript_status`).

**Buckets skip empty months.** Chunk 08 is `2025-04 + 2025-06`, not April–May — May 2025 has zero
videos. Always trust `month_keys`, never assume the two months are consecutive.

Take exactly one chunk per task unless told otherwise. One chunk is roughly one session's work.

### Refresh the chunks first if the catalog moved

```bash
pnpm exec tsx scripts/aggregate-research-starter-videos-by-month.ts --include-description
pnpm exec tsx scripts/split-research-starter-timeline-by-two-months.ts
```

`--include-description` is worth it: descriptions carry speaker, org, abstract and timestamps,
and they are your primary evidence about talk content (see §2). The split script only deletes
its own `NN-*.json` / `00-manifest.json` files, so **your `.context.*` briefs survive a
regeneration** — but never point `--out-dir` somewhere else and never `rm -rf` the directory.

---

## 2. Understand the talks

Order of effort — stop as soon as you have enough:

**Tier 1 — titles (free, already in the chunk).** AI Engineer titles are unusually informative:
`"The New Code — Sean Grove, OpenAI"`, `"Code Mode: Let the Code do the Talking - Sunil Pai,
Cloudflare"`. Speaker and org are usually in the title after `—` or `-`. For most windows,
titles alone tell you the topic distribution.

**Tier 2 — descriptions (one query, high value).** Talk abstracts, speaker links, and timestamp
outlines. This is the workhorse. Read-only:

```bash
pnpm exec tsx scripts/query-research-starter-videos.ts \
  --from 2025-02-01 --to 2025-04-01 --with-description --format md
```

**Tier 3 — transcripts (rare, expensive).** Only when you need to verify a specific claim
("did anyone actually discuss the new spec?") or pull a quotable line.

```bash
# who even has one in this window?
pnpm exec tsx scripts/query-research-starter-videos.ts \
  --from 2025-02-01 --to 2025-04-01 --transcripts-only

# then read one
pnpm exec tsx scripts/query-research-starter-videos.ts \
  --video-id kQmXtrmQ5Zg --with-transcript --transcript-chars 20000 --format md
```

**Reality check: only 81 of 1,049 rows have `transcript_status = 'stored'`, and 73 of those are
in 2026-07/2026-08.** For nearly every window, transcripts are not available. Do not block on
them; do not claim you read one when you did not. Check `transcript_status` in the chunk file
before you plan any transcript work.

Also useful — find which talks touch a thing you found in the news:

```bash
pnpm exec tsx scripts/query-research-starter-videos.ts \
  --from 2025-02-01 --to 2025-04-01 --search "model context protocol"
```

That search is how a world event earns its `related_video_ids`.

---

## 3. Research the world context

Four sources, each good at a different thing. Use at least **three** per window. If your MCP
tool names differ from the ones below, list the available tools and map by function rather than
guessing arguments.

### `gh` CLI — hard dated evidence (start here)

Release dates are facts with timestamps, which makes them the strongest evidence you can get and
the cheapest to verify. `gh` 2.87+ is installed and authenticated.

```bash
# what shipped in the window, from a repo that matters to these talks
gh release list --repo modelcontextprotocol/servers --limit 100 \
  --json tagName,name,publishedAt \
  --jq '[.[] | select(.publishedAt >= "2025-02-01" and .publishedAt < "2025-04-01")]'

gh release list --repo vercel/ai --limit 100 --json tagName,publishedAt --jq '...'
gh release list --repo langchain-ai/langgraph --limit 100 --json tagName,publishedAt --jq '...'

# when did a project first appear / how fast did it grow
gh api repos/<owner>/<repo> --jq '{created_at, stargazers_count, description}'

# discussion volume in the window
gh search issues --created 2025-02-01..2025-03-31 --limit 30 \
  "model context protocol" --json title,repository,createdAt,url
```

Pick repos the talks actually name. Do not spray.

### `tavily-remote-mcp` — the news layer

Model releases, funding, launches, acquisitions, controversies. Date-bound every query and
prefer primary sources (a lab's own blog/changelog) over aggregators.

Query templates that work:

- `"<month> <year> AI model release announcement"`
- `"<month> <year> AI agent framework launch"`
- `"<month> <year> AI startup funding round series"`
- `"<company> announcement <month> <year>"` for each org named in ≥2 talk titles
- `"<technology from talk titles>" release OR announcement <month> <year>`

Reject any result whose publication date falls outside the window ±45 days. That single filter
removes most of the noise and nearly all of the hallucination risk.

### `arxiv-mcp-server` — the research layer

Papers published in the window that the talks are downstream of. Search by the technical terms
you extracted from titles/descriptions, then bound by date. Record the arXiv id — that is your
citation. Do not include a paper unless it connects to something a talk discussed or a product
shipped.

### `context-7` — the library-truth layer

Resolve the library id, then pull docs for the frameworks the talks name (AI SDK, LangGraph,
MCP SDKs, LlamaIndex, Agents SDK). Use it to answer "what did this framework actually support at
that time" — it keeps you from describing a capability that landed six months later. Context7 is
for *what existed*, not *when it was announced*; date claims come from `gh` or Tavily.

---

## 4. Connect the two layers

This is the part that matters. A brief that lists talks and separately lists news is worthless;
the value is the join. For each candidate world event ask:

1. **Does it precede and explain the talks?** A spec ships in month 1, four talks in month 2 are
   about it. Strong. Record it.
2. **Does a talk precede and predict the event?** Rarer, better story. Record it.
3. **Do they merely co-occur?** Then say so — `"connection": "co-occurring"` — and do not write
   a causal sentence.

Rules:

- A connection needs a **named anchor**: a video_id, or a term appearing in ≥2 talk titles or
  descriptions. "The vibe of the month" is not an anchor.
- Use `--search` (§2) to confirm the term actually appears before you assert the link.
- **Absence is a finding.** If a major release got zero talks that window, write that down — the
  lag between the world and the conference stage is itself the story.
- Distinguish "the field shifted" from "a conference happened." Feb 2025 has 78 videos because
  the Summit dumped its recordings, not because February was 8× more eventful. Every spike has a
  conference behind it — check `public.event` or the talk titles before reading meaning into
  volume.

---

## 5. Output contract

Write **both** files into
`aiengineerapp/.cache/research-starter-timeline/by-two-months/`, named after the source chunk:

```
07-02-01-2025_04-01-2025.json           <- input (do not edit)
07-02-01-2025_04-01-2025.context.md     <- your brief, human-readable
07-02-01-2025_04-01-2025.context.json   <- your brief, machine-readable
```

### `.context.json`

```json
{
  "schema_version": 1,
  "chunk_index": 7,
  "chunk_file": "07-02-01-2025_04-01-2025.json",
  "label": "02-01-2025 - 04-01-2025",
  "month_keys": ["2025-02", "2025-03"],
  "start_iso": "2025-02-01T00:00:00.000Z",
  "end_iso": "2025-04-01T00:00:00.000Z",
  "generated_at": "<ISO timestamp>",
  "researched_by": "<agent/model name>",
  "reviewed": false,

  "narrative": {
    "headline": "<= 60 chars, the scene title",
    "body": "2-3 sentences. What this window was about.",
    "what_changed": "One sentence: what was true after that was not true before.",
    "carryover_from_previous": "One sentence or null.",
    "sets_up_next": "One sentence or null."
  },

  "months": [
    {
      "key": "2025-02",
      "video_count": 78,
      "event_context": "AI Engineer Summit 2025, NYC — explains the volume.",
      "dominant_topics": ["agent orchestration", "evals", "MCP"],
      "notable_videos": [
        { "video_id": "...", "title": "...", "why": "one line" }
      ]
    }
  ],

  "world_events": [
    {
      "slug": "kebab-case-unique",
      "kind": "model_release",
      "occurred_on": "2025-02-24",
      "importance": 4,
      "headline": "<= 90 chars",
      "summary": "2-3 sentences, plain and factual.",
      "org_slugs": ["anthropic"],
      "product_slugs": [],
      "paper_ids": [],
      "sources": [
        {
          "url": "https://...",
          "title": "...",
          "publisher": "...",
          "published_on": "2025-02-24",
          "accessed_at": "<ISO timestamp>",
          "tool": "tavily"
        }
      ],
      "related_video_ids": ["..."],
      "connection": "explains_talks",
      "connection_note": "One sentence naming the anchor term or video.",
      "confidence": "high"
    }
  ],

  "topic_shifts": [
    { "topic": "MCP", "direction": "rising", "evidence": "0 talks in prior window, 6 here" }
  ],

  "open_questions": ["Anything you could not resolve."],

  "coverage": {
    "videos_in_window": 87,
    "titles_reviewed": 87,
    "descriptions_reviewed": 87,
    "transcripts_read": [],
    "tools_used": ["gh", "tavily", "arxiv", "context7"],
    "searches_run": 14
  }
}
```

Enum values, fixed:

| field | allowed |
|---|---|
| `kind` | `model_release`, `product_launch`, `funding`, `acquisition`, `leadership_change`, `breakthrough`, `benchmark`, `paper_drop`, `partnership`, `open_source`, `controversy`, `regulation`, `shutdown`, `ipo`, `earnings`, `rumor` |
| `importance` | `1`–`5` int. `5` = the field reorganized around it. `4` = every AI engineer heard about it. `3` = notable. Ship `>= 4`; include `3` if it links to a talk. |
| `connection` | `explains_talks`, `predicted_by_talk`, `co_occurring`, `none` |
| `confidence` | `high` (primary source + dated), `medium` (secondary source), `low` (inferred — must appear in `open_questions` too) |

`kind` and `importance` map 1:1 onto `public.news_item`, so a later ingest script can load these
briefs straight in. Do not invent new `kind` values.

### `.context.md`

Same content, written for a human reader:

```markdown
# February – March 2025

**87 talks · 2 months · AI Engineer Summit 2025 (NYC)**

## The story
<narrative.body, 2-3 sentences>

## What the talks were about
<3-6 bullets, topic clusters with representative talk titles + video_ids>

## What was happening in AI
<one bullet per world_event: date — headline — [source](url)>

## Where they connect
<the joins, explicitly. name the anchor term or video each time.>

## What did not connect
<major events with no talk coverage, and the lag that implies>

## Open questions
<what you could not verify>
```

---

## 6. Evidence rules (non-negotiable)

- **Every world event carries ≥1 source with a real URL you retrieved this session** and an
  `accessed_at`. No source, no event. Do not cite from memory.
- **Never write a date you did not read from a source.** `gh` release timestamps and primary
  blog posts are best.
- **Stay inside the window.** `occurred_on` outside `start_iso`/`end_iso` ±45 days does not
  belong in this brief; it belongs in the neighboring one.
- **`reviewed: false` always.** You are drafting. A human sets it true. Never set it yourself.
- **Never assert a causal link you cannot anchor** to a video_id or a term you confirmed with
  `--search`. Use `co_occurring` — it is an honest and useful answer.
- **Cap it at 8 world events per window.** More than that means you stopped filtering. Density
  of importance beats coverage.
- If you find nothing notable in a window, say so in one sentence and emit an empty
  `world_events` array. A thin honest brief beats a padded one.

## 7. Don'ts

- **Don't write to Supabase.** This skill is read-only against the DB. Loading briefs into
  `news_item` is a separate, human-approved step (see the `supabase-writer` skill).
- **Don't edit the source chunk files** (`NN-*.json`) or `00-manifest.json` — they are
  regenerated and your edits will be lost.
- **Don't run the split script with a different `--out-dir`** to "keep things tidy". The briefs
  live next to their chunks on purpose.
- **Don't use `scripts/apply-sql.ts`** to read data. It is a write path. Use
  `scripts/query-research-starter-videos.ts`.
- **Don't infer significance from video count.** It measures conference scheduling, not the
  field (§4).
- **Don't fabricate speaker or org affiliation.** If the title doesn't say it and the
  description doesn't say it, leave it out.

## 8. Pointers

| What | Where |
|---|---|
| Chunk files + your output | `aiengineerapp/.cache/research-starter-timeline/by-two-months/` |
| Read-only video/transcript query | [`scripts/query-research-starter-videos.ts`](../../../scripts/query-research-starter-videos.ts) |
| Month aggregate builder | [`scripts/aggregate-research-starter-videos-by-month.ts`](../../../scripts/aggregate-research-starter-videos-by-month.ts) |
| Two-month splitter | [`scripts/split-research-starter-timeline-by-two-months.ts`](../../../scripts/split-research-starter-timeline-by-two-months.ts) |
| Table schema | `supabase/migrations/20260814025347_research_starter_videos.sql` |
| Target schema for world events | `supabase/migrations/20260418120500_add_news_items.sql` |
| Timeline design spec (why this exists) | `internal/specs/ai-timeline-story-scene.md` |
| Category taxonomy (27 buckets) | `aiwiki/.../04_catalogs/youtube/aiengineerchannel/by_category/` |
| DB write path (separate, gated) | `.cursor/skills/supabase-writer/SKILL.md` |
