# 03a — Notes & Note Workspaces (M3 rethink)

> Companion to [`03-wireframes.md`](./03-wireframes.md). This document
> **supersedes** sections **D (Notes tab)**, **G (Notes Workspace)** and the
> "Notes" callout inside every dossier wireframe for the duration of M3.
> Where this file disagrees with §D / §G in `03-wireframes.md`, **this
> file wins** and the older sections should be treated as historical
> intent.
>
> Companion plans:
> - Milestone: [`milestones/m3-capture-v1/README.md`](./milestones/m3-capture-v1/README.md)
> - Units affected: [U4.3](./milestones/m3-capture-v1/u4-3-notes-data.md),
>   [U4.4](./milestones/m3-capture-v1/u4-4-tiptap-editor.md),
>   [U4.5](./milestones/m3-capture-v1/u4-5-notes-workspace.md),
>   [U4.6](./milestones/m3-capture-v1/u4-6-entity-pinned-notes.md)
> - Existing surfaces to wire into:
>   [`app/(app)/explore/[type]/_explore-shell.tsx`](../../app/(app)/explore/[type]/_explore-shell.tsx),
>   [`app/(app)/video/[id]/page.tsx`](../../app/(app)/video/[id]/page.tsx),
>   [`app/(app)/video/[id]/_video-shell.tsx`](../../app/(app)/video/[id]/_video-shell.tsx)

Legend (additions to the global legend):

- `▢ Drawer` — right-side overlay panel (`Sheet`); does not navigate
- `║ Split` — full-screen 2-pane split with URL state
- `⏱ 12:45` — timestamp citation chip (clickable, seeks the player)
- `📌 Pin` — pin a note to the entity in view
- `📝 Note` — launch the note surface for the current entity

---

## 0. Why we're re-doing this

The original §G (`/notes` two-pane workspace) and §D ("Notes (3)" tab on
each dossier) are both **destination** surfaces — the user has to leave
what they were doing to write a note. That contradicts the M3 gate
("≥ 5 notes and ≥ 10 saves in a session without confusion") and the
explicit user need around **watching a video and taking notes at the
same time**.

The rethink introduces three *invocable* surfaces that always keep the
**source entity** visible while the user writes:

| Surface | Invoked from | Layout | Persistence |
|---|---|---|---|
| **N1. Quick-Drawer** | any entity card / row, anywhere | right-side `Sheet` (~ 520 px) over current page | URL: `?note=<id>\|new` |
| **N2. Entity-Notes Split** | dossier toolbar `[║ Notes]` | full screen, 60/40 split | URL: `?notes=split` |
| **N3. Watch + Notes** | video dossier (default for `youtube_video`) | 3-zone: player · chapters/notes-tabs · notes editor | URL: `?notes=split` (auto-on for video) |

The destination workspace **N4. `/notes`** stays — it's the index for
"all my notes across everything". But it now **launches into the same
split view** when you open a pinned note, instead of dropping you into
an editor with no context.

---

## 1. Note surfaces taxonomy

```
                  ┌──────────────────────────────────────────┐
                  │           Notes write-surfaces           │
                  └──────────────────────────────────────────┘
                                      │
       ┌──────────────────┬───────────┴───────────┬──────────────────┐
       ▼                  ▼                       ▼                  ▼
   N1 Drawer         N2 Split View          N3 Watch+Notes      N4 Workspace
  (peek+edit         (focus on entity        (video player       (manage all
   over current      + notes 60/40)          + notes side)        my notes)
   page, no nav)
       │                  │                       │                  │
       └────────┬─────────┴─────────┬─────────────┘                  │
                ▼                   ▼                                ▼
         Same TipTap editor (U4.4) — single component, mounted in any container.
         Same `useNote(entityRef)` hook — list, autosave, mention picker.
         Same URL contract (`?note=`, `?notes=`) — bookmarkable / shareable.
```

**Single editor, three frames.** All four surfaces mount the **same**
`<NoteEditor noteId | entityRef />` component built in U4.4. The
difference is purely the chrome around it. That keeps interactions
(autosave timing, mention picker, slash menu, keyboard shortcuts)
identical everywhere and removes the temptation to fork behaviour per
surface.

---

## N1. Note Quick-Drawer  (invoked from anywhere)

> **Purpose:** zero-navigation way to capture a thought about *this
> thing I'm looking at* without leaving the list / dossier / search
> result I'm on.

### N1.a Drawer over an Explore result list

