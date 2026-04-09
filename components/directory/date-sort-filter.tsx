"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption = "newest" | "oldest" | "most_viewed" | "title_az";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "most_viewed", label: "Most viewed" },
  { value: "title_az", label: "Title A-Z" },
];

export function DateSortFilter({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (v: SortOption) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
      <SelectTrigger className="h-8 w-[160px] text-xs">
        <SelectValue placeholder="Sort by..." />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function sortParamsFromOption(option: SortOption): { sort_by: string; sort_dir: string } {
  switch (option) {
    case "newest":
      return { sort_by: "published_at", sort_dir: "desc" };
    case "oldest":
      return { sort_by: "published_at", sort_dir: "asc" };
    case "most_viewed":
      return { sort_by: "view_count", sort_dir: "desc" };
    case "title_az":
      return { sort_by: "title", sort_dir: "asc" };
    default:
      return { sort_by: "published_at", sort_dir: "desc" };
  }
}
