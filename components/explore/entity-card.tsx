"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";

import { FollowButton } from "@/components/save-follow/follow-button";
import { NoteButton } from "@/components/save-follow/note-button";
import { SaveButton } from "@/components/save-follow/save-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { FollowEntityKind } from "@/lib/schema/entity-kind";
import {
  ROLE_BUCKET_LABELS,
  isRoleBucket,
} from "@/lib/search/people-roles";
import { cn } from "@/lib/utils";
import type { EntitySummary } from "@/types/domain";

import { EntityKindChip } from "./entity-kind-chip";

/**
 * Render the ts_headline snippet HTML, allowing only `<mark>...</mark>`
 * tags through. Defence-in-depth — the SQL produces only `<mark>`
 * wrappers, but we sanitise client-side too in case downstream callers
 * pass non-server-shaped strings.
 */
function sanitizeSnippet(html: string): string {
  return html
    .replace(/<(?!\/?mark\b)[^>]*>/gi, "")
    .replace(/<mark>/gi, '<mark class="bg-yellow-200 dark:bg-yellow-500/40 rounded px-0.5">')
    .replace(/<\/mark>/gi, "</mark>");
}

function initialsOf(title: string): string {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export type EntityCardVariant = "compact" | "result" | "media";

type EntityCardProps = {
  entity: EntitySummary;
  variant?: EntityCardVariant;
  /** Sanitized HTML snippet — pass `entity.snippet` from explore RPCs. */
  snippet?: string | null;
  /** Optional rank/score badge text rendered in the corner. */
  scoreBadge?: string;
  /** When true, show Save / Follow / Note quick actions. */
  actions?: boolean;
  /** SSR-resolved state so the buttons render correctly on first paint. */
  initialSaved?: boolean;
  initialFollowing?: boolean;
  className?: string;
};

export function EntityCard({
  entity,
  variant = "result",
  snippet,
  scoreBadge,
  actions = true,
  initialSaved = false,
  initialFollowing = false,
  className,
}: EntityCardProps) {
  const tags = entity.tags ?? [];
  const visibleTags = tags.slice(0, 4);
  const extraTagCount = Math.max(0, tags.length - visibleTags.length);

  if (variant === "media") {
    return (
      <Link
        href={entity.href}
        className={cn(
          "group/card border-border/60 bg-card hover:border-border focus-visible:ring-ring/50 flex flex-col gap-2 overflow-hidden rounded-xl border transition-colors focus-visible:ring-3 focus-visible:outline-none",
          className,
        )}
      >
        <div className="bg-muted relative aspect-video w-full overflow-hidden">
          {entity.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entity.imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-200 group-hover/card:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <EntityKindChip kind={entity.kind} />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-medium tracking-tight">
              {entity.title}
            </h3>
            {scoreBadge ? (
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                {scoreBadge}
              </Badge>
            ) : null}
          </div>
          {entity.subtitle ? (
            <p className="text-muted-foreground line-clamp-1 text-xs">
              {entity.subtitle}
            </p>
          ) : null}
        </div>
      </Link>
    );
  }

  return (
    <article
      className={cn(
        "group/card border-border/60 bg-card hover:border-border flex gap-4 rounded-xl border p-4 transition-colors",
        variant === "compact" && "p-3",
        className,
      )}
    >
      <div className="shrink-0">
        <Avatar className={cn(variant === "compact" ? "size-9" : "size-12")}>
          {entity.imageUrl ? (
            <AvatarImage src={entity.imageUrl} alt="" />
          ) : null}
          <AvatarFallback>{initialsOf(entity.title)}</AvatarFallback>
        </Avatar>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <Link
            href={entity.href}
            className="focus-visible:ring-ring/50 min-w-0 flex-1 rounded focus-visible:ring-3 focus-visible:outline-none"
          >
            <h3
              className={cn(
                "truncate font-medium tracking-tight",
                variant === "compact" ? "text-sm" : "text-base",
              )}
            >
              {entity.title}
            </h3>
            {entity.subtitle ? (
              <p className="text-muted-foreground truncate text-sm">
                {entity.subtitle}
              </p>
            ) : null}
          </Link>
          {scoreBadge ? (
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {scoreBadge}
            </Badge>
          ) : null}
          <EntityKindChip kind={entity.kind} className="shrink-0" />
        </div>

        {entity.org || (entity.roleBucket && isRoleBucket(entity.roleBucket)) ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            {entity.org ? (
              <span className="text-muted-foreground inline-flex items-center gap-1">
                {entity.org.logoUrl ? (
                  <Avatar className="size-3.5">
                    <AvatarImage src={entity.org.logoUrl} alt="" />
                    <AvatarFallback className="text-[8px]">
                      {entity.org.name[0]}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Building2 className="size-3" />
                )}
                <span className="max-w-[180px] truncate">
                  {entity.org.name}
                </span>
              </span>
            ) : null}
            {entity.roleBucket && isRoleBucket(entity.roleBucket) ? (
              <Badge
                variant="outline"
                className="text-muted-foreground h-5 text-[10px] font-normal"
              >
                {ROLE_BUCKET_LABELS[entity.roleBucket]}
              </Badge>
            ) : null}
          </div>
        ) : null}

        {snippet ? (
          <p
            className="text-muted-foreground mt-2 line-clamp-2 text-sm"
            dangerouslySetInnerHTML={{ __html: sanitizeSnippet(snippet) }}
          />
        ) : entity.description ? (
          <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
            {entity.description}
          </p>
        ) : null}

        {visibleTags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {visibleTags.map((t) => (
              <Badge key={t} variant="outline" className="text-[10px]">
                {t}
              </Badge>
            ))}
            {extraTagCount > 0 ? (
              <Badge variant="outline" className="text-[10px]">
                +{extraTagCount}
              </Badge>
            ) : null}
          </div>
        ) : null}

        {actions ? (
          <div className="mt-3 flex items-center gap-1">
            <SaveButton
              entity={{
                kind: entity.kind,
                id: entity.id,
                title: entity.title,
                subtitle: entity.subtitle ?? null,
              }}
              initialSaved={initialSaved}
              size="xs"
              variant="ghost"
            />
            <FollowButton
              entity={{
                kind: entity.kind as FollowEntityKind,
                id: entity.id,
                title: entity.title,
                url: entity.href,
              }}
              initialFollowing={initialFollowing}
              size="xs"
              variant="ghost"
            />
            <NoteButton
              entity={{
                kind: entity.kind,
                id: entity.id,
                title: entity.title,
              }}
              size="xs"
              variant="ghost"
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