```
┌─ /explore/youtube_video?q=gepa ─────────────────────────────────────────────────┐
│ Explore                                                                          │
│ [People] [Orgs] [Libraries] [Papers] [Talks] [Videos●] [Sessions]               │
│ 🔍 Search Videos…  [gepa                                          ]              │
├──────────────────────┬──────────────────────────────────────┬───────────────────┤
│ Filters              │ 31 results · sort [Best match ▾]     │ ▢ Drawer  [×]     │
│ ────────────────     │ ┌────────────────────────────────┐   │ ════════════════  │
│ Layer                │ │ ▶ 14:02  Agenta GEPA workshop  │   │ 🎬 Agenta GEPA    │
│ [✓] L5 Eval          │ │ Channel · 47 min · 12k views   │   │    workshop       │
│ Tags                 │ │ … snippet w/ <mark>gepa</mark> …│  │ Channel · 47 min  │
│ • agents ×           │ │ [▶ Open] [★ Save] [📝 Note●]   │   │ ─────────────────│
│ • rag ×              │ └────────────────────────────────┘   │ My notes (0)      │
│                      │ ┌────────────────────────────────┐   │ ┌──────────────┐  │
│                      │ │ ▶  GEPA basics walkthrough     │   │ │ + New note   │  │
│                      │ │ Channel · 18 min · 5k views    │   │ └──────────────┘  │
│                      │ │ [▶ Open] [★ Save] [📝 Note]    │   │  — or —           │
│                      │ └────────────────────────────────┘   │ ────────────────  │
│                      │ ┌────────────────────────────────┐   │ Title: <untitled> │
│                      │ │ … 29 more …                    │   │ ────────────────  │
│                      │ └────────────────────────────────┘   │ [B][I][H][•=]…    │
│                      │                                      │ ────────────────  │
│                      │                                      │ ▌ Start typing…   │
│                      │                                      │                   │
│                      │                                      │  📌 Pinned to:    │
│                      │                                      │  [🎬 Agenta GEPA] │
│                      │                                      │                   │
│                      │                                      │ ✓ saved 2s ago    │
│                      │                                      │ [Open in split ↗] │
└──────────────────────┴──────────────────────────────────────┴───────────────────┘
```

**Regions** (drawer, ~520 px wide):

1. **Entity strip** (sticky top) — thumbnail/avatar, title, subtitle,
   one-line meta. Mirrors what the source card shows so the user knows
   exactly which entity the drawer is bound to. Clicking the title
   navigates to the dossier (with a guard prompt if the editor is dirty
   and unsaved).
2. **My notes for this entity** (collapsible) — list of existing notes
   pinned to this entity (newest first). Empty state shows just
   `[+ New note]`. ≥ 1 note: shows note rows + a `[+ New]` row.
   - Selecting a note row swaps the editor below to that note.
   - The currently-active note row gets an `●` indicator.
3. **Editor** — the same `<NoteEditor>` used in N2/N3/N4. Pinned-to
   chip is pre-filled and read-only inside the drawer (you can change
   it from the workspace; the drawer is intentionally about *this*
   entity).
4. **Drawer footer** — autosave indicator + `[Open in split ↗]` to
   promote to N2 without losing the entity context.

**Primary interactions:**

- **Open:** click the `[📝 Note]` quick action on any entity card or
  row, or press `n` while the row is hovered/focused. URL gains
  `?note=<id>` (existing) or `?note=new&pinTo=<kind>:<id>` (creating).
- **Close:** `Esc` / `[×]` / clicking outside. Autosave flushes first.
- **Promote to split:** `[Open in split ↗]` → navigates to the
  entity dossier with `?notes=split&note=<id>`.
- **Promote to fullscreen workspace:** `⌘⇧N` opens the same note in
  N4 `/notes/[id]`.
- **Keyboard:** `⌘S` flush autosave, `⌘↵` save & close, `⌘K` mention
  picker, `/` slash menu (later), `⌘⇧K` "insert citation" (N3 only).

**Where it appears (invocation points across the app):**

| Surface | Where the `[📝 Note]` lives |
|---|---|
| `/explore/[type]` result rows | `[📝 Note]` in the per-card quick-action stack (alongside `[★]` `[🔔]`) |
| `/saved` row | `[📝]` in the row's right-edge action cluster (already mocked in §F) |
| `/follows` row | same |
| `/search` result row | `[📝]` next to `[★] [🔔]` |
| `/p/[slug]` & every dossier hero | `[📝 Note]` button in the hero (already mocked in §D) |
| `/video/[id]` chapter list | `[📝]` per chapter row → opens drawer with timestamp pre-inserted (see N3) |
| Right-rail Assistant citation | `[📝 Note this]` already mocked in §J |
| Cmd-K palette | `Note about: <result>` action when Enter-modified |

