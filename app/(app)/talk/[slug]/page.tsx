import { notFound } from "next/navigation";

import { CorpusSection } from "@/components/dossier/corpus-section";
import { DossierHero } from "@/components/dossier/dossier-hero";
import { NotesPlaceholder } from "@/components/dossier/notes-placeholder";
import { RelationshipSection } from "@/components/dossier/relationship-section";
import { Separator } from "@/components/ui/separator";
import { getSessionDossier } from "@/lib/db/dossier";
import { getSaveFollowState } from "@/lib/db/save-follow-state";
import { refKey } from "@/lib/db/saves";
import { ENTITY_HREF } from "@/types/domain";

type TalkPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: TalkPageProps) {
  const { slug } = await params;
  const dossier = await getSessionDossier(slug).catch(() => null);
  if (!dossier) return { title: "Talk" };
  return { title: dossier.session.title ?? dossier.session.slug };
}

export default async function TalkDossierPage({ params }: TalkPageProps) {
  const { slug } = await params;
  const dossier = await getSessionDossier(slug);
  if (!dossier) notFound();

  const { session } = dossier;
  const entityRef = { kind: "session" as const, id: session.session_id };
  const ssState = await getSaveFollowState([entityRef]);
  const k = refKey(entityRef);
  const links = [
    session.slides_url ? { label: "Slides", href: session.slides_url } : null,
    session.code_repo_url
      ? { label: "Code", href: session.code_repo_url }
      : null,
  ].filter((l): l is { label: string; href: string } => l !== null);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <DossierHero
        kind="session"
        entityId={session.session_id}
        href={ENTITY_HREF.session(session.slug)}
        initialSaved={ssState.saved.has(k)}
        initialFollowing={ssState.following.has(k)}
        title={session.title ?? session.slug}
        subtitle={session.track ?? session.session_format ?? null}
        description={session.description ?? session.extended_description}
        tags={session.tags}
        meta={[
          session.scheduled_at
            ? new Date(session.scheduled_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : null,
          session.duration_minutes ? `${session.duration_minutes} min` : null,
          session.level,
          session.room,
          session.language,
        ]}
        links={links}
        backHref="/explore/session"
        backLabel="Back to Talks"
      />

      <Section title="Where & who">
        <RelationshipSection
          rows={[
            {
              label: "Event",
              items: dossier.event ? [dossier.event] : [],
              emptyHint: "No linked event.",
            },
            {
              label: "Speakers",
              items: dossier.speakers,
              emptyHint: "No speakers linked.",
            },
            {
              label: "Linked video",
              items: dossier.video ? [dossier.video] : [],
              emptyHint: "No recording linked.",
            },
            {
              label: "Libraries discussed",
              items: dossier.libraries,
              emptyHint: "No libraries cited.",
            },
          ]}
        />
      </Section>

      {dossier.video ? (
        <Section title="Watch the recording">
          <CorpusSection
            groups={[
              {
                label: "Recording",
                items: [dossier.video],
                variant: "media",
              },
            ]}
          />
        </Section>
      ) : null}

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
