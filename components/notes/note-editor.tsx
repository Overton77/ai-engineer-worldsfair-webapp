"use client";

import { ReactRenderer } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { all, createLowlight } from "lowlight";
import {
  Bold,
  Code,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Pencil,
  Quote,
  Save as SaveIcon,
  Timer,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";

import { autosaveNoteAction, deleteNoteAction } from "@/app/actions/notes";
import { searchPaletteAction } from "@/app/actions/palette";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildEntityMentionSuggestion,
  EntityMention,
  type EntityMentionItem,
} from "@/lib/notes/extensions/entity-mention";
import { TimestampMention } from "@/lib/notes/extensions/timestamp-mention";
import { deriveDefaultTitle } from "@/lib/notes/derive-text";
import {
  emptyDoc,
  type NoteDoc,
  type NotePin,
} from "@/lib/notes/types";
import { cn } from "@/lib/utils";

import { MentionPicker, type MentionPickerHandle } from "./mention-picker";

import "./note-editor.css";

export type NoteEditorVideoCtx = {
  videoId: string;
  /** Returns the player's current time in seconds. */
  getCurrentTime: () => number;
};

export type NoteEditorHandle = {
  /** Force a flush of the autosave debounce — used on close. */
  flush: () => Promise<void>;
  insertTimestamp: (args: { videoId: string; seconds: number }) => void;
  focus: () => void;
};

type NoteEditorProps = {
  /** Existing note id. The note is required to exist by the time this
   *  component mounts (callers create one via createNoteAction first). */
  noteId: string;
  initialTitle: string;
  initialContent: NoteDoc | null;
  pin: NotePin | null;
  videoCtx?: NoteEditorVideoCtx;
  /** Notified after each successful autosave with the new title/preview. */
  onSaved?: (snapshot: { title: string; preview: string; updatedAt: string }) => void;
  /** Called when the user deletes the note. */
  onDeleted?: () => void;
  className?: string;
  /** Compact mode trims toolbar + uses smaller editor padding (drawer). */
  compact?: boolean;
};

const AUTOSAVE_MS = 500;

const lowlight = createLowlight(all);

