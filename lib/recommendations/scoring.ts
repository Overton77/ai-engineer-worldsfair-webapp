import {
  DEFAULT_RECOMMENDATION_LIMIT,
  type RecommendationCandidate,
  type RecommendationReasonCode,
  type RecommendationSignal,
  type RecommendableEntityKind,
} from "./types";

const MAX_SINGLE_SOURCE_SCORE = 10;
const MAX_PER_KIND_BEFORE_FILL = 6;

export function recommendationKey(ref: {
  entityKind?: string;
  kind?: string;
  entityId?: string;
  id?: string;
}): string {
  const kind = ref.entityKind ?? ref.kind;
  const id = ref.entityId ?? ref.id;
  return `${kind}:${id}`;
}

export function buildRecommendationExclusionSet(
  saves: ReadonlyArray<RecommendationSignal>,
  follows: ReadonlyArray<RecommendationSignal>,
): Set<string> {
  return new Set(
    [...saves, ...follows].map((signal) =>
      recommendationKey({ kind: signal.kind, id: signal.id }),
    ),
  );
}

export function mergeReasonCodes(
  current: ReadonlyArray<RecommendationReasonCode>,
  next: ReadonlyArray<RecommendationReasonCode>,
): RecommendationReasonCode[] {
  return Array.from(new Set([...current, ...next]));
}

export function addCandidateScore(
  candidates: Map<string, RecommendationCandidate>,
  input: RecommendationCandidate,
): void {
  const key = recommendationKey(input);
  const existing = candidates.get(key);
  const score = Math.min(input.score, MAX_SINGLE_SOURCE_SCORE);

  if (!existing) {
    candidates.set(key, {
      ...input,
      score,
      reasonCodes: mergeReasonCodes([], input.reasonCodes),
    });
    return;
  }

  candidates.set(key, {
    ...existing,
    score: existing.score + score,
    reasonCodes: mergeReasonCodes(existing.reasonCodes, input.reasonCodes),
    metadata: {
      ...existing.metadata,
      ...input.metadata,
    },
  });
}

export function rankRecommendationCandidates(
  candidates: Iterable<RecommendationCandidate>,
  exclusions: ReadonlySet<string>,
  limit = DEFAULT_RECOMMENDATION_LIMIT,
): RecommendationCandidate[] {
  const filtered = Array.from(candidates)
    .filter((candidate) => !exclusions.has(recommendationKey(candidate)))
    .filter((candidate) => Number.isFinite(candidate.score) && candidate.score > 0)
    .sort(compareCandidates);

  const selected: RecommendationCandidate[] = [];
  const deferred: RecommendationCandidate[] = [];
  const kindCounts = new Map<RecommendableEntityKind, number>();

  for (const candidate of filtered) {
    const count = kindCounts.get(candidate.entityKind) ?? 0;
    if (count < MAX_PER_KIND_BEFORE_FILL) {
      selected.push(withDiversityReason(candidate, count));
      kindCounts.set(candidate.entityKind, count + 1);
    } else {
      deferred.push(candidate);
    }
    if (selected.length >= limit) return selected;
  }

  for (const candidate of deferred) {
    selected.push(candidate);
    if (selected.length >= limit) break;
  }

  return selected;
}

function compareCandidates(
  left: RecommendationCandidate,
  right: RecommendationCandidate,
): number {
  if (right.score !== left.score) return right.score - left.score;
  if (left.entityKind !== right.entityKind) {
    return left.entityKind.localeCompare(right.entityKind);
  }
  return left.entityId.localeCompare(right.entityId);
}

function withDiversityReason(
  candidate: RecommendationCandidate,
  kindCount: number,
): RecommendationCandidate {
  if (kindCount > 0) return candidate;
  return {
    ...candidate,
    score: candidate.score + 0.05,
    reasonCodes: mergeReasonCodes(candidate.reasonCodes, ["diverse_kind"]),
  };
}