**Data dependencies:** `notes` (list by `entity_type/entity_id`,
upsert single row), `saved_items.entity_title` denorm for the strip
(or freshly fetched dossier-lite), `useSaveFollow` so the entity strip
can also expose `[★] [🔔]` mirroring the source row.

**Why a drawer and not a popover.** A popover would lose state on
scroll / navigation and we explicitly want the user to be able to
**keep typing while scrolling the result list** to find another
related entity. A right-side `Sheet` keeps the full result list
interactive in the background while the editor is alive.

---

## N2. Entity ↔ Notes Split View

> **Purpose:** focus mode for "I'm reading this dossier and writing
> about it". Pattern reused for non-video dossiers (Person, Org,
> Library, Paper, Module …).

```
┌─ /p/shreya?notes=split ───────────────────────────────────────────────────────────┐
│ < back to People                                                                   │
│ ┌─ Hero (compact) ────────────────────────────────────────┐ [║ Notes●] [×]        │
│ │ [Avatar] Shreya Shankar    [★] [🔔] [📝]  L1 · L5       │  (split toggle)       │
│ └─────────────────────────────────────────────────────────┘                       │
├──────────────────────────────────────────────┬───────────────────────────────────┤
│ Entity pane (≈ 60 %)                          │ Notes pane (≈ 40 %)               │
│ ───────────────────                           │ ───────────────────               │
│ [Overview] [Relationships] [In corpus] [Media]│ Notes for Shreya Shankar  (3)     │
│                                               │ ┌──────────────────────────────┐  │
│ Overview                                      │ │ ● Why GEPA matters — 2m ago  │  │
│   <bio markdown>                              │ │   "GEPA pairs the judge…"    │  │
│   "Notable for: <notable_for>"                │ ├──────────────────────────────┤  │
│                                               │ │   Eval rubric brainstorm     │  │
│ Relationships                                 │ │   updated 3d ago             │  │
│   ▸ Works at         <org link>               │ ├──────────────────────────────┤  │
│   ▸ Co-authored with <chips>                  │ │   [+ New note]               │  │
│                                               │ └──────────────────────────────┘  │
│ In the corpus                                 │ ────────────────────────────────  │
│   Talks (12)                                  │ Title: Why GEPA matters           │
│   ┌─ Video card ──────────────────────────┐   │ 📌 Pinned to: [Person: Shreya]    │
│   │ thumb · title · channel · 47m · 12k   │   │ ────────────────────────────────  │
│   │ "Speaker"                             │   │ [B][I][H][•=][{ }][<>][@]         │
│   └───────────────────────────────────────┘   │ ────────────────────────────────  │
│   …                                           │  ## Why GEPA matters              │
│                                               │                                   │
│                                               │  GEPA pairs the judge with…       │
│                                               │  see @library:agenta and          │
│                                               │  @paper:gepa-2024                 │
│                                               │                                   │
│                                               │  - [ ] Calibrate vs ground truth  │
│                                               │  - [x] Read Agenta dossier        │
│                                               │                                   │
│                                               │  ✓ saved · 1,247 chars            │
│                                               │ [Export md] [Delete] [⛶ Focus]    │
└──────────────────────────────────────────────┴───────────────────────────────────┘
```

**Regions:**

1. **Compact dossier hero** (full width, sticky) — same as §D hero but
   shorter; the `[║ Notes]` toggle is the toolbar control that flips
   between **single** (notes hidden) and **split** modes.
2. **Entity pane** — exactly the dossier body from §D; resizable
   divider (`react-resizable-panels`) between 50–70 %.
3. **Notes pane** — note list (top) + active editor (bottom).
   Identical chrome to N1 except the pinned-to chip is editable and
   the editor has more vertical room.

**Primary interactions:**

- `[║ Notes]` toggles `?notes=split` ↔ removes param. State is
  remembered per-entity-kind in `localStorage` so a user who always
  watches videos with notes open gets that as the default.
- Clicking any chip / link in the entity pane (e.g. `@library:agenta`)
  navigates **only the entity pane** if it goes to another dossier
  *and* a note is currently open and dirty — we offer "follow the
  link in this pane" vs "open in new tab". (Default: navigate the
  whole page; the dirty-guard happens automatically because autosave
  has already flushed.)
