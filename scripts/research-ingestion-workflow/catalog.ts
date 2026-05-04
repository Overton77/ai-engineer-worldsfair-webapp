/// <reference types="node" />

import { readdir } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import type { VideoCatalogRecord } from "./types";
import { exists, readJson } from "./fs-utils";

interface CategoryFile {
  category?: string;
  videos?: VideoCatalogRecord[];
}

type CatalogList = VideoCatalogRecord[] | { videos?: VideoCatalogRecord[] };

export async function findCatalogRecord(
  vaultRoot: string,
  videoId: string,
  preferredBucket?: string,
): Promise<{ video: VideoCatalogRecord; bucket: string }> {
  const youtubeRoot = resolve(vaultRoot, "04_catalogs", "youtube", "aiengineerchannel");
  const categoryRoot = join(youtubeRoot, "by_category");

  if (preferredBucket) {
    const categoryPath = join(categoryRoot, `${preferredBucket}.json`);
    if (await exists(categoryPath)) {
      const category = await readJson<CategoryFile>(categoryPath);
      const hit = category.videos?.find((video) => video.video_id === videoId);
      if (hit) return { video: { ...hit, category: preferredBucket }, bucket: preferredBucket };
    }
  }

  const sortedPath = join(youtubeRoot, "ai_engineer_aidotengineer_channel_videos_sorted.json");
  if (await exists(sortedPath)) {
    const sorted = await readJson<CatalogList>(sortedPath);
    const videos = Array.isArray(sorted) ? sorted : sorted.videos ?? [];
    const hit = videos.find((video) => video.video_id === videoId);
    if (hit?.category) return { video: hit, bucket: String(hit.category) };
  }

  if (await exists(categoryRoot)) {
    const files = (await readdir(categoryRoot)).filter((file) => file.endsWith(".json"));
    for (const file of files) {
      const bucket = basename(file, ".json");
      const category = await readJson<CategoryFile>(join(categoryRoot, file));
      const hit = category.videos?.find((video) => video.video_id === videoId);
      if (hit) return { video: { ...hit, category: bucket }, bucket };
    }
  }

  throw new Error(`Could not find video ${videoId} in AI Engineer YouTube catalogs`);
}
