"use client";

import * as React from "react";

import { EntityKindIcon } from "@/components/explore/entity-kind-chip";
import { cn } from "@/lib/utils";
import type { EntityMentionItem } from "@/lib/notes/extensions/entity-mention";

type Props = {
  items: EntityMentionItem[];
  /** Top/left in viewport coords (set by the suggestion popup). */
  rect: { top: number; left: number; bottom: number } | null;
  onSelect: (item: EntityMentionItem) => void;
  loading?: boolean;
  query: string;
};

/**
 * Lightweight floating list rendered next to the user's caret while
 * they're typing `@…`. The TipTap suggestion plugin gives us the
 * caret rect via clientRect(); we just stick the list under it.
 *
 * Keyboard:
 *   ↑/↓ — move selection
 *   Enter / Tab — pick the active item
 *   Esc — handled by the suggestion plugin to dismiss
 *
 * The selection-and-key handling is exposed via `useImperativeHandle`
 * so the suggestion plugin can call into us.
 */
export type MentionPickerHandle = {
  onKeyDown: (event: KeyboardEvent) => boolean;
};

export const MentionPicker = React.forwardRef<MentionPickerHandle, Props>(
  function MentionPicker({ items, rect, onSelect, loading, query }, ref) {
    const [active, setActive] = React.useState(0);

    React.useEffect(() => {
      setActive(0);
    }, [items]);

    React.useImperativeHandle(ref, () => ({
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === "ArrowDown") {
          setActive((i) => (items.length === 0 ? 0 : (i + 1) % items.length));
          return true;
        }
        if (e.key === "ArrowUp") {
          setActive((i) =>
            items.length === 0 ? 0 : (i - 1 + items.length) % items.length,
          );
          return true;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          if (items[active]) {
            onSelect(items[active]);
            return true;
          }
        }
        return false;
      },
    }));

    if (!rect) return null;

    const style: React.CSSProperties = {
      position: "fixed",
      top: rect.bottom + 6,
      left: rect.left,
      zIndex: 60,
      width: 320,
      maxHeight: 280,
    };

    return (
      <div
        style={style}
        role="listbox"
        aria-label="Mention picker"
        className="border-border/60 bg-popover text-popover-foreground overflow-hidden rounded-lg border shadow-lg"
      >
        {items.length === 0 ? (
          <div className="text-muted-foreground px-3 py-3 text-xs">
            {loading
              ? "Searching…"
              : query
                ? `No matches for "${query}"`
                : "Type to search the corpus"}
          </div>
        ) : (
          <ul className="max-h-[280px] overflow-y-auto py-1">
            {items.map((item, i) => (
              <li
                key={`${item.kind}:${item.id}`}
                role="option"
                aria-selected={i === active}
              >
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onSelect(item);
                  }}
                  onClick={(event) => {
                    if (event.detail !== 0) return;
                    event.preventDefault();
                    event.stopPropagation();
                    onSelect(item);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                    i === active && "bg-muted",
                  )}
                >
                  <EntityKindIcon
                    kind={item.kind}
                    className="text-muted-foreground size-3.5 shrink-0"
                  />
                  <span className="truncate">{item.title}</span>
                  <span className="text-muted-foreground ml-auto shrink-0 text-[10px] uppercase tracking-wide">
                    {item.kind}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