- **Insert relationship as mention:** dragging a relationship chip
  from the entity pane into the editor inserts an `@`-mention.
- `[⛶ Focus]` collapses the entity pane to a thin rail (just the
  hero + a "Show entity" button), giving the editor full width
  without losing the pin.

**State precedence between the three modes for the same entity:**

```
none           N1 drawer        N2 split          N4 workspace
(no notes)  ─►  (?note=)   ─►  (?notes=split)  ─►  /notes/[id]
                  │ open in split ↗      │ ⌘⇧N
                  ▼                      ▼
                always promotes; same noteId is preserved through every step
```

**Data:** dossier loaders unchanged; new `listNotesForEntity({kind,
id})` (U4.3) called once per entity-pane render and revalidated after
each autosave. Autosave returns the freshly-derived
`content_text + updated_at` so the list row preview stays current.

---

## N3. Watch + Notes  (the marquee video flow)

> **Purpose:** the headline use case the user called out — *watching
> an AI Engineer YouTube video and taking notes at the same time,
> with one-click timestamp citations.* This is N2 specialised for
> `youtube_video` dossiers.

The video dossier opens in **split mode by default** (after the
user's first opt-in; toggle remembered per-user via the same
`localStorage` key as N2). The chapter list moves *into* the notes
pane as a tab, so the editor gets the right column and the video
keeps its 16:9 box on the left.

### N3.a Default layout — `/video/[id]?notes=split` (default for video)

```
┌─ /video/[id]?notes=split ─────────────────────────────────────────────────────────┐
│ < back to Videos        🎬 Agenta GEPA workshop                  [║ Notes●] [×]   │
│   [★] [🔔] [📝] [🤖 Ask]   Channel · 47 min · 12k views · published Apr 2026      │
├──────────────────────────────────────────────┬───────────────────────────────────┤
│ ┌──────────────────────────────────────────┐ │ ◖ Notes (2)  ◗ Chapters (14)      │
│ │                                          │ │ ─────────────────────────────────│
│ │                                          │ │ ┌─────────────────────────────┐  │
│ │            ▶ Player (16:9)               │ │ │ ● GEPA workshop notes  2m   │  │
│ │            00:14:02 / 00:47:33           │ │ │   "Started with the judge…" │  │
│ │            [⏯ ⏮ ⏭   ━━━━━●━━━━  🔊 ⛶ ]   │ │ ├─────────────────────────────┤  │
│ │                                          │ │ │   Quote bank for blog post  │  │
│ │                                          │ │ │   updated yesterday         │  │
│ └──────────────────────────────────────────┘ │ ├─────────────────────────────┤  │
│                                              │ │   [+ New note]              │  │
│ Mentions                                     │ └─────────────────────────────┘  │
│ ▸ Speakers          [Shreya] [Ankur]         │ ───────────────────────────────  │
│ ▸ Libraries         [Agenta] [DSPy]          │ Title: GEPA workshop notes       │
│ ▸ Papers            [GEPA 2024]              │ 📌 Pinned to: [🎬 Agenta GEPA]    │
│ ▸ Linked talk       [Session]                │ ───────────────────────────────  │
│                                              │ [B][I][H][•=][{ }][⏱][@]…        │
│ Transcript & chunks (later)                  │ ───────────────────────────────  │
│   ▸ 00:00 Intro                              │  ## What clicked                  │
│   ▸ 14:02 GEPA mechanics                     │                                   │
│                                              │  Pairwise judges only beat        │
│                                              │  scalar when the rubric is        │
│                                              │  underspecified — see ⏱ 14:02     │
│                                              │                                   │
│                                              │  > "GEPA optimizes the judge      │
│                                              │  >  itself…"  ⏱ 21:48             │
│                                              │                                   │
│                                              │  - [ ] Try Agenta on side-proj    │
│                                              │  - [ ] Re-watch ⏱ 31:10 (calib.)  │
│                                              │                                   │
│                                              │  ✓ saved · 412 chars              │
│                                              │ [⛶ Editor focus]  [↘ Theatre]     │
└──────────────────────────────────────────────┴───────────────────────────────────┘
```

### N3.b The four interactions that make this flow great

1. **Insert current timestamp** (toolbar `[⏱]`, keyboard `⌘⇧K`):
   inserts a `timestampMention` node: `⏱ 14:02`. Stored in
   `content_json` as
   `{type: "timestampMention", attrs: {videoId, seconds: 842}}`.
   Renders as a chip; clicking it calls
   `playerRef.current.seekTo(842)` and updates `?t=842` exactly the
   way `_video-shell.tsx` already does.

