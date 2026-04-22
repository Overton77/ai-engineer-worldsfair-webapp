"use client";

import { ChevronDown, Plus, X } from "lucide-react";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { FilterGroup } from "./filter-group";

export type OrgOption = {
  id: string;
  name: string;
  slug?: string | null;
  logoUrl?: string | null;
  count?: number;
};

export type OrgPickerGroupProps = {
  title?: string;
  /** Top organizations to display in the picker, sorted by relevance. */
  options: readonly OrgOption[];
  selected: readonly string[];
  /** Map of id -> OrgOption for selected ids that may not be in `options`. */
  selectedDetails?: Readonly<Record<string, OrgOption>>;
  onChange: (next: string[]) => void;
  /** Whether facet counts are still loading. Affects empty-state copy. */
  loading?: boolean;
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function OrgPickerGroup({
  title = "Company",
  options,
  selected,
  selectedDetails,
  onChange,
  loading,
}: OrgPickerGroupProps) {
  const [open, setOpen] = React.useState(false);

  const optionsById = React.useMemo(() => {
    const map = new Map<string, OrgOption>();
    options.forEach((o) => map.set(o.id, o));
    if (selectedDetails) {
      Object.values(selectedDetails).forEach((o) => {
        if (!map.has(o.id)) map.set(o.id, o);
      });
    }
    return map;
  }, [options, selectedDetails]);

  const remove = (id: string) =>
    onChange(selected.filter((x) => x !== id) as string[]);
  const add = (id: string) =>
    onChange(
      selected.includes(id) ? (selected as string[]) : [...selected, id],
    );

  return (
    <FilterGroup title={title}>
      <div className="flex flex-col gap-2">
        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selected.map((id) => {
              const o = optionsById.get(id);
              if (!o) {
                return (
                  <Badge key={id} variant="secondary" className="gap-1 pr-1">
                    {id}
                    <button
                      type="button"
                      onClick={() => remove(id)}
                      aria-label={`Remove ${id}`}
                      className="hover:text-foreground"
                    >
                      <X className="size-2.5" />
                    </button>
                  </Badge>
                );
              }
              return (
                <Badge key={id} variant="secondary" className="gap-1 pr-1">
                  <Avatar className="size-3.5">
                    {o.logoUrl ? <AvatarImage src={o.logoUrl} alt="" /> : null}
                    <AvatarFallback className="text-[8px]">
                      {initialsOf(o.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[100px] truncate">{o.name}</span>
                  <button
                    type="button"
                    onClick={() => remove(id)}
                    aria-label={`Remove ${o.name}`}
                    className="hover:text-foreground"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              );
            })}
          </div>
        ) : null}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full justify-between text-xs font-normal"
              >
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  <Plus className="size-3" />
                  {selected.length > 0 ? "Add company…" : "Choose company…"}
                </span>
                <ChevronDown className="size-3 opacity-60" />
              </Button>
            }
          />
          <PopoverContent
            align="start"
            sideOffset={4}
            className="w-[260px] p-0"
          >
            <Command>
              <CommandInput placeholder="Search companies…" />
              <CommandList className="max-h-72">
                <CommandEmpty>
                  {loading ? "Loading companies…" : "No companies match."}
                </CommandEmpty>
                <CommandGroup>
                  {options.map((o) => {
                    const isSelected = selected.includes(o.id);
                    return (
                      <CommandItem
                        key={o.id}
                        value={`${o.name} ${o.slug ?? ""}`}
                        onSelect={() => {
                          if (isSelected) remove(o.id);
                          else add(o.id);
                        }}
                        className={cn(
                          "flex items-center gap-2",
                          isSelected && "bg-accent",
                        )}
                      >
                        <Avatar className="size-5">
                          {o.logoUrl ? (
                            <AvatarImage src={o.logoUrl} alt="" />
                          ) : null}
                          <AvatarFallback className="text-[9px]">
                            {initialsOf(o.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {o.name}
                        </span>
                        {typeof o.count === "number" ? (
                          <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                            {o.count.toLocaleString()}
                          </span>
                        ) : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </FilterGroup>
  );
}
