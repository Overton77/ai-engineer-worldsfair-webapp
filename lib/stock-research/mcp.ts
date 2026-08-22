import { z } from "zod";
export const MCP_METHODS = ["stock_research.status", "stock_research.approved_bundle"] as const;
export const mcpRequestSchema = z.object({ jsonrpc: z.literal("2.0"), id: z.union([z.string(), z.number()]), method: z.enum(MCP_METHODS), params: z.object({ runId: z.string().uuid() }).strict() }).strict();
export function mcpError(id: string | number | null, code: number, message: string) { return { jsonrpc: "2.0" as const, id, error: { code, message } }; }