2. **Pin a chapter** (`[📝]` on any chapter row in the Chapters tab):
   creates a new note row pre-titled with the chapter title and
   prepends `⏱ <chapter.start>` followed by a `>` blockquote
   placeholder for the user's reaction. Helpful when a user wants
   one note per chapter for long workshops.

3. **Quote chip → blockquote** (right-click selected transcript line,
   later phase): inserts the line as a `> blockquote` followed by a
   `⏱ <time>` citation. M3 ships this as just the manual
   `⌘⇧K` flow; transcript-selection lands with chunks/transcripts in
   M4.

4. **Click-to-seek from the note**: every `⏱ MM:SS` chip seeks the
   player. Hovering shows a `[Open new tab @ MM:SS]` overlay. This
   makes a note a *navigable* table-of-contents over the video.

### N3.c Layout variants

| Variant | Trigger | Notes pane | Player |
|---|---|---|---|
| **Split (default)** | first visit (auto) or `[║ Notes]` on | 40 % right | 60 % left, 16:9 |
| **Theatre** | `[↘ Theatre]` button | hidden; "Show notes" pill bottom-right | full width, larger |
| **Editor focus** | `[⛶ Editor focus]` | full width | shrinks to floating PiP top-right (240×135), draggable |
| **Notes off** | `[║ Notes]` toggle off | gone | classic dossier from `_video-shell.tsx` |

The PiP variant is what unlocks "I'm typing furiously and the speaker
is still talking" without yanking the editor away. PiP uses the
existing `<VideoPlayer>` ref; we just re-portal it into a fixed
container.

### N3.d Concrete component plan (for U4.5 / U4.6)

The current
[`_video-shell.tsx`](../../app/(app)/video/[id]/_video-shell.tsx) is
already split into "player + chapter list" — the rethink is:

- **Hoist** the player + its `useQueryState("t")` into a
  `<VideoNotesShell>` so both the chapters tab and the notes editor
  can call `seekTo()` and read `t`.
- **Replace** the right column's chapter scroller with a tabbed panel:
  `Notes | Chapters`. Default tab = `Notes` when `?notes=split`.
- **Move** the `<NotesPlaceholder />` block in
  [`page.tsx`](../../app/(app)/video/[id]/page.tsx) from below the
  player to *be* the right pane. The "Notes" section in the dossier
  body stays as a fallback for `notes=off` mode (just the count + CTA).
- The editor reads/writes via the shared `useNote(entityRef)` hook
  (U4.3) — no video-specific persistence.

```ts
// pseudocode for U4.5 wiring
const [layout] = useNotesLayout("youtube_video");      // 'split' | 'theatre' | 'focus' | 'off'
const [t] = useQueryState("t", parseAsInteger.withDefault(0));
const playerRef = useRef<VideoPlayerHandle>(null);
const noteCtx: TimestampInsert = (sec) => editor.commands.insertTimestamp({ videoId, seconds: sec });
const seek = (sec) => { setT(sec); playerRef.current?.seekTo(sec); };
```

---

## N4. Notes Workspace `/notes`  (refined)

The G workspace stays, with three changes:

1. **Open-in-split** as the default action for any pinned note. Old
   default was "open editor full screen and lose the entity"; new
   default is **navigate to the entity dossier with the note open in
   N2 split**. A secondary `[Editor only]` action keeps the §G
   behaviour for users who really want it.
2. **"Untethered" notes** (`entity_type IS NULL`) keep §G's two-pane
   layout because there's no entity to split with.
3. **Recently-edited everywhere** rail at the top: the last 5 notes
   the user touched, regardless of pin, so context-switchers can
   resume in one click.

