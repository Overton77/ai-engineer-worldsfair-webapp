const DEFAULT_MAX_LIMIT = 200;

export function parseListParams(
  searchParams: URLSearchParams,
  options?: { maxLimit?: number },
) {
  const maxCap = options?.maxLimit ?? DEFAULT_MAX_LIMIT;
  const rawLimit = searchParams.get("limit");
  const rawOffset = searchParams.get("offset");
  const limit = Math.min(
    Math.max(Number.parseInt(rawLimit ?? "50", 10) || 50, 1),
    maxCap,
  );
  const offset = Math.max(Number.parseInt(rawOffset ?? "0", 10) || 0, 0);
  const expand =
    searchParams.get("expand") === "1" ||
    searchParams.get("expand") === "true";
  return { limit, offset, expand };
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
