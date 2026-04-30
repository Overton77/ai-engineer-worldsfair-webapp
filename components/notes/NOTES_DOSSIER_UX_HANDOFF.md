# Notes Dossier UX Handoff

This handoff summarizes the UX decisions made for the notes experience on entity dossier pages.

Scope: People, Organizations, Libraries, Papers, and Talks/Sessions.

Out of scope: intentional Video UX changes. Shared helper changes must preserve current video behavior.

## Current Problem Summary

- The dossier hero currently shows two nearby note actions:
  - `Note` from `components/save-follow/note-button.tsx`
  - `Notes` from `components/dossier/notes-toggle.tsx`
- The labels are too similar and hide different behaviors:
  - `Note` opens the global quick drawer.
  - `Notes` opens the split notes panel beside the dossier.
- URL state conflicts create bugs:
  - `?notes=split&note=new&pinTo=person:aakanksha_chowdhery` causes the split panel to treat `note=new` as an existing note id.
  - `bootstrapDrawerAction({ mode: "existing", noteId: "new" })` fails UUID validation and returns `Invalid arguments`.
- Closing the split panel currently leaves `?note=...` behind in some flows, so the global drawer can open unexpectedly after the panel closes.
- The split shell has a visible resize handle, but the left dossier content is constrained by inner `max-w-5xl` wrappers on dossier pages, making resizing feel ineffective.
- The bottom dossier `Notes` section is too far down the page. Pinned notes should be accessible from the entity card/hero area instead.

## Decisions Made

1. Closing the notes panel must clear active note URL state.
   - Clear `notes`, `note`, and `pinTo` when the panel is closed.
   - Closing the panel should not move the active note into the drawer.

2. Use one combined hero notes control.
   - Replace the dossier hero's separate `Note` and `Notes` controls with a single `Notes` menu.
   - The trigger is menu-only. No split button and no default action on click.

3. Create a new component.
   - Add `components/dossier/dossier-notes-menu.tsx`.
   - Do not retrofit `NoteButton` and `DossierNotesToggle` into a menu.
   - `NoteButton` can remain for explore cards and other quick-capture-only surfaces.

4. The menu trigger shows the entity note count.
   - Example: `Notes` with a badge/count when notes exist.
   - Tooltip only on the trigger: `Create, view, and manage notes pinned to this entity.`

5. Menu actions and copy.
   - Primary actions:
     - `New note`
       - Description: `Quick capture pinned to this entity`
     - `Open notes panel` or `Close notes panel`
       - Description when opening: `Read and edit notes beside this dossier`
     - `Open notes workspace`
       - Goes to `/notes` unfiltered for now.
   - Do not route `/notes` with entity-kind or entity-specific filters in this pass.

6. Respect the active notes surface.
   - If the notes panel is open:
     - `New note` creates/selects the note inside the panel.
     - Clicking a pinned note in the menu selects it inside the panel.
   - If the notes panel is closed:
     - `New note` opens the quick drawer.
     - Clicking a pinned note in the menu opens it in the quick drawer.
   - The explicit `Open notes workspace` action always goes to `/notes`.

7. Pinned notes should be accessible from the menu.
   - Remove the bottom `Notes` section as the primary pinned-notes surface for the scoped dossiers.
   - Show up to 3 recently updated pinned notes inside the `Notes` menu.
   - Each row should show the note title and one-line preview if available.
   - If there are more than 3 notes, include a `View all in notes panel` action.

8. Notes panel selection behavior.
   - Remember the last selected note per entity.
   - Store this outside active URL state, likely localStorage keyed by entity.
   - If no remembered note exists and the entity has notes, auto-select the most recently updated note.
   - Show the empty state only when the entity has zero notes.

9. Panel open/closed persistence.
   - For People, Organizations, Libraries, Papers, and Talks/Sessions, panel open/closed should be current-page URL state only.
   - Do not auto-restore the notes panel by entity kind for these non-video dossiers.
   - Keep last selected note per entity separate from panel-open persistence.
   - Preserve existing video behavior if touching shared hooks.

10. Resize behavior.
    - Keep resizing for the split panel.
    - Make the left dossier content reflow honestly when resized.
    - The current resize issue is likely caused by inner `mx-auto max-w-5xl` wrappers in each dossier page.

11. Accessibility and keyboard behavior.
    - No custom keyboard shortcuts in this pass.
    - Rely on the menu primitive for keyboard navigation.
    - Ensure clear labels, correct open/close text, and real menu items/buttons.

12. Updates after create/delete.
    - Active surfaces should update immediately where they already own state.
    - Use `router.refresh()` after create/delete so server-provided menu count/list catches up.
    - Do not introduce a new global client-side notes cache in this pass.

## Important Existing Code References

### Current Hero Controls

- `components/dossier/dossier-hero.tsx`
  - Currently imports and renders:
    - `NoteButton` from `components/save-follow/note-button.tsx`
    - `DossierNotesToggle` from `components/dossier/notes-toggle.tsx`
  - Should be changed to render the new `DossierNotesMenu`.
  - Should receive actual recent notes, not just `notesCount`.