```
┌─ /notes ───────────────────────────────────────────────────────────────────────────┐
│ 🔍 Search notes…                                              [+ New freeform]     │
├──────────────────────────┬─────────────────────────────────────────────────────────┤
│ Filters                  │ Recently edited                                  ▸ more │
│  All notes (87)          │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                │
│  Pinned to entity        │ │GEPA │ │Shrey│ │Eval │ │Free │ │Calib│                │
│   ▸ People (12)          │ │📌vid│ │📌pers│ │📌crse│ │     │ │📌pap│                │
│   ▸ Orgs (8)             │ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                │
│   ▸ Libraries (5)        ├─────────────────────────────────────────────────────────┤
│   ▸ Talks (22)           │ All notes · sort [Updated ▾]                            │
│   ▸ Modules (6)          │ ┌───────────────────────────────────────────────────┐  │
│  Freeform (34)           │ │ 📌🎬 GEPA workshop notes        Open ↗  Editor    │  │
│                          │ │     2m ago · 412 chars · ⏱ 3 citations            │  │
│ Tags                     │ │     "Pairwise judges only beat scalar when…"      │  │
│  [+ filter by tag]       │ ├───────────────────────────────────────────────────┤  │
│                          │ │ 📌👤 Why GEPA matters           Open ↗  Editor    │  │
│ ──────────────────────── │ │     1h ago · 1.2k chars · @library:agenta         │  │
│ [+ New (with entity…)]   │ │     "GEPA pairs the judge with the policy…"       │  │
│                          │ ├───────────────────────────────────────────────────┤  │
│                          │ │    Random shower thought                Editor    │  │
│                          │ │    (no pin) · 3d ago · 80 chars                   │  │
│                          │ └───────────────────────────────────────────────────┘  │
│                          │ [Load more]                                             │
└──────────────────────────┴─────────────────────────────────────────────────────────┘
```

**Per-row actions:**
- `[Open ↗]` (default for pinned): navigates to the entity dossier
  with `?notes=split&note=<id>`.
- `[Editor]`: routes to `/notes/[id]` — the §G two-pane focus mode.
- Right-click → contextual menu (Duplicate, Pin to…, Export md,
  Delete).

**`[+ New (with entity…)]`** opens a cmdk picker (uses
`search_fuzzy`); selecting an entity routes to its dossier with
`?notes=split&note=new`. Dismissing the picker creates an unpinned
freeform note in `/notes/[id]`.

---

## 5. Cross-cutting interactions

### 5.1 The TipTap node types we need (U4.4)

| Node | Renders as | Stored as | Where used |
|---|---|---|---|
| `paragraph`, `heading`, `bulletList`, `orderedList`, `taskList`, `codeBlock`, `blockquote`, `link` | standard | TipTap defaults | everywhere |
| `entityMention` | `[Kind: Title]` chip linking to dossier | `{type, attrs:{kind, id, slug, title}}` | everywhere; trigger `@` |
| `timestampMention` | `⏱ MM:SS` chip; click → `seekTo` | `{type, attrs:{videoId, seconds}}` | N3 only; trigger `⌘⇧K` (and chapter `[📝]`) |
| `citationBlock` (later, M4) | callout w/ chunk text + source | `{type, attrs:{chunkId}}` | assistant "Note this" |

`content_text` derivation (U4.3) flattens mentions to plain text:
- `entityMention` → `<Title>` (so FTS still hits)
- `timestampMention` → `MM:SS` (so users can search "14:02")

### 5.2 Autosave & dirty state

- Debounce 500 ms after last keystroke (U4.4 acceptance).
- `beforeunload` flush if the editor is dirty.
- Drawer/split close: synchronous `flushSync` save, then close.
- Optimistic list update: the note list (drawer / N4) replaces the
  row preview from the just-returned `content_text` slice so the user
  sees their edit reflected immediately.

### 5.3 Keyboard shortcuts (consistent across N1–N4)

| Shortcut | Action |
|---|---|
| `n` (when entity row focused) | Open Quick-Drawer (N1) |
| `⇧n` | Open in Split (N2/N3) |
| `⌘⇧N` | Open active note in Workspace (N4) |
| `⌘S` | Force flush autosave |
| `⌘↵` | Save & close drawer/split notes pane |
| `Esc` | Close drawer; toggle split off |
| `⌘K` | `@` mention picker (also typing `@`) |
| `⌘⇧K` | Insert timestamp citation (N3 only) |
| `⌘.` | Toggle Assistant drawer (existing global) |

### 5.4 URL contract (the source of truth)

Every notes surface is bookmarkable.

| Surface | URL | Notes |
|---|---|---|
| N1 drawer (existing note) | `…?note=<id>` | overlays whatever page you're on |
| N1 drawer (new) | `…?note=new&pinTo=<kind>:<id>` | creates on first keystroke |
| N2 split | `/<dossier>?notes=split` | optional `&note=<id>` to land on a specific note |
| N3 watch+notes | `/video/[id]?notes=split&t=842` | `t` already exists; `notes=split` is additive |
| N3 theatre | `/video/[id]?notes=theatre` | notes pane hidden but session preserved |
| N4 list | `/notes?pin=<kind>&tag=<t>` | filter chips reflected in URL |
| N4 focus editor | `/notes/[id]` | §G two-pane fallback |

