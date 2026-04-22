"use client";

import { ChevronDown, Plus, X } from "lucide-react";
import * as React from "react";

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

import { FilterGroup } from "./filter-group";

export type TagSuggestion = {
  value: string;
  count?: number;
};

export type TagComboboxGroupProps = {
  title?: string;
  /** Top suggested tags from the facet RPC, scoped by current filter. */
  suggestions: readonly TagSuggestion[];
  selected: readonly string[];
  onChange: (next: string[]) => void;
  /**
   * If true, users may add a tag that isn't in `suggestions`. Off by
   * default so people don't add tags with zero matches.
   */
  allowFreeform?: boolean;
  loading?: boolean;
  emptyMessage?: string;
};

export function TagComboboxGroup({
  title = "Tags",
  suggestions,
  selected,
  onChange,
  allowFreeform = false,
  loading,
  emptyMessage,
}: TagComboboxGroupProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const remove = (t: string) =>
    onChange(selected.filter((x) => x !== t) as string[]);
  const add = (t: string) => {
    const v = t.trim();
    if (!v) return;
    if (selected.includes(v)) return;
    onChange([...selected, v]);
  };

  const noSuggestions = suggestions.length === 0;
  const showFreeformHint =
    allowFreeform && draft.trim().length > 0 && !selected.includes(draft.trim()) &&
    !suggestions.some((s) => s.value.toLowerCase() === draft.trim().toLowerCase());

  return (
    <FilterGroup title={title}>
      <div className="flex flex-col gap-2">
        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selected.map((t) => (
              <Badge key={t} variant="secondary" className="gap-1 pr-1">
                <span className="max-w-[120px] truncate">{t}</span>
                <button
                  type="button"
                  onClick={() => remove(t)}
                  aria-label={`Remove ${t}`}
                  className="hover:text-foreground"
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            ))}
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
                disabled={!allowFreeform && noSuggestions}
              >
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  <Plus className="size-3" />
                  {selected.length > 0 ? "Add tag…" : "Choose tag…"}
                </span>
                <ChevronDown className="size-3 opacity-60" />
              </Button>
            }
          />
          <PopoverContent
            align="start"
            sideOffset={4}
            className="w-[240px] p-0"
          >
            <Command shouldFilter>
              <CommandInput
                placeholder="Search tags…"
                value={draft}
                onValueChange={setDraft}
              />
              <CommandList className="max-h-72">
                <CommandEmpty>
                  {loading
                    ? "Loading tags…"
                    : noSuggestions
                      ? (emptyMessage ?? "No tags available yet.")
                      : "No matches."}
                </CommandEmpty>
                {suggestions.length > 0 ? (
                  <CommandGroup>
                    {suggestions.map((s) => (
                      <CommandItem
                        key={s.value}
                        value={s.value}
                        onSelect={() => {
                          add(s.value);
                          setDraft("");
                        }}
                        className="flex items-center gap-2"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {s.value}
                        </span>
                        {typeof s.count === "number" ? (
                          <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                            {s.count.toLocaleString()}
                          </span>
                        ) : null}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}
                {showFreeformHint ? (
                  <CommandGroup heading="Add new">
                    <CommandItem
                      value={`__add_${draft}`}
                      onSelect={() => {
                        add(draft);
                        setDraft("");
                      }}
                    >
                      <Plus className="size-3 opacity-60" />
                      <span className="truncate">Add &ldquo;{draft.trim()}&rdquo;</span>
                    </CommandItem>
                  </CommandGroup>
                ) : null}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </FilterGroup>
  );
}
