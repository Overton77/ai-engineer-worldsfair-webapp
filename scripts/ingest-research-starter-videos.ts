/**
 * Upsert the AI Engineer channel catalog into research_starter_videos.
 * Transcript fetch/upload lives in scripts/research-starter-transcripts/.
 *
 *   pnpm exec tsx scripts/ingest-research-starter-videos.ts --catalog-only
 *   pnpm exec tsx scripts/ingest-research-starter-videos.ts --transcripts-only
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import {
  DEFAULT_CATALOG,
  createServiceClient,
  ingestTranscripts,
  parseTranscriptArgs,
  type TranscriptIngestArgs,
} from "./research-starter-transcripts/ingest.ts";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const UPSERT_BATCH = 100;

type CatalogFile = {
  source?: string;
  channel_handle?: string;
  channel_id?: string;
  fetched_at_utc?: string;
  total_videos?: number;
  videos: CatalogVideo[];
};

type CatalogVideo = {
  video_id: string;
  title: string;
  description?: string | null;
  published_at?: string | null;
  channel_title?: string | null;
  duration?: string | null;
  duration_seconds?: number | null;
  view_count?: number | null;
  like_count?: number | null;
  comment_count?: number | null;
  thumbnail_url?: string | null;
  url?: string | null;
};

type CatalogRow = {
  video_id: string;
  title: string;
  description: string | null;
  published_at: string | null;
  channel_id: string | null;
  channel_handle: string | null;
  channel_title: string | null;
  duration: string | null;
  duration_seconds: number | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  thumbnail_url: string | null;
  url: string | null;
  source: string | null;
  catalog_fetched_at: string | null;
  metadata: Record<string, unknown>;
};

type Args = TranscriptIngestArgs & {
  catalogOnly: boolean;
  transcriptsOnly: boolean;
  catalogPath: string;
};

function parseArgs(argv: string[]): Args {
  const transcriptArgs = parseTranscriptArgs(
    argv.filter((token) => token !== "--catalog-only" && token !== "--transcripts-only"),
  );
  let catalogPath = transcriptArgs.catalog ?? DEFAULT_CATALOG;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--catalog" && argv[i + 1] && !argv[i + 1].startsWith("--")) {
      catalogPath = resolve(process.cwd(), argv[i + 1]);
    }
  }
  return {
    ...transcriptArgs,
    catalog: catalogPath,
    catalogPath,
    catalogOnly: argv.includes("--catalog-only"),
    transcriptsOnly: argv.includes("--transcripts-only"),
  };
}

function toRow(video: CatalogVideo, catalog: CatalogFile): CatalogRow {
  return {
    video_id: video.video_id,
    title: video.title,
    description: video.description ?? null,
    published_at: video.published_at ?? null,
    channel_id: catalog.channel_id ?? null,
    channel_handle: catalog.channel_handle ?? null,
    channel_title: video.channel_title ?? null,
    duration: video.duration ?? null,
    duration_seconds: video.duration_seconds ?? null,
    view_count: video.view_count ?? null,
    like_count: video.like_count ?? null,
    comment_count: video.comment_count ?? null,
    thumbnail_url: video.thumbnail_url ?? null,
    url: video.url ?? null,
    source: catalog.source ?? "youtube_data_api_v3",
    catalog_fetched_at: catalog.fetched_at_utc ?? null,
    metadata: {
      catalog_total_videos: catalog.total_videos ?? null,
    },
  };
}

async function upsertCatalog(
  rows: CatalogRow[],
  dryRun: boolean,
): Promise<void> {
  const sb = createServiceClient();
  console.log(`[catalog] upserting ${rows.length} videos`);
  if (dryRun) return;

  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    const batch = rows.slice(i, i + UPSERT_BATCH);
    const { error } = await sb.from("research_starter_videos").upsert(batch, {
      onConflict: "video_id",
      ignoreDuplicates: false,
    });
    if (error) {
      throw new Error(`catalog upsert failed at ${i}: ${error.message}`);
    }
    console.log(`[catalog] ${Math.min(i + batch.length, rows.length)}/${rows.length}`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const catalogPath = args.catalogPath || DEFAULT_CATALOG;
  const raw = await readFile(catalogPath, "utf8");
  const catalog = JSON.parse(raw) as CatalogFile;
  if (!Array.isArray(catalog.videos)) {
    throw new Error("catalog JSON is missing videos[]");
  }

  const videos = args.limit ? catalog.videos.slice(0, args.limit) : catalog.videos;
  console.log(
    `[ingest] ${videos.length} videos from ${catalogPath} (catalog reports ${catalog.total_videos ?? "unknown"})`,
  );

  if (!args.transcriptsOnly) {
    await upsertCatalog(
      videos.map((video) => toRow(video, catalog)),
      args.dryRun,
    );
  }
  if (!args.catalogOnly) {
    const sb = createServiceClient();
    await ingestTranscripts(
      sb,
      videos.map((video) => video.video_id),
      args,
    );
  }
}

main().catch((err) => {
  console.error("[ingest] FAILED:", err);
  process.exit(1);
});
