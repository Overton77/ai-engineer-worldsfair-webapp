import { notFound } from "next/navigation";

import { CorpusSection } from "@/components/dossier/corpus-section";
import { DossierHero } from "@/components/dossier/dossier-hero";
import { NotesPlaceholder } from "@/components/dossier/notes-placeholder";
import { RelationshipSection } from "@/components/dossier/relationship-section";
import { Separator } from "@/components/ui/separator";
import { getPersonDossier } from "@/lib/db/dossier";
import { getSaveFollowState } from "@/lib/db/save-follow-state";
import { refKey } from "@/lib/db/saves";
import { ENTITY_HREF } from "@/types/domain";

type PersonPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PersonPageProps) {
  const { slug } = await params;
  const dossier = await getPersonDossier(slug).catch(() => null);
  if (!dossier) return { title: "Person" };
  return { title: dossier.person.full_name ?? dossier.person.slug };
}

export default async function PersonDossierPage({ params }: PersonPageProps) {
  const { slug } = await params;
  const dossier = await getPersonDossier(slug);
  if (!dossier) notFound();

  const { person } = dossier;
  const entityRef = { kind: "person" as const, id: person.person_id };
  const ssState = await getSaveFollowState([entityRef]);
  const k = refKey(entityRef);
  const links = [
    person.github_username
      ? {
          label: "GitHub",
          href: `https://github.com/${person.github_username}`,
        }
      : null,
    person.twitter_handle
      ? {
          label: "X / Twitter",
          href: `https://x.com/${person.twitter_handle.replace(/^@/, "")}`,
        }
      : null,
    person.linkedin_url
      ? { label: "LinkedIn", href: person.linkedin_url }
      : null,
    person.personal_website
      ? { label: "Website", href: person.personal_website }
      : null,
  ].filter((l): l is { label: string; href: string } => l !== null);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <DossierHero
        kind="person"
        entityId={person.person_id}
        href={ENTITY_HREF.person(person.slug)}
        initialSaved={ssState.saved.has(k)}
        initialFollowing={ssState.following.has(k)}
        title={person.full_name ?? person.slug}
        subtitle={person.tag_line ?? person.role_title ?? null}
        description={person.bio ?? person.notable_for ?? null}
        imageUrl={
          person.sessionize_profile_picture_url || person.ai_engineer_url
        }
        tags={person.expertise_tags}
        meta={[
          person.role_title,
          person.city && person.country
            ? `${person.city}, ${person.country}`
            : person.country,
          person.is_speaker ? "Speaker" : null,
          person.is_founder ? "Founder" : null,
        ]}
        links={links}
        backHref="/explore/person"
        backLabel="Back to People"
      />

      <Section title="Relationships">
        <RelationshipSection
          rows={[
            {
              label: "Works at",
              items: dossier.employedAt,
              emptyHint: "No current employer indexed.",
            },
            {
              label: "Founded",
              items: dossier.founded,
              emptyHint: "No companies founded.",
            },
            {
              label: "Spoke at",
              items: dossier.presentedSessions,
              emptyHint: "No sessions presented.",
            },
            {
              label: "Attended",
              items: dossier.attendedEvents,
              emptyHint: "No events attended.",
            },
          ]}
        />
      </Section>

      <Section title="In the corpus">
        <CorpusSection
          groups={[
            {
              label: "Talks",
              items: dossier.talks,
              variant: "media",
              emptyHint: "No videos featuring this person.",
            },
            {
              label: "Papers authored",
              items: dossier.authoredPapers,
              emptyHint: "No papers indexed.",
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
