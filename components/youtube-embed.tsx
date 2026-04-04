import { youtubeEmbedSrc, resolveYoutubeVideoId } from "@/lib/youtube";

type YoutubeEmbedProps = {
  videoId?: string | null;
  url?: string | null;
  title?: string | null;
  className?: string;
};

export function YoutubeEmbed({ videoId, url, title, className = "" }: YoutubeEmbedProps) {
  const id = resolveYoutubeVideoId(videoId, url);
  if (!id) {
    return (
      <div
        className={`flex aspect-video w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 ${className}`}
      >
        No playable YouTube id for this record.
      </div>
    );
  }

  const src = youtubeEmbedSrc(id);

  return (
    <div className={`overflow-hidden rounded-xl border border-zinc-200 shadow-lg dark:border-zinc-800 ${className}`}>
      <div className="relative aspect-video w-full bg-black">
        <iframe
          title={title ? `YouTube: ${title}` : "YouTube video"}
          src={src}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  );
}
