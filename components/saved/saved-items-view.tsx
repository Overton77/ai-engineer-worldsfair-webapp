"use client";

import { useMemo, useState } from "react";
import { Bookmark, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { entityTypeLabel, type EntityType } from "@/lib/user-content";
import type { Tables } from "@/types/database.types";

type SavedItemsViewProps = {
  initialSavedItems: Tables<"saved_items">[];
};

export function SavedItemsView({ initialSavedItems }: SavedItemsViewProps) {
  const [savedItems] = useState(initialSavedItems);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return savedItems;
    const q = searchQuery.toLowerCase();
    return savedItems.filter(
      (item) =>
        item.entity_title.toLowerCase().includes(q) ||
        (item.entity_subtitle ?? "").toLowerCase().includes(q) ||
        item.entity_type.toLowerCase().includes(q),
    );
  }, [savedItems, searchQuery]);

  const grouped = useMemo(() => {
    const groups: Record<string, Tables<"saved_items">[]> = {};
    for (const item of filteredItems) {
      const key = item.entity_type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [filteredItems]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bookmark className="size-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Saved Items</h1>
          <p className="text-sm text-muted-foreground">
            {savedItems.length} item{savedItems.length !== 1 ? "s" : ""} saved from the directory
          </p>
        </div>
      </div>

      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search saved items..."
        className="max-w-sm text-sm"
      />

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Bookmark className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? "No saved items match your search."
              : "Nothing saved yet. Browse the directory and save entities you want to revisit."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([type, items]) => (
            <section key={type}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <Badge variant="secondary">{entityTypeLabel(type as EntityType)}</Badge>
                <span className="text-muted-foreground">({items.length})</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 font-medium text-foreground">{item.entity_title}</p>
                      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    {item.entity_subtitle ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {item.entity_subtitle}
                      </p>
                    ) : null}
                    <p className="mt-2 text-[10px] text-muted-foreground/70">
                      Saved {new Date(item.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