The `notes=` and `note=` params are independent and orthogonal; the
shell decides what to render based on the combination.

---

## 6. Where each surface appears (invocation matrix)

| From … | `[📝 Note]` does | Why |
|---|---|---|
| `/explore/[type]` card | open **N1 drawer** | keep scanning the result list |
| `/saved` row | open **N1 drawer** | quick capture without leaving the saved index |
| `/follows` row | open **N1 drawer** | same |
| `/search` result | open **N1 drawer** | same |
| Cmd-K result item | open **N1 drawer** | same; faster than navigating |
| `/p/[slug]` & non-video dossiers | toggle **N2 split** | dossier *is* the context |
| `/video/[id]` | toggle **N3 watch+notes** | video is the context, timestamps matter |
| `/courses/.../m/[moduleSlug]` | open **N2 split** in the existing right rail (§H2) — module already has a 3-column layout, so notes get the right pane | matches existing module reader |
| Assistant citation `[📝 Note this]` | open **N1 drawer** pre-filled with the cited block as a `> blockquote` + `⏱ MM:SS` if a video citation | bridges Assistant → personal corpus |

---

## 7. Empty states & first-run nudges

- **Drawer, no notes for entity:** big `[+ New note]` CTA, beneath it
  a one-line tip: *"Notes are pinned to this entity. Find them again
  on its page or in /notes."*
- **Drawer, anonymous user (when public-mode lands later):** disabled
  editor, `[Sign in to write]` overlay.
- **Video first visit:** `?notes=split` is **off** by default; we
  show a subtle banner above the player on first video view per user:
  *"Watch + take notes at the same time → [Try split mode]"*. Click
  flips `?notes=split` on and writes `notes_layout.youtube_video =
  'split'` to `localStorage`. Banner dismisses.
- **Workspace empty:** "Capture your first thought" with three big
  cards: *(1) Quick note from any entity*, *(2) Watch a video and take
  timestamped notes*, *(3) Just start writing*.

---

## 8. Data & infra touchpoints

These are unchanged at the schema level — the `notes` table from
`01-feature-architecture.md` already has everything we need:

```text
notes(
  id, profile_id, title,
  content_json jsonb,         -- TipTap doc
  content_text text,          -- derived for FTS
  entity_type text NULL,      -- pin (NULL = freeform)
  entity_id   uuid NULL,
  entity_title text NULL,     -- denorm for fast list rows
  fts tsvector,
  created_at, updated_at
)
```

What this rethink **adds** on top:

1. **`useNotesLayout(entityKind)` hook** — `localStorage` key
   `aie:notes-layout:<kind>`; values: `'split' | 'theatre' | 'focus'
   | 'off'`. No DB. (If we want cross-device persistence later, move
   to `profiles.preferences jsonb`.)
2. **`listNotesForEntity({kind, id})` Server Action** (U4.3 already
   covers CRUD; this is a thin select with `order by updated_at desc
   limit 20`).
3. **`derivedTextWithMentions(contentJson)`** must handle the new
   `timestampMention` / `entityMention` node types when computing
   `content_text` (so search "14:02" finds notes citing that
   timestamp).
4. **`<VideoNotesShell>`** in `app/(app)/video/[id]/_video-shell.tsx`
   replaces the current shell; it owns the player ref, the
   `?t=` URL state, and exposes `seekTo` + `getCurrentTime` to the
   editor via React context.
5. **`<NotesQuickDrawer>`** (new) mounted at the app shell level so it
   can be opened from anywhere. Reads `?note=` from the URL.

---

## 9. Implications for M3 implementation units

The spec text in
[`04-implementation-units.md`](./04-implementation-units.md) §U4.3 –
§U4.6 stays compatible, but the *included scope* shifts as follows.
**Don't edit `04-implementation-units.md` yet** — these notes are the
input for the planning conversation that produces the M3 plan files.

| Unit | What changes | What stays |
|---|---|---|
| **U4.3** Notes data layer | add `listNotesForEntity`; teach `content_text` derivation about `entityMention` + `timestampMention` | CRUD, FTS, autosave Server Action |
| **U4.4** Tiptap editor | add `entityMention` (already in scope) **and** `timestampMention` node + `[⏱]` toolbar + `⌘⇧K` shortcut; export hook `useEditorAPI` so N3 can call `insertTimestamp` from outside | base extensions, autosave wiring |
| **U4.5** Notes workspace | refocus from "destination workspace" to **3 surfaces**: N1 drawer (mounted at shell), N2 split (dossier param), N3 watch+notes (video shell). The §G `/notes` page becomes N4 (refined). | TipTap container, mention picker, search-in-notes |
| **U4.6** Entity-pinned notes | becomes the per-dossier **toolbar `[║ Notes]` + count badge + `useNotesLayout` integration**, not a tab. The "Notes" tab in §D is removed; counts move to the hero `[📝 Note (3)]` button. | `notes` filtered by entity, dossier-prebound creation |