- `components/save-follow/note-button.tsx`
  - Opens quick drawer by setting `?note=new&pinTo=<kind>:<id>`.
  - Keep for explore cards and quick-capture-only surfaces.
  - Do not use this directly in scoped dossier hero pages after the refactor.

- `components/dossier/notes-toggle.tsx`
  - Current split-panel toggle.
  - Uses `useNotesLayout` to persist panel layout per entity kind.
  - For scoped non-video dossiers, this behavior should be replaced by `DossierNotesMenu`.
  - Preserve video behavior if this component remains used by video pages.

### URL State

- `lib/notes/use-note-url-state.ts`
  - Current URL params:
    - `note`
    - `notes`
    - `pinTo`
  - Current helpers are too generic:
    - `openNote`
    - `openNewNote`
    - `closeNote`
    - `setLayout`
  - Recommended to add clearer intent helpers, for example:
    - `openDrawerNote(id)`
    - `openDrawerNewNote(ref)`
    - `openPanelNote(id)`
    - `openPanelNewNote(ref)` or keep creation in menu and call `openPanelNote(createdId)`
    - `closePanelAndNote()`
    - `setPanelLayout(next)`
  - Be careful not to break existing video flows.

### Split Panel

- `components/notes/notes-split-shell.tsx`
  - Reads `notes` and `note` from `useNoteUrlState`.
  - Treats `notes === "split" || notes === "focus"` as open.
  - Passes `activeNoteId={note}` into `EntityNotesPanel`.
  - Needs hardening so `note=new` is never sent as an existing note id.
  - Should support last-selected note memory and recent-note auto-select, probably in coordination with `EntityNotesPanel`.
  - Should clear `note` and `pinTo` when closing the panel.

- `components/notes/entity-notes-panel.tsx`
  - Owns the entity note list and editor.
  - Already has `onCreate` that creates a server note and selects it.
  - Currently bootstraps any `activeNoteId` as an existing note via `bootstrapDrawerAction({ mode: "existing", noteId })`.
  - Must not bootstrap invalid IDs like `"new"`.
  - Should refresh its list after create/save/delete.
  - Should remain mostly a lower-level panel, with surface routing decisions handled by the menu/shell.

### Drawer

- `components/notes/notes-quick-drawer.tsx`
  - Global drawer mounted at app shell.
  - Intentionally stays closed when `notes` is non-null.
  - This is correct: drawer should not compete with the inline panel.
  - The bug happens when `notes` is removed while `note` remains, causing drawer to wake up.

### Server Actions and Data

- `app/actions/drawer-bootstrap.ts`
  - `mode: "existing"` requires `noteId` to be a UUID.
  - This is where `"Invalid arguments"` comes from when `noteId` is `"new"`.

- `app/actions/notes.ts`
  - `createNoteAction` creates pinned or freeform notes.
  - `listNotesForEntityAction` returns pinned notes for an entity.
  - Existing panel create flow can be reused.

- `lib/db/notes.ts`
  - Data access for notes.
  - `listNotesForEntity` returns notes ordered by `updated_at desc`, which matches the desired recent-pinned-notes list.

- `lib/db/dossier-notes.ts`
  - Already used by dossier pages to get notes context.
  - Pass `notesCtx.notes` into `DossierHero` so the menu can render the top 3 without a client fetch.

### Bottom Notes Section

- `components/dossier/notes-placeholder.tsx`
  - Exports `EntityNotesFooter`.
  - This is the current bottom `Notes` section.
  - For scoped dossier pages, remove usage of this component.
  - It may remain for compatibility if other pages still use it.

### Scoped Dossier Pages

These pages currently wrap content in `NotesSplitShell`, render `DossierHero`, and render a bottom `EntityNotesFooter`.

- `app/(app)/p/[slug]/page.tsx`
- `app/(app)/o/[slug]/page.tsx`
- `app/(app)/lib/[slug]/page.tsx`
- `app/(app)/paper/[slug]/page.tsx`
- `app/(app)/talk/[slug]/page.tsx`

For each scoped page:

- Pass `notes={notesCtx.notes}` or similarly named prop into `DossierHero`.
- Keep `notesCount={notesCtx.count}` if useful, or derive count from `notesCtx.count`.
- Remove the bottom `Section title="Notes"` block with `EntityNotesFooter`.
- Revisit inner wrapper classes like `mx-auto max-w-5xl` so split resizing feels responsive.

### Video Page

- `app/(app)/video/[id]/page.tsx`
  - Do not intentionally change this UX in this pass.
  - If shared APIs change, verify this page still works.

## Proposed Implementation Stages

### Stage 1: Add `DossierNotesMenu`

Create `components/dossier/dossier-notes-menu.tsx`.

Responsibilities:

