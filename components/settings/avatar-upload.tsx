"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { updateAvatarUrl } from "@/lib/actions/profile";
import { createBrowserSupabase } from "@/lib/supabase/browser";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

type AvatarUploadProps = {
  userId: string;
  initialUrl: string | null;
  fallbackText: string;
};

export function AvatarUpload({
  userId,
  initialUrl,
  fallbackText,
}: AvatarUploadProps) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [, startSave] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!ALLOWED.has(file.type)) {
      toast.error("PNG, JPEG, WebP, or GIF only.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 4 MB.");
      return;
    }

    setBusy(true);
    try {
      const sb = createBrowserSupabase();
      const ext = file.type.split("/")[1] ?? "png";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await sb.storage
        .from("avatars")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
      if (upErr) throw upErr;

      const { data: pub } = sb.storage.from("avatars").getPublicUrl(path);
      setUrl(pub.publicUrl);

      await new Promise<void>((resolve) => {
        startSave(async () => {
          const result = await updateAvatarUrl(pub.publicUrl);
          if (!result.ok) {
            toast.error(result.error);
          } else {
            toast.success("Avatar updated.");
          }
          resolve();
        });
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      await new Promise<void>((resolve) => {
        startSave(async () => {
          const result = await updateAvatarUrl(null);
          if (!result.ok) {
            toast.error(result.error);
          } else {
            setUrl(null);
            toast.success("Avatar removed.");
          }
          resolve();
        });
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg" className="size-16">
        {url ? <AvatarImage src={url} alt="" /> : null}
        <AvatarFallback className="text-base">{fallbackText}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={Array.from(ALLOWED).join(",")}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              if (inputRef.current) inputRef.current.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            {url ? "Replace" : "Upload"}
          </Button>
          {url ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={busy}
              className="text-muted-foreground"
            >
              <Trash2 className="size-4" /> Remove
            </Button>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs">
          PNG, JPEG, WebP, or GIF. Up to 4 MB.
        </p>
      </div>
    </div>
  );
}
