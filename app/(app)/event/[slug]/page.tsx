import { notFound } from "next/navigation";

import { CorpusSection } from "@/components/dossier/corpus-section";
import { DossierHero } from "@/components/dossier/dossier-hero";
import { EntityNotesFooter } from "@/components/dossier/notes-placeholder";
import { RelationshipSection } from "@/components/dossier/relationship-section";
import { NotesSplitShell } from "@/components/notes/notes-split-shell";
import { Separator } from "@/components/ui/separator";
import { getEventDossier } from "@/lib/db/dossier";
import { getDossierNotesContext } from "@/lib/db/dossier-notes";
import { getSaveFollowState } from "@/lib/db/save-follow-state";
import { refKey } from "@/lib/db/saves";
import { ENTITY_HREF } from "@/types/domain";

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: EventPageProps) {
  const { slug } = await params;
  const dossier = await getEventDossier(slug).catch(() => null);
  if (!dossier) return { title: "Event" };
  return { title: dossier.event.name };
}

function fmtDate(d: string | null | undefined): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function EventDossierPage({ params }: EventPageProps) {
  const { slug } = await params;
  const dossier = await getEventDossier(slug);
  if (!dossier) notFound();

  const { event } = dossier;
  const entityRef = { kind: "event" as const, id: event.event_id };
  const [ssState, notesCtx] = await Promise.all([
    getSaveFollowState([entityRef]),
    getDossierNotesContext(entityRef),
  ]);
  const k = refKey(entityRef);
  const dateRange =
    event.start_date && event.end_date
      ? `${fmtDate(event.start_date)} → ${fmtDate(event.end_date)}`
      : (fmtDate(event.start_date) ?? null);

  const links = [
    event.website_url ? { label: "Website", href: event.website_url } : null,
    event.agenda_url ? { label: "Agenda", href: event.agenda_url } : null,
    event.youtube_playlist_url
      ? { label: "YouTube playlist", href: event.youtube_playlist_url }
      : null,
  ].filter((l): l is { label: string; href: string } => l !== null);

  return (
    <NotesSplitShell
      entityRef={{ ...entityRef, title: event.name }}
      className="mx-auto max-w-7xl"
    >
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <DossierHero
        kind="event"
        entityId={event.event_id}
        href={ENTITY_HREF.event(event.slug)}
        initialSaved={ssState.saved.has(k)}
        initialFollowing={ssState.following.has(k)}
        notesCount={notesCtx.count}
        supportsSplit
        title={event.name}
        subtitle={event.tagline}
        description={event.description}
        tags={event.topic_tags}
        meta={[
          event.series,
          dateRange,
          event.city && event.country
            ? `${event.city}, ${event.country}`
            : event.country,
          event.venue,
          event.attendee_count
            ? `${event.attendee_count.toLocaleString()} attendees`
            : null,
          event.session_count ? `${event.session_count} sessions` : null,
        ]}
        links={links}
        backHref="/explore/session"
        backLabel="Back to Talks"
      />

      <Section title="Logistics">
        <RelationshipSection
          rows={[
            {
              label: "Sponsors",
              items: dossier.sponsors,
              emptyHint: "No sponsors recorded.",
            },
            {
              label: "Attendees",
              items: dossier.attendees,
              emptyHint: "No attendees recorded.",
            },
          ]}
        />
      </Section>

      <Section title="Schedule">
        <CorpusSection
          groups={[
            {
              label: "Sessions",
              items: dossier.sessions,
              emptyHint: "No sessions scheduled yet.",
            },
          ]}
        />
      </Section>

      <Section title="Notes">
        <EntityNotesFooter
          entity={{ kind: "event", id: event.event_id, title: event.name }}
          notes={notesCtx.notes}
        />
      </Section>
    </div>
    </NotesSplitShell>
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