- Render a single `Notes` button/menu trigger.
- Show note count badge on trigger.
- Add trigger tooltip only.
- Render menu items:
  - `New note`
  - `Open notes panel` or `Close notes panel`
  - Up to 3 pinned note rows when notes exist
  - `View all in notes panel` when more than 3 exist
  - `Open notes workspace`
- Respect active surface:
  - Panel open means create/select inside panel.
  - Panel closed means create/open in quick drawer.
- Call `router.refresh()` after create flows so the server count/list refreshes.

### Stage 2: Update `DossierHero`

Modify `components/dossier/dossier-hero.tsx`.

- Replace dossier usage of `NoteButton` and `DossierNotesToggle` with `DossierNotesMenu`.
- Add a prop for note summaries, likely:
  - `notes?: NoteSummary[]`
- Preserve other hero actions:
  - Save
  - Follow
  - Assistant placeholder
- Leave explore cards alone.

### Stage 3: Update URL State Helpers

Modify `lib/notes/use-note-url-state.ts`.

Goals:

- Express surface-aware actions more clearly.
- Add a helper that closes panel and clears `note`/`pinTo`.
- Avoid leaving drawer-triggering params behind when panel closes.
- Avoid treating `note=new` as a valid panel active note.

Be careful with `notes=theatre` for videos.

### Stage 4: Update Split Panel Selection

Modify `components/notes/notes-split-shell.tsx` and/or `components/notes/entity-notes-panel.tsx`.

Goals:

- Remember last selected note per entity in localStorage.
- When panel opens:
  - Use URL `note` if valid.
  - Else use remembered note if present.
  - Else auto-select most recently updated note if notes exist.
  - Else show empty state.
- Never bootstrap `"new"` as an existing note id.
- When panel closes, clear active note URL state.

Implementation note:

- Since `EntityNotesPanel` fetches the list client-side today, auto-selecting the most recent note may fit naturally inside `EntityNotesPanel` after `listNotesForEntityAction` resolves.
- Keep parent/child responsibilities clean:
  - Shell handles layout and URL/panel state.
  - Panel handles entity note list and editor.

### Stage 5: Remove Bottom Notes Sections

Modify scoped dossier pages:

- `app/(app)/p/[slug]/page.tsx`
- `app/(app)/o/[slug]/page.tsx`
- `app/(app)/lib/[slug]/page.tsx`
- `app/(app)/paper/[slug]/page.tsx`
- `app/(app)/talk/[slug]/page.tsx`

Remove the bottom:

- `Section title="Notes"`
- `EntityNotesFooter`

Also remove unused imports from those pages.

### Stage 6: Make Resizing Feel Real

Review the left dossier content wrappers inside scoped pages.

Current pattern:

- `NotesSplitShell` wrapper uses `className="mx-auto max-w-7xl"`.
- Inner dossier body often uses `className="mx-auto flex max-w-5xl flex-col gap-6"`.

Problem:

- The inner `max-w-5xl` can make the resizable left panel appear not to resize meaningfully.

Direction:

- In split mode, the left content should use the available panel width.
- Consider moving width constraints into `NotesSplitShell`, adding a context/class hook, or changing scoped dossier wrappers to `w-full` with sensible max width only when split is closed.
- Keep min widths sensible so the entity card and body do not collapse awkwardly.

### Stage 7: Verification

Manual flows to verify:

1. Person dossier with no notes:
   - Open `Notes` menu.
   - `New note` opens quick drawer when panel is closed.
   - Closing drawer leaves clean URL.

2. Person dossier with panel open:
   - `New note` creates/selects inside panel.
   - No drawer opens.
   - Closing panel clears `note` and `pinTo`.

3. Existing pinned notes:
   - Menu shows up to 3 recent notes.
   - Clicking a pinned note opens drawer when panel is closed.
   - Clicking a pinned note selects inside panel when panel is open.

4. Panel reopen behavior:
   - Reopens to last selected note for that entity.
   - If no memory exists, selects most recently updated note.
   - Empty state only appears when no notes exist.

5. Resize:
   - People, Organizations, Libraries, Papers, and Talks resize smoothly.
   - Left content reflows and does not look broken.

6. Videos:
   - No intentional UX changes.
   - Existing watch/notes behavior still works if shared code changed.

7. Notes workspace:
   - `Open notes workspace` goes to `/notes` unfiltered.

## Suggested Test/Quality Checks

- Run lints for edited files.
- If existing test setup supports it, add focused tests around URL helper behavior.
- At minimum, manually test the URL transitions:
  - `?notes=split&note=<uuid>` close panel -> no `notes`, no `note`, no `pinTo`
  - panel open + new note -> `note=<created uuid>`, no `pinTo`
  - panel closed + new note -> `note=new&pinTo=<kind>:<id>`

## Non-Goals For This Pass

- Do not redesign video notes/watch UX.
- Do not add entity-specific filtering to `/notes`.
- Do not add custom keyboard shortcuts.
- Do not introduce a global client-side notes cache.
- Do not refactor the TipTap editor beyond what is necessary for this notes-surface work.
