import { handleCallback } from "@vercel/queue";
import { processResearchMessage } from "@/lib/stock-research/queue";
export const runtime = "nodejs";
export const POST = handleCallback(processResearchMessage);
