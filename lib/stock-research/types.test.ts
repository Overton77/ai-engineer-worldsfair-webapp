import { describe, expect, it } from "vitest";
import fixture from "./fixtures/aapl.json";
import { mcpRequestSchema, MCP_METHODS } from "./mcp";
import { researchBundleSchema } from "./types";
describe("source-grounded bundle gate",()=>{
 it("accepts the replayable public-source fixture",()=>expect(researchBundleSchema.parse(fixture).ticker).toBe("AAPL"));
 it("fails closed on uncited claims",()=>{const value=structuredClone(fixture);value.thesis[0].evidenceIndexes=[];expect(researchBundleSchema.safeParse(value).success).toBe(false)});
 it("rejects evidence published after as_of",()=>{const value=structuredClone(fixture);value.evidence[0].publishedAt="2024-11-02T00:00:00.000Z";expect(researchBundleSchema.safeParse(value).success).toBe(false)});
 it("requires exact excerpts or structured facts",()=>{const value: unknown = structuredClone(fixture);const evidence=(value as {evidence:Array<{excerpt:string|null;structuredFact:unknown}>}).evidence[0];evidence.excerpt=null;evidence.structuredFact=null;expect(researchBundleSchema.safeParse(value).success).toBe(false)});
});
describe("read-only MCP allowlist",()=>{
 it("contains exactly status and approved bundle reads",()=>expect(MCP_METHODS).toEqual(["stock_research.status","stock_research.approved_bundle"]));
 it("rejects mutation methods and extra credential fields",()=>{expect(mcpRequestSchema.safeParse({jsonrpc:"2.0",id:1,method:"stock_research.approve",params:{runId:"f67b0603-94dd-4103-a495-2e694def9ad2"}}).success).toBe(false);expect(mcpRequestSchema.safeParse({jsonrpc:"2.0",id:1,method:"stock_research.status",params:{runId:"f67b0603-94dd-4103-a495-2e694def9ad2",brokerToken:"secret"}}).success).toBe(false)});
});
