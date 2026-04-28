import { handleCallback } from "@vercel/queue";

import { processEntityInteractionMessage } from "@/lib/recommendations/recompute";

export const runtime = "nodejs";

export const POST = handleCallback(async (message) => {
  await processEntityInteractionMessage(message);
});
