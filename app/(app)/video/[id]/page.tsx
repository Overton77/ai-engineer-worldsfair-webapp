import { notFound } from "next/navigation";

import { DossierHero } from "@/components/dossier/dossier-hero";
import { NotesPlaceholder } from "@/components/dossier/notes-placeholder";
import { RelationshipSection } from "@/components/dossier/relationship-section";
import { Separator } from "@/components/ui/separator";
import { getVideoDossier } from "@/lib/db/dossier";

import { VideoShell } from "./_video-shell";

type VideoPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: VideoPageProps) {
  const { id } = await params;
  const dossier = await getVideoDossier(id).catch(() => null);
  if (!dossier) return { title: "Video" };
  return { title: dossier.video.title ?? id };
}

function fmtNumber(n: number | null | undefined): string | null {
  if (n === null || n === undefined) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtDuration(sec: number | null | undefined): string | null {
  if (!sec || sec <= 0) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default async function VideoDossierPage({ params }: VideoPageProps) {
  const { id } = await params;
  const dossier = await getVideoDossier(id);
  if (!dossier) notFound();

  const { video } = dossier;
  const links = [
    video.url ? { label: "YouTube", href: video.url } : null,
  ].filter((l): l is { label: string; href: string } => l !== null);

  const views = fmtNumber(video.view_count);
  const likes = fmtNumber(video.like_count);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <DossierHero
        kind="youtube_video"
        title={video.title ?? id}
        subtitle={dossier.channelTitle}
        description={video.description}
        imageUrl={video.thumbnail_url}
        tags={video.tags}
        meta={[
          video.published_at
            ? new Date(video.published_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : null,
          fmtDuration(video.duration_seconds),
          views ? `${views} views` : null,
          likes ? `${likes} likes` : null,
          video.language,
        ]}
        links={links}
        backHref="/explore/youtube_video"
        backLabel="Back to Videos"
      />

      <Section title="Watch">
        <VideoShell videoId={id} chapters={dossier.chapters} />
      </Section>

      <Section title="Mentions">
        <RelationshipSection
          rows={[
            {
              label: "Speakers",
              items: dossier.speakers,
              emptyHint: "No speakers identified.",
            },
            {
              label: "Libraries",
              items: dossier.libraries,
              emptyHint: "No libraries indexed.",
            },
            {
              label: "Papers",
              items: dossier.papers,
              emptyHint: "No papers cited.",
            },
            {
              label: "Products",
              items: dossier.products,
              emptyHint: "No products mentioned.",
            },
            {
              label: "Linked talk",
              items: dossier.session ? [dossier.session] : [],
              emptyHint: "No conference talk linked.",
            },
            {
              label: "Linked event",
              items: dossier.event ? [dossier.event] : [],
              emptyHint: "No event linked.",
            },
          ]}
        />
      </Section>

      <Section title="Notes">
        <NotesPlaceholder />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <Separator />
      {children}
    </section>
  );
}