A net-new unit is implied:

- **U4.7 (proposed) — Watch+Notes shell for video dossier**
  - **Goal:** ship `<VideoNotesShell>` so `/video/[id]?notes=split`
    works end-to-end with timestamp citations and PiP/theatre layout.
  - **Prereqs:** U4.4 (`timestampMention`), U4.5 (split shell).
  - **Acceptance:** insert ⏱, click ⏱ to seek, toggle split/theatre/
    focus, layout preference persists per user.

We can fold U4.7 into U4.5 if the milestone budget is tight, but
keeping it separate makes the video flow a discrete deliverable that
maps 1:1 to the user's stated headline goal.

---

## 10. Open questions for follow-up

1. **`localStorage` vs `profiles.preferences`** for `notes_layout` —
   per-device feels right (people use small screens differently), but
   we'll want cross-device sync once mobile lands.
2. **Drawer vs split on tablet width (768–1024 px):** drawer always;
   split only ≥ 1280 px? Need to decide before U4.5.
3. **Note ↔ video relationship** — do we want a real
   `note_cites_video(note_id, video_id, seconds)` table for "videos
   I've taken notes on" surfaces, or is parsing `content_json` for
   `timestampMention` nodes enough? (Lean: defer the table until M4
   when we have the chunk store; M3 just stores the citation in the
   doc.)
4. **Multi-pin** — can one note be pinned to multiple entities? The
   schema says no (single `entity_id`), but with `@`-mentions we
   already have a soft graph. Decision: **one hard pin, many soft
   mentions** for M3.
5. **Conflict on simultaneous edits** (rare in single-user mode but
   possible across two tabs): last-write-wins per autosave; show a
   `Reloaded — your other tab saved newer changes` toast if the
   server returns a newer `updated_at` than we sent.

---

## Appendix A — quick mock of N1 over a video result row

To make the "video search → quick note → keep scanning" flow concrete:

```
┌─ /explore/youtube_video?q=evals ─────────────────────────────────┬─ ▢ Note ──────────────┐
│ [Videos●] q: evals                                               │ 🎬 Why your evals lie │
│ 31 results                                                       │ 12 min · Channel X    │
│ ┌─────────────────────────────────────────────────────────────┐  │ ─────────────────────  │
│ │ ▶ Why your evals lie         12 min · 4.2k    [▶][★][📝●] │  │ My notes (1)          │
│ │ "Most teams confuse <mark>evals</mark> with vibes…"        │  │ • Eval anti-patterns  │
│ └─────────────────────────────────────────────────────────────┘  │ ──────────────────────│
│ ┌─────────────────────────────────────────────────────────────┐  │ Title: Eval anti-pat… │
│ │ ▶ Pairwise vs scalar judges  18 min · 3.1k    [▶][★][📝]   │  │ 📌 [🎬 Why your evals]│
│ │ "When pairwise <mark>evals</mark> beat scalar…"            │  │ ──────────────────────│
│ └─────────────────────────────────────────────────────────────┘  │  - Vibes ≠ evals      │
│ ┌─────────────────────────────────────────────────────────────┐  │  - Need a rubric      │
│ │ ▶ Eval rubrics from scratch  25 min · 2.8k    [▶][★][📝]   │  │  - @paper:gepa-2024   │
│ │ "Build <mark>evals</mark> the way you build tests…"        │  │                       │
│ └─────────────────────────────────────────────────────────────┘  │ ✓ saved · 142 chars   │
│ ┌─────────────────────────────────────────────────────────────┐  │ [Open in split ↗]     │
│ │ ▶ Calibrating LLM judges     31 min · 9.5k    [▶][★][📝]   │  └───────────────────────┘
│ │ "<mark>Evals</mark> are only as good as their rubric…"     │
│ └─────────────────────────────────────────────────────────────┘
│ [Load more]
└──────────────────────────────────────────────────────────────────┘
```

The user sees a list, opens a note for one result, types three
bullets, dismisses with `Esc`, hovers the next result, presses `n`,
keeps going. That's the loop M3 has to make feel automatic.
