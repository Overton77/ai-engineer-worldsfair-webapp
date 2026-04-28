import { describe, expect, it } from "vitest";

import {
  addCandidateScore,
  buildRecommendationExclusionSet,
  rankRecommendationCandidates,
} from "./scoring";
import type { RecommendationCandidate } from "./types";

describe("recommendation scoring", () => {
  it("excludes entities the user already saved or follows", () => {
    const exclusions = buildRecommendationExclusionSet(
      [{ kind: "library", id: "langchain", action: "save" }],
      [{ kind: "person", id: "p1", action: "follow" }],
    );

    const ranked = rankRecommendationCandidates(
      [
        candidate("library", "langchain", 100),
        candidate("person", "p1", 90),
        candidate("paper", "gepa", 5),
      ],
      exclusions,
      10,
    );

    expect(ranked.map((row) => `${row.entityKind}:${row.entityId}`)).toEqual([
      "paper:gepa",
    ]);
  });

  it("merges duplicate candidates and keeps stable score ordering", () => {
    const map = new Map<string, RecommendationCandidate>();
    addCandidateScore(map, candidate("paper", "b", 2, ["popular_recently"]));
    addCandidateScore(map, candidate("paper", "a", 2, ["similar_users"]));
    addCandidateScore(map, candidate("paper", "a", 3, ["matches_profile"]));

    const ranked = rankRecommendationCandidates(map.values(), new Set(), 10);

    expect(ranked[0]).toMatchObject({
      entityKind: "paper",
      entityId: "a",
      reasonCodes: expect.arrayContaining(["similar_users", "matches_profile"]),
    });
    expect(ranked[1]).toMatchObject({ entityId: "b" });
  });
});

function candidate(
  entityKind: RecommendationCandidate["entityKind"],
  entityId: string,
  score: number,
  reasonCodes: RecommendationCandidate["reasonCodes"] = ["similar_users"],
): RecommendationCandidate {
  return {
    entityKind,
    entityId,
    score,
    reasonCodes,
  };
}
