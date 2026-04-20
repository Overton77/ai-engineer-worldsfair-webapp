"use client";

import { Search, X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type SearchInputProps = {
  value: string;
  onChangeValue: (next: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  /** Debounce in ms applied between the user typing and onChangeValue firing. Defaults to 250. */
  debounceMs?: number;
};

/**
 * Debounced controlled search input. Renders inside a `<search>`
 * landmark for accessibility and exposes a clear button.
 *
 * The component owns a local "draft" string so typing feels snappy even
 * when the parent re-derives state asynchronously (URL updates).
 */
export function SearchInput({
  value,
  onChangeValue,
  placeholder = "Search…",
  className,
  ariaLabel,
  debounceMs = 250,
}: SearchInputProps) {
  const [draft, setDraft] = React.useState(value);
  const lastEmittedRef = React.useRef(value);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (value !== lastEmittedRef.current) {
      setDraft(value);
      lastEmittedRef.current = value;
    }
  }, [value]);

  const flush = React.useCallback(
    (next: string) => {
      lastEmittedRef.current = next;
      onChangeValue(next);
    },
    [onChangeValue],
  );

  const handleChange = (next: string) => {
    setDraft(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => flush(next), debounceMs);
  };

  const clear = () => {
    setDraft("");
    if (timerRef.current) clearTimeout(timerRef.current);
    flush("");
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <search role="search" className={cn("block", className)}>
      <label className="sr-only" htmlFor="explore-search">
        {ariaLabel ?? placeholder}
      </label>
      <div className="border-border/60 bg-background focus-within:ring-ring/40 focus-within:border-ring flex h-11 items-center gap-2 rounded-lg border px-3 transition-shadow focus-within:ring-3">
        <Search className="text-muted-foreground size-4 shrink-0" />
        <input
          id="explore-search"
          type="search"
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="placeholder:text-muted-foreground h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        {draft ? (
          <button
            type="button"
            onClick={clear}
            className="text-muted-foreground hover:text-foreground rounded-md p-1"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
    </search>
  );
}