export const NoteEditor = React.forwardRef<NoteEditorHandle, NoteEditorProps>(
  function NoteEditor(
    {
      noteId,
      initialTitle,
      initialContent,
      pin,
      videoCtx,
      onSaved,
      onDeleted,
      className,
      compact = false,
    },
    ref,
  ) {
    const [title, setTitle] = React.useState(initialTitle || "Untitled");
    const [savedAt, setSavedAt] = React.useState<string | null>(null);
    const [pendingSave, setPendingSave] = React.useState(false);

    const titleRef = React.useRef(title);
    const pinRef = React.useRef(pin);
    React.useEffect(() => {
      titleRef.current = title;
    }, [title]);
    React.useEffect(() => {
      pinRef.current = pin;
    }, [pin]);

    // ─── Mention suggestion plumbing ─────────────────────────────
    const pickerHandleRef = React.useRef<MentionPickerHandle | null>(null);
    const [mentionState, setMentionState] = React.useState<{
      open: boolean;
      query: string;
      items: EntityMentionItem[];
      rect: { top: number; left: number; bottom: number } | null;
      onSelect: ((item: EntityMentionItem) => void) | null;
    }>({
      open: false,
      query: "",
      items: [],
      rect: null,
      onSelect: null,
    });
    // ─── Editor instance ─────────────────────────────────────────
    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          codeBlock: false,
          link: false,
        }),
        CodeBlockLowlight.configure({
          lowlight,
          defaultLanguage: "ts",
        }),
        Link.configure({
          openOnClick: true,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({
          placeholder: "Start typing… use @ to mention an entity, ⌘⇧K to insert a timestamp.",
        }),
        TimestampMention,
        EntityMention.configure({
          suggestion: buildEntityMentionSuggestion(
            async (q: string) => {
              const hits = await searchPaletteAction({ prefix: q, limit: 8 });
              return hits.map((h) => ({
                kind: h.kind,
                id: h.id,
                slug: h.slug,
                title: h.title,
                imageUrl: h.imageUrl,
              }));
            },
            mentionRender(setMentionState),
          ),
        }),
      ],
      content: (initialContent ?? emptyDoc()) as unknown as object,
      onUpdate: () => scheduleSave(),
    });

    // ─── Autosave plumbing ───────────────────────────────────────
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const doSave = React.useCallback(async () => {
      if (!editor) return;
      const json = sanitizeNoteDoc(editor.getJSON());
      // If the user hasn't typed a title, derive one from the doc so
      // /notes index rows aren't all "Untitled".
      const effectiveTitle =
        titleRef.current.trim() && titleRef.current.trim() !== "Untitled"
          ? titleRef.current.trim()
          : deriveDefaultTitle(json);

      setPendingSave(true);
      const result = await autosaveNoteAction({
        id: noteId,
        title: effectiveTitle,
        contentJson: json,
        pin: pinRef.current,
      });
      setPendingSave(false);
      if (!result.ok) {
        toast.error(result.error || "Autosave failed");
        return;
      }
      setSavedAt(result.updatedAt);
      onSaved?.({
        title: effectiveTitle,
        preview: result.preview,
        updatedAt: result.updatedAt,
      });
    }, [editor, noteId, onSaved]);

    const scheduleSave = React.useCallback(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(doSave, AUTOSAVE_MS);
    }, [doSave]);

    // Flush on unmount / before unload
    React.useEffect(() => {
      const flushNow = () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
          // best-effort fire-and-forget; cannot await here
          doSave();
        }
      };
      window.addEventListener("beforeunload", flushNow);
      return () => {
        window.removeEventListener("beforeunload", flushNow);
        flushNow();
      };
    }, [doSave]);

    // Title change kicks an autosave too (so renames persist).
    const onTitleChange = (next: string) => {
      flushSync(() => setTitle(next));
      scheduleSave();
    };

    // Imperative API for parents (drawer/split/video shells)
    React.useImperativeHandle(
      ref,
      () => ({
        flush: async () => {
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
          }
          await doSave();
        },
        insertTimestamp: ({ videoId, seconds }) => {
          editor?.commands.insertTimestamp({ videoId, seconds });
        },
        focus: () => editor?.commands.focus(),
      }),
      [editor, doSave],
    );

    // Expose video ctx globally so the keyboard shortcut path in the
    // TimestampMention extension can read it without React context.
    React.useEffect(() => {
      if (typeof window === "undefined") return;
      const w = window as unknown as {
        __videoNotesCtx__?: NoteEditorVideoCtx;
      };
      if (videoCtx) {
        w.__videoNotesCtx__ = videoCtx;
        return () => {
          if (w.__videoNotesCtx__ === videoCtx) delete w.__videoNotesCtx__;
        };
      }
      return undefined;
    }, [videoCtx]);

    // ─── Toolbar handlers ────────────────────────────────────────
    const insertTimestampNow = () => {
      if (!editor || !videoCtx) return;
      editor.commands.insertTimestamp({
        videoId: videoCtx.videoId,
        seconds: videoCtx.getCurrentTime(),
      });
    };

    const onDelete = async () => {
      if (!noteId) return;
      if (!confirm("Delete this note?")) return;
      const result = await deleteNoteAction({ id: noteId });
      if (result.ok) {
        onDeleted?.();
        toast.success("Note deleted");
      } else {
        toast.error(result.error || "Failed to delete");
      }
    };

    return (
      <div
        className={cn(
          "note-editor flex min-h-0 flex-1 flex-col",
          className,
        )}
      >
        <header className="border-border/60 flex flex-col gap-2 border-b px-3 py-2.5">
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled"
            aria-label="Note title"
            className="h-9 border-0 bg-transparent px-0 text-base font-semibold tracking-tight shadow-none focus-visible:ring-0"
          />
          <Toolbar
            editor={editor}
            compact={compact}
            onInsertTimestamp={videoCtx ? insertTimestampNow : null}
          />
          <div className="text-muted-foreground flex items-center justify-between text-[10px]">
            <span>
              {pin ? (
                <>
                  Pinned to{" "}
                  <strong className="text-foreground">{pin.title}</strong>
                </>
              ) : (
                "Freeform"
              )}
            </span>
            <span aria-live="polite">
              {pendingSave
                ? "Saving…"
                : savedAt
                  ? `Saved ${relTime(savedAt)}`
                  : ""}
            </span>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <EditorContent editor={editor} />
        </div>

        <footer className="border-border/60 flex items-center justify-between border-t px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            {countChars(editor)} chars
          </span>
          <div className="flex gap-1">
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => doSave()}
              aria-label="Save now"
            >
              <SaveIcon className="size-3" />
              Save
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={onDelete}
            >
              <Trash2 className="size-3" />
              Delete
            </Button>
          </div>
        </footer>

        <MentionPicker
          ref={pickerHandleRef}
          items={mentionState.items}
          rect={mentionState.rect}
          query={mentionState.query}
          onSelect={(item) => mentionState.onSelect?.(item)}
        />
      </div>
    );
  },
);

