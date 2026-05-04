import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { AssistantPlaceholderButton } from "./assistant-placeholder-button";
import { DossierNotesMenu } from "./dossier-notes-menu";
import { DossierNotesToggle } from "./notes-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/save-follow/follow-button";
import { NoteButton } from "@/components/save-follow/note-button";
import { SaveButton } from "@/components/save-follow/save-button";
import { OverviewInlineLinks } from "@/lib/text/overview-inline-links";
import { cn } from "@/lib/utils";
import type { NoteSummary } from "@/lib/notes/types";
import type { EntityKind, FollowEntityKind } from "@/lib/schema/entity-kind";

import { EntityKindChip } from "../explore/entity-kind-chip";

type DossierHeroProps = {
  kind: EntityKind;
  /** Stable ID matching the column saved_items.entity_id uses. */
  entityId: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  tags?: readonly string[];
  /** Free-form metadata pills (e.g. "Founded 2021", "Atlanta, US"). */
  meta?: Array<string | null | undefined>;
  /** Outbound links (LinkedIn / GitHub / homepage etc.) — { label, href }. */
  links?: Array<{ label: string; href: string }>;
  backHref?: string;
  backLabel?: string;
  className?: string;
  /** SSR-resolved state so buttons render with correct initial labels. */
  initialSaved?: boolean;
  initialFollowing?: boolean;
  /** Notes count badge for the Note button (e.g. "Note (3)"). */
  notesCount?: number;
  /** Recently updated notes pinned to this dossier entity. */
  notes?: readonly NoteSummary[];
  /** Where this entity lives — used as the click-through on follow notifications. */
  href?: string;
  /** When true, replace legacy Note/Notes controls with the dossier notes menu. */
  useNotesMenu?: boolean;
  /** When true, render the [║ Notes] split-toggle next to the action buttons. */
  supportsSplit?: boolean;
  /** Default layout for split toggle ("split" or "theatre" for video). */
  defaultLayout?: "split" | "theatre" | "focus";
};

function initialsOf(t: string): string {
  return t
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function DossierHero({
  kind,
  entityId,
  title,
  subtitle,
  description,
  imageUrl,
  tags,
  meta,
  links,
  backHref,
  backLabel,
  className,
  initialSaved = false,
  initialFollowing = false,
  notesCount = 0,
  notes = [],
  href,
  useNotesMenu = false,
  supportsSplit = false,
  defaultLayout = "split",
}: DossierHeroProps) {
  const visibleMeta = (meta ?? []).filter(
    (m): m is string => typeof m === "string" && m.length > 0,
  );

  return (
    <header
      className={cn(
        "border-border/60 bg-card flex flex-col gap-4 rounded-xl border p-6",
        className,
      )}
    >
      {backHref ? (
        <Button
          asChild
          size="xs"
          variant="ghost"
          className="self-start text-muted-foreground"
        >
          <Link href={backHref}>
            <ArrowLeft className="size-3" />
            {backLabel ?? "Back"}
          </Link>
        </Button>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-start md:gap-6 2xl:grid-cols-[auto_minmax(0,1fr)_auto]">
        <Avatar className="size-20 shrink-0 md:size-24">
          {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
          <AvatarFallback className="text-lg font-medium">
            {initialsOf(title)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <EntityKindChip kind={kind} />
            {visibleMeta.map((m) => (
              <span
                key={m}
                className="text-muted-foreground text-xs"
              >
                · {m}
              </span>
            ))}
          </div>
          <h1 className="mt-2 wrap-break-word text-2xl font-semibold tracking-tight md:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-muted-foreground mt-1 wrap-break-word text-sm md:text-base">
              {subtitle}
            </p>
          ) : null}
          {description ? (
            <p className="text-foreground/90 mt-3 max-w-[72ch] text-sm leading-6 text-balance">
              <OverviewInlineLinks text={description} />
            </p>
          ) : null}

          {tags && tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1">
              {tags.slice(0, 12).map((t) => (
                <Badge key={t} variant="outline" className="text-[10px]">
                  {t}
                </Badge>
              ))}
            </div>
          ) : null}

          {links && links.length > 0 ? (
            <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-foreground underline-offset-2 hover:underline"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1 md:col-start-2 2xl:col-start-3 2xl:row-start-1 2xl:justify-end **:data-[slot=button]:h-6 **:data-[slot=button]:gap-1 **:data-[slot=button]:px-2 **:data-[slot=button]:text-xs [&_[data-slot=button]>svg]:size-3">
          <SaveButton
            entity={{ kind, id: entityId, title, subtitle }}
            initialSaved={initialSaved}
          />
          <FollowButton
            entity={{
              kind: kind as FollowEntityKind,
              id: entityId,
              title,
              url: href ?? null,
            }}
            initialFollowing={initialFollowing}
          />
          {useNotesMenu ? (
            <DossierNotesMenu
              entity={{ kind, id: entityId, title }}
              notesCount={notesCount}
              notes={notes}
            />
          ) : (
            <>
              <NoteButton
                entity={{ kind, id: entityId, title }}
                count={notesCount}
              />
              {supportsSplit ? (
                <DossierNotesToggle
                  entityKind={kind}
                  count={notesCount}
                  defaultLayout={defaultLayout}
                />
              ) : null}
            </>
          )}
          <AssistantPlaceholderButton title={title} />
        </div>
      </div>
    </header>
  );
}

