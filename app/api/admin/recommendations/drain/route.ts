import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { drainPendingRecommendationEvents } from "@/lib/recommendations/recompute";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.RECOMMENDATION_DRAIN_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || !hasValidBearerSecret(authorization, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const batchSize = Number(url.searchParams.get("limit") ?? "25");
  const result = await drainPendingRecommendationEvents({
    batchSize: Number.isFinite(batchSize) ? batchSize : 25,
  });

  return NextResponse.json({ ok: true, ...result });
}

function hasValidBearerSecret(
  authorization: string | null,
  secret: string,
): boolean {
  const prefix = "Bearer ";
  if (!authorization?.startsWith(prefix)) return false;
  const token = authorization.slice(prefix.length);
  const tokenBuffer = Buffer.from(token);
  const secretBuffer = Buffer.from(secret);
  if (tokenBuffer.length !== secretBuffer.length) return false;
  return timingSafeEqual(tokenBuffer, secretBuffer);
}