// ───────────── helpers ────────────────────────────────────────────

function countChars(editor: ReturnType<typeof useEditor> | null): number {
  if (!editor) return 0;
  const cc = editor.storage.characterCount as
    | { characters?: () => number }
    | undefined;
  return cc?.characters?.() ?? editor.getText().length;
}

function sanitizeNoteDoc(value: unknown): NoteDoc {
  return JSON.parse(
    JSON.stringify(value, (_key, nestedValue) =>
      typeof nestedValue === "function" ? undefined : nestedValue,
    ),
  ) as NoteDoc;
}

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 1500) return "just now";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

function ToolButton({
  children,
  onClick,
  label,
  active,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      size="xs"
      variant={active ? "secondary" : "ghost"}
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className="h-6 w-6 p-0"
    >
      {children}
    </Button>
  );
}

function Toolbar({
  editor,
  compact,
  onInsertTimestamp,
}: {
  editor: ReturnType<typeof useEditor> | null;
  compact: boolean;
  onInsertTimestamp: (() => void) | null;
}) {
  if (!editor) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-0.5", compact && "gap-0")}>
      <ToolButton
        label="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
      >
        <Bold className="size-3" />
      </ToolButton>
      <ToolButton
        label="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
      >
        <Italic className="size-3" />
      </ToolButton>
      <ToolButton
        label="Heading"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
      >
        <Heading2 className="size-3" />
      </ToolButton>
      <ToolButton
        label="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
      >
        <List className="size-3" />
      </ToolButton>
      <ToolButton
        label="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
      >
        <ListOrdered className="size-3" />
      </ToolButton>
      <ToolButton
        label="Task list"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        active={editor.isActive("taskList")}
      >
        <ListChecks className="size-3" />
      </ToolButton>
      <ToolButton
        label="Code block"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
      >
        <Code className="size-3" />
      </ToolButton>
      <ToolButton
        label="Quote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
      >
        <Quote className="size-3" />
      </ToolButton>
      <ToolButton
        label="Insert link"
        onClick={() => {
          const href = window.prompt("Link URL");
          if (!href) return;
          editor.chain().focus().setLink({ href }).run();
        }}
      >
        <LinkIcon className="size-3" />
      </ToolButton>
      <ToolButton
        label="Insert mention"
        onClick={() => editor.chain().focus().insertContent("@").run()}
      >
        <Pencil className="size-3" />
      </ToolButton>
      {onInsertTimestamp ? (
        <ToolButton
          label="Insert timestamp (⌘⇧K)"
          onClick={onInsertTimestamp}
        >
          <Timer className="size-3" />
        </ToolButton>
      ) : null}
    </div>
  );
}

// ───────────── mention render — TipTap suggestion glue ───────────

type SuggestionRenderProps = {
  items: EntityMentionItem[];
  query: string;
  command: (item: EntityMentionItem) => void;
  clientRect?: (() => DOMRect | null) | null;
};

type SuggestionRender = () => {
  onStart: (props: SuggestionRenderProps) => void;
  onUpdate: (props: SuggestionRenderProps) => void;
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
  onExit: () => void;
};

function mentionRender(
  setMentionState: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      query: string;
      items: EntityMentionItem[];
      rect: { top: number; left: number; bottom: number } | null;
      onSelect: ((item: EntityMentionItem) => void) | null;
    }>
  >,
): SuggestionRender {
  return () => {
    let onSelect: ((item: EntityMentionItem) => void) | null = null;

    function publish(props: SuggestionRenderProps) {
      const r = props.clientRect?.();
      onSelect = props.command;
      setMentionState({
        open: true,
        query: props.query,
        items: props.items,
        rect: r
          ? { top: r.top, left: r.left, bottom: r.bottom }
          : null,
        onSelect,
      });
    }

    return {
      onStart: publish,
      onUpdate: publish,
      onKeyDown: ({ event }) => {
        if (event.key === "Escape") {
          setMentionState((s) => ({ ...s, open: false, rect: null, items: [] }));
          return false;
        }
        return false;
      },
      onExit: () => {
        onSelect = null;
        setMentionState({
          open: false,
          query: "",
          items: [],
          rect: null,
          onSelect: null,
        });
      },
    };
  };
}

// ReactRenderer is imported but unused — keep the import so future
// changes that mount a portal-rendered popup can pick it up.
void ReactRenderer;
