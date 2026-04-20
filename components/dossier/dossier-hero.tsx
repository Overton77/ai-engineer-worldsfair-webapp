"use client";

import { ArrowLeft, Bell, Bookmark, Bot, Pencil } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EntityKind } from "@/lib/schema/entity-kind";

import { EntityKindChip } from "../explore/entity-kind-chip";

type DossierHeroProps = {
  kind: EntityKind;
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
};

function initialsOf(t: string): string {
  return t
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function placeholder(action: string, title: string) {
  toast.message(`${action} coming soon`, {
    description: `Action wires up in M3. (${title})`,
  });
}

export function DossierHero({
  kind,
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => placeholder("Save", title)}
          >
            <Bookmark className="size-3.5" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => placeholder("Follow", title)}
          >
            <Bell className="size-3.5" />
            Follow
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => placeholder("Note", title)}
          >
            <Pencil className="size-3.5" />
            Note
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast.message("Assistant coming soon", {
                description: "Ask-the-assistant ships in M4.",
              })
            }
          >
            <Bot className="size-3.5" />
            Ask
          </Button>
        </div>
      </div>
    </header>
  );
}
