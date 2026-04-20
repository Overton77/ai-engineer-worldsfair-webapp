import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { AssistantPlaceholderButton } from "./assistant-placeholder-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/save-follow/follow-button";
import { NoteButton } from "@/components/save-follow/note-button";
import { SaveButton } from "@/components/save-follow/save-button";
import { cn } from "@/lib/utils";
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
  /** Where this entity lives — used as the click-through on follow notifications. */
  href?: string;
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
  href,
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

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
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
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-muted-foreground mt-1 text-base">{subtitle}</p>
          ) : null}
          {description ? (
            <p className="text-foreground/90 mt-3 max-w-prose text-sm leading-relaxed">
              {description}
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

        <div className="flex shrink-0 flex-wrap gap-1">
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
          <NoteButton
            entity={{ kind, id: entityId, title }}
            count={notesCount}
          />
          <AssistantPlaceholderButton title={title} />
        </div>
      </div>
    </header>
  );
}

