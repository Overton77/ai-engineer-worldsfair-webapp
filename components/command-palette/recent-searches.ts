"use client";

const KEY = "aie:cmdk:recent";
const MAX = 8;

export function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(0, MAX);
  } catch {
    return [];
  }
}

export function pushRecentSearch(query: string): string[] {
  if (typeof window === "undefined") return [];
  const trimmed = query.trim();
  if (!trimmed) return loadRecentSearches();
  const existing = loadRecentSearches();
  const next = [trimmed, ...existing.filter((q) => q !== trimmed)].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage may be disabled (private mode); ignore.
  }
  return next;
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
