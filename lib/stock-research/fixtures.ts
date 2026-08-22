import aapl from "./fixtures/aapl.json";
import { researchBundleSchema, type ResearchBundle } from "./types";

export function replayFixture(ticker: string, asOf: string): ResearchBundle {
  if (ticker !== "AAPL") throw new Error("No replayable public-source fixture for ticker");
  const candidate = { ...aapl, asOf };
  return researchBundleSchema.parse(candidate);
}
