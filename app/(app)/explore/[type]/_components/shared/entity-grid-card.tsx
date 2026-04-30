"use client";

import Link from "next/link";

import { FollowButton } from "@/components/save-follow/follow-button";
import { NoteButton } from "@/components/save-follow/note-button";
import { SaveButton } from "@/components/save-follow/save-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { FollowEntityKind } from "@/lib/schema/entity-kind";
import { CATEGORY_LABELS, DOMAIN_LAYER_META } from "@/lib/schema/taxonomy";
import { cn } from "@/lib/utils";
import type { EntitySummary } from "@/types/domain";

import { ExpandableOverview } from "./expandable-overview";

function initialsOf(title: string): string {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function EntityGridCard({
  entity,
  initialSaved = false,
  initialFollowing = false,
  openLabel = "Open item",
  media = false,
}: {
  entity: EntitySummary;
  initialSaved?: boolean;
  initialFollowing?: boolean;
  openLabel?: string;
  media?: boolean;
}) {
  const visibleTags = (entity.tags ?? []).slice(0, 3);
  const extraTagCount = Math.max(0, (entity.tags?.length ?? 0) - visibleTags.length);
  const overviewId = `${entity.kind}-overview-${entity.id}`;

  return (
    <article className="border-border/60 bg-card hover:border-border flex min-h-64 flex-col overflow-hidden rounded-xl border transition-colors">
      {media ? (
        <Link
          href={entity.href}
          className="bg-muted focus-visible:ring-ring/50 relative aspect-video w-full overflow-hidden focus-visible:ring-3 focus-visible:outline-none"
        >
          {entity.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entity.imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-200 hover:scale-[1.02]"
            />
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
              No image available
            </div>
          )}
        </Link>
      ) : null}

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          {!media ? (
            <Avatar className="size-14">
              {entity.imageUrl ? <AvatarImage src={entity.imageUrl} alt="" /> : null}
              <AvatarFallback>{initialsOf(entity.title)}</AvatarFallback>
            </Avatar>
          ) : null}

          <div className="min-w-0 flex-1">
            <Link
              href={entity.href}
              className="focus-visible:ring-ring/50 block rounded focus-visible:ring-3 focus-visible:outline-none"
            >
              <h3 className="line-clamp-2 text-base font-semibold tracking-tight">
                {entity.title}
              </h3>
            </Link>
            {entity.subtitle ? (
              <Link
                href={entity.href}
                className="focus-visible:ring-ring/50 block rounded focus-visible:ring-3 focus-visible:outline-none"
              >
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {entity.subtitle}
                </p>
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {entity.layer ? (
            <Badge variant="secondary" className="text-[10px]">
              {DOMAIN_LAYER_META[entity.layer].label}
            </Badge>
          ) : null}
          {entity.category ? (
            <Badge variant="outline" className="text-[10px]">
              {CATEGORY_LABELS[entity.category]}
            </Badge>
          ) : null}
          {visibleTags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
          {extraTagCount > 0 ? (
            <Badge variant="outline" className="text-[10px]">
              +{extraTagCount}
            </Badge>
          ) : null}
        </div>

        <ExpandableOverview
          id={overviewId}
          text={entity.description}
          href={entity.href}
          openLabel={openLabel}
        />

        <div
          className={cn(
            "mt-auto flex items-center gap-1 pt-4",
            !entity.description?.trim() && "pt-8",
          )}
        >
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
      </div>
    </article>
  );
}
