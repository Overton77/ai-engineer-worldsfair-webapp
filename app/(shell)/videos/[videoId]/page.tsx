import { notFound } from "next/navigation";

import { VideoPage } from "@/components/videos/video-page";
import { createServiceClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

const VIDEO_EXPAND = `*,
  youtube_channel(*),
  session_recorded_as_video(match_similarity, session(*)),
  person_appeared_in_video(matched_name_variant, match_method, person(*))`;

export default async function YoutubeVideoPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  if (!videoId) notFound();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("youtube_video")
    .select(VIDEO_EXPAND)
    .eq("video_id", videoId)
    .maybeSingle();

  if (error || !data) notFound();

  let viewer: { id: string; email?: string | null } | null = null;
  try {
    const userSupabase = await createServerSupabase();
    const {
      data: { user },
    } = await userSupabase.auth.getUser();
    if (user) {
      viewer = { id: user.id, email: user.email ?? null };
    }
  } catch {
    viewer = null;
  }

  return <VideoPage initialVideo={data} viewer={viewer} />;
}
