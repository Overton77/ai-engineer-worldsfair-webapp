import { z } from "zod";

export const RUN_STATES = ["queued", "researching", "awaiting_approval", "approved", "rejected", "failed"] as const;
export const runStateSchema = z.enum(RUN_STATES);
export type RunState = z.infer<typeof runStateSchema>;

export const evidenceSchema = z.object({
  sourceUrl: z.string().url().refine((url) => url.startsWith("https://"), "public HTTPS source required"),
  publisher: z.string().trim().min(1),
  retrievedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable(),
  excerpt: z.string().trim().min(1).nullable(),
  structuredFact: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).nullable(),
}).superRefine((evidence, context) => {
  if (!evidence.excerpt && !evidence.structuredFact) context.addIssue({ code: "custom", message: "exact excerpt or structured fact required" });
});
export type ResearchEvidence = z.infer<typeof evidenceSchema>;

export const citedClaimSchema = z.object({
  claim: z.string().trim().min(1),
  evidenceIndexes: z.array(z.number().int().nonnegative()).min(1),
});

export const paperTradeSchema = z.object({
  action: z.enum(["buy", "hold", "avoid"]),
  notionalUsd: z.number().positive(),
  rationale: z.string().trim().min(1),
  simulationOnly: z.literal(true),
});

export const researchBundleSchema = z.object({
  schemaVersion: z.literal("1.0"),
  ticker: z.string().regex(/^[A-Z][A-Z0-9.-]{0,9}$/),
  asOf: z.string().datetime(),
  thesis: z.array(citedClaimSchema).min(1),
  counterThesis: z.array(citedClaimSchema).min(1),
  uncertainties: z.array(citedClaimSchema).min(1),
  evidence: z.array(evidenceSchema).min(1),
  paperTrade: paperTradeSchema,
  disclaimer: z.literal("Educational paper-trading simulation only; not personalized investment advice."),
}).superRefine((bundle, context) => {
  const asOf = Date.parse(bundle.asOf);
  bundle.evidence.forEach((evidence, index) => {
    if (evidence.publishedAt && Date.parse(evidence.publishedAt) > asOf) {
      context.addIssue({ code: "custom", path: ["evidence", index, "publishedAt"], message: "evidence published after as_of" });
    }
  });
  [...bundle.thesis, ...bundle.counterThesis, ...bundle.uncertainties].forEach((claim) => {
    claim.evidenceIndexes.forEach((index) => {
      if (!bundle.evidence[index]) context.addIssue({ code: "custom", message: `claim references missing evidence ${index}` });
    });
  });
});
export type ResearchBundle = z.infer<typeof researchBundleSchema>;

export const createRunSchema = z.object({
  ticker: z.string().trim().toUpperCase().regex(/^[A-Z][A-Z0-9.-]{0,9}$/),
  asOf: z.string().datetime().refine((value) => Date.parse(value) <= Date.now(), "as_of cannot be in the future"),
  challengeVersion: z.literal("1.0.0"),
});

export const queueMessageSchema = z.object({ runId: z.string().uuid(), challengeVersion: z.literal("1.0.0") });
