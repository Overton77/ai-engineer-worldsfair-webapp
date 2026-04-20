"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import type { NoteDoc, NotePin } from "@/lib/notes/types";

import { NoteEditor, type NoteEditorHandle } from "./note-editor";

type Props = {
  noteId: string;
  initialTitle: string;
  initialContent: NoteDoc | null;
  pin: NotePin | null;
};

/**
 * Thin wrapper around <NoteEditor> for the `/notes/[id]` route. After
 * delete it redirects back to /notes.
 */
export function NoteFocusEditor({ noteId, initialTitle, initialContent, pin }: Props) {
  const router = useRouter();
  const editorRef = React.useRef<NoteEditorHandle | null>(null);

  return (
    <NoteEditor
      ref={editorRef}
      noteId={noteId}
      initialTitle={initialTitle}
      initialContent={initialContent}
      pin={pin}
      onDeleted={() => router.push("/notes")}
    />
  );
}
