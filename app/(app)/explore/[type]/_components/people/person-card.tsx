"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { FollowButton } from "@/components/save-follow/follow-button";
import { NoteButton } from "@/components/save-follow/note-button";
import { SaveButton } from "@/components/save-follow/save-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FollowEntityKind } from "@/lib/schema/entity-kind";
import {
  ROLE_BUCKET_LABELS,
  isRoleBucket,
} from "@/lib/search/people-roles";
import { OverviewInlineLinks } from "@/lib/text/overview-inline-links";
import { cn } from "@/lib/utils";
import type { EntitySummary } from "@/types/domain";

function initialsOf(title: string): string {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function PersonCard({
  person,
  initialSaved = false,
  initialFollowing = false,
}: {
  person: EntitySummary;
  initialSaved?: boolean;
  initialFollowing?: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const overview = person.description?.trim();

  return (
    <article className="border-border/60 bg-card hover:border-border flex min-h-64 flex-col rounded-xl border p-4 transition-colors">
      <div className="flex items-start gap-3">
        <Avatar className="size-14">
          {person.imageUrl ? (
            <AvatarImage src={person.imageUrl} alt="" />
          ) : null}
          <AvatarFallback>{initialsOf(person.title)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <Link
            href={person.href}
            className="focus-visible:ring-ring/50 block rounded focus-visible:ring-3 focus-visible:outline-none"
          >
            <h3 className="line-clamp-2 text-base font-semibold tracking-tight">
              {person.title}
            </h3>
          </Link>
          {person.subtitle ? (
            <Link
              href={person.href}
              className="focus-visible:ring-ring/50 block rounded focus-visible:ring-3 focus-visible:outline-none"
            >
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {person.subtitle}
              </p>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        {person.org ? (
          <span className="text-muted-foreground inline-flex min-w-0 items-center gap-1">
            <Building2 className="size-3 shrink-0" />
            <span className="truncate">{person.org.name}</span>
          </span>
        ) : null}
        {person.roleBucket && isRoleBucket(person.roleBucket) ? (
          <Badge
            variant="outline"
            className="text-muted-foreground h-5 text-[10px] font-normal"
          >
            {ROLE_BUCKET_LABELS[person.roleBucket]}
          </Badge>
        ) : null}
      </div>

      {overview ? (
        <div className="mt-3 flex flex-col gap-2">
          <p
            id={`person-overview-${person.id}`}
            className="text-muted-foreground text-sm"
          >
            <span
              className={cn(
                expanded ? "leading-relaxed" : "line-clamp-4",
                "[&_a]:underline [&_a]:decoration-primary/45",
              )}
            >
              <OverviewInlineLinks text={overview} />
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="link"
              size="xs"
              className="h-auto px-0"
              aria-expanded={expanded}
              aria-controls={`person-overview-${person.id}`}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Show less" : "Show full overview"}
            </Button>
            {expanded ? (
              <Link
                href={person.href}
                className="text-primary hover:text-primary/80 focus-visible:ring-ring/50 rounded text-xs font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:outline-none"
              >
                Open profile
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="border-border/60 bg-muted/30 text-muted-foreground mt-3 rounded-lg border border-dashed px-3 py-2 text-sm italic">
          No overview available yet.
        </p>
      )}

      <div
        className={cn(
          "mt-auto flex items-center gap-1 pt-4",
          !overview && "pt-8",
        )}
      >
        <SaveButton
          entity={{
            kind: person.kind,
            id: person.id,
            title: person.title,
            subtitle: person.subtitle ?? null,
          }}
          initialSaved={initialSaved}
          size="xs"
          variant="ghost"
        />
        <FollowButton
          entity={{
            kind: person.kind as FollowEntityKind,
            id: person.id,
            title: person.title,
            url: person.href,
          }}
          initialFollowing={initialFollowing}
          size="xs"
          variant="ghost"
        />
        <NoteButton
          entity={{
            kind: person.kind,
            id: person.id,
            title: person.title,
          }}
          size="xs"
          variant="ghost"
        />
      </div>
    </article>
  );
}
