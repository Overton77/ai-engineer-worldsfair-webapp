"use client";

import {
  Building2,
  Crown,
  ExternalLink,
  Globe,
  Landmark,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { OrgRow } from "@/components/directory/directory-types";
import { cn } from "@/lib/utils";

function SectionLabel({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-1.5 pb-2">
      <Icon className="size-3.5 text-muted-foreground" aria-hidden />
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {count != null && count > 0 ? (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {count}
        </span>
      ) : null}
    </div>
  );
}

function PersonChip({
  name,
  role,
  badge,
  onClick,
}: {
  name: string;
  role?: string | null;
  badge?: string;
  onClick?: () => void;
}) {
  const inner = (
    <div className="flex min-w-0 items-start gap-2.5 px-3 py-2.5">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <span className="text-[11px] font-semibold leading-none">
          {(name[0] ?? "?").toUpperCase()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight text-foreground">{name}</p>
        {role ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{role}</p>
        ) : null}
      </div>
      {badge ? (
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {badge}
        </Badge>
      ) : null}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-xl border border-border/80 bg-card text-left transition-all hover:border-primary/30 hover:bg-primary/3 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {inner}
      </button>
    );
  }
  return (
    <div className="w-full rounded-xl border border-border/80 bg-card">{inner}</div>
  );
}

export function OrgDetailPanel({
  org,
  onOpenPerson,
}: {
  org: OrgRow;
  onOpenPerson: (id: string) => void | Promise<void>;
}) {
  const ceo = org.organization_has_ceo?.[0];
  const founders = org.person_founded_organization ?? [];
  const employees = org.person_employed_by ?? [];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-primary/10 text-primary shadow-sm">
          <Landmark className="size-7" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold leading-tight text-foreground">
              {org.name ?? org.organization_id}
            </h2>
            {org.organization_type ? (
              <Badge variant="outline" className="text-xs font-normal">
                {org.organization_type}
              </Badge>
            ) : null}
          </div>
          {org.primary_ai_focus ? (
            <p className="text-sm text-muted-foreground">{org.primary_ai_focus}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {org.website_domain ? (
              <a
                href={org.website_domain.startsWith("http") ? org.website_domain : `https://${org.website_domain}`}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 gap-1.5 text-xs")}
              >
                <Globe className="size-3" />
                {org.website_domain}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Overview ── */}
      {org.overview ? (
        <>
          <Separator />
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {org.overview}
          </p>
        </>
      ) : null}

      {/* ── Leadership ── */}
      {ceo?.person ? (
        <>
          <Separator />
          <section>
            <SectionLabel icon={Crown} label="Leadership" />
            {(() => {
              const person = ceo.person!;
              const pid = person.person_id;
              return (
                <PersonChip
                  name={person.full_name ?? person.person_id}
                  role={ceo.role_title ?? "CEO"}
                  badge="CEO"
                  onClick={pid ? () => void onOpenPerson(pid) : undefined}
                />
              );
            })()}
          </section>
        </>
      ) : null}

      {/* ── Founders ── */}
      {founders.length > 0 ? (
        <>
          <Separator />
          <section>
            <SectionLabel icon={Building2} label="Founders" count={founders.length} />
            <div className="grid gap-2 sm:grid-cols-2">
              {founders.map((row, i) => {
                const pid = row.person?.person_id;
                return (
                  <PersonChip
                    key={i}
                    name={row.person?.full_name ?? "Person"}
                    role={row.role_title}
                    badge="Founder"
                    onClick={pid ? () => void onOpenPerson(pid) : undefined}
                  />
                );
              })}
            </div>
          </section>
        </>
      ) : null}

      {/* ── Team ── */}
      {employees.length > 0 ? (
        <>
          <Separator />
          <section>
            <SectionLabel icon={Users} label="Team" count={employees.length} />
            <div
              className={cn(
                "grid gap-2 sm:grid-cols-2",
                employees.length > 8 && "max-h-[420px] overflow-y-auto pr-1",
              )}
            >
              {employees.map((row, i) => {
                const pid = row.person?.person_id;
                return (
                  <PersonChip
                    key={i}
                    name={row.person?.full_name ?? "Person"}
                    role={row.role_title}
                    onClick={pid ? () => void onOpenPerson(pid) : undefined}
                  />
                );
              })}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
