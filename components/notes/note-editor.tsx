"use client";

import { type ReactNode, useState } from "react";
import { EditorContent, useEditor, type Content } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { List, Loader2, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Json } from "@/types/database.types";

const EMPTY_DOC: Content = { type: "doc", content: [] };

function resolveInitialContent(contentJson: Json | null | undefined): Content {
  if (typeof contentJson === "string") return contentJson;
  if (Array.isArray(contentJson)) return contentJson;
  if (contentJson && typeof contentJson === "object") return contentJson as Content;
  return EMPTY_DOC;
}

type NoteEditorValue = {
  title: string;
  contentJson: Json;
  contentText: string;
};

type NoteEditorProps = {
  title?: string | null;
  contentJson?: Json | null;
  entityLabel?: string | null;
  busy?: boolean;
  saveLabel?: string;
  onSave: (value: NoteEditorValue) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  deleteDisabled?: boolean;
  className?: string;
};

function ToolbarButton({
  active,
  label,
  onClick,
}: {
  active?: boolean;
  label: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      className="h-8 px-2 text-xs"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export function NoteEditor({
  title,
  contentJson,
  entityLabel,
  busy = false,
  saveLabel = "Save note",
  onSave,
  onDelete,
  deleteDisabled = false,
  className,
}: NoteEditorProps) {
  const [draftTitle, setDraftTitle] = useState(title ?? "");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: entityLabel
          ? `Write a note about ${entityLabel}...`
          : "Capture a note, insight, or takeaway...",
      }),
    ],
    content: resolveInitialContent(contentJson),
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] rounded-b-xl border-x border-b border-border bg-background px-4 py-3 text-sm outline-none",
      },
    },
  });

  const canSave = !!draftTitle.trim() && !!editor && !busy;

  async function handleSave() {
    if (!editor || !draftTitle.trim()) return;

    await onSave({
      title: draftTitle.trim(),
      contentJson: editor.getJSON(),
      contentText: editor.getText().trim(),
    });
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        <Input
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          placeholder={entityLabel ? `Note title for ${entityLabel}` : "Note title"}
          className="h-10"
        />
        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton
            active={editor?.isActive("bold")}
            label={<span className="font-semibold">B</span>}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            active={editor?.isActive("italic")}
            label={<span className="italic">I</span>}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            active={editor?.isActive("bulletList")}
            label={<List className="size-3.5" />}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          />
        </div>
      </div>

      <div className="rounded-xl">
        <div className="rounded-t-xl border border-border bg-muted/40 px-4 py-2 text-[11px] uppercase tracking-wide text-muted-foreground">
          {entityLabel ? `Attached to ${entityLabel}` : "Personal note"}
        </div>
        <EditorContent editor={editor} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={deleteDisabled || busy}
            onClick={() => void onDelete()}
          >
            <Trash2 className="mr-2 size-3.5" />
            Delete
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            {entityLabel ? "Entity-linked notes stay private to your account." : "Private to your account."}
          </span>
        )}

        <Button type="button" size="sm" disabled={!canSave} onClick={() => void handleSave()}>
          {busy ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : <Save className="mr-2 size-3.5" />}
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
