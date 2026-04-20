import { notFound } from "next/navigation";

import { CorpusSection } from "@/components/dossier/corpus-section";
import { DossierHero } from "@/components/dossier/dossier-hero";
import { EntityNotesFooter } from "@/components/dossier/notes-placeholder";
import { RelationshipSection } from "@/components/dossier/relationship-section";
import { NotesSplitShell } from "@/components/notes/notes-split-shell";
import { Separator } from "@/components/ui/separator";
import { getOrganizationDossier } from "@/lib/db/dossier";
import { getDossierNotesContext } from "@/lib/db/dossier-notes";
import { getSaveFollowState } from "@/lib/db/save-follow-state";
import { refKey } from "@/lib/db/saves";
import { ENTITY_HREF } from "@/types/domain";

type OrgPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: OrgPageProps) {
  const { slug } = await params;
  const dossier = await getOrganizationDossier(slug).catch(() => null);
  if (!dossier) return { title: "Organization" };
  return { title: dossier.organization.name ?? dossier.organization.slug };
}

export default async function OrganizationDossierPage({
  params,
}: OrgPageProps) {
  const { slug } = await params;
  const dossier = await getOrganizationDossier(slug);
  if (!dossier) notFound();

  const { organization: org } = dossier;
  const entityRef = { kind: "organization" as const, id: org.organization_id };
  const [ssState, notesCtx] = await Promise.all([
    getSaveFollowState([entityRef]),
    getDossierNotesContext(entityRef),
  ]);
  const k = refKey(entityRef);
  const entityTitle = org.name ?? org.slug;
  const links = [
    org.homepage_url ? { label: "Website", href: org.homepage_url } : null,
    org.github_org
      ? { label: "GitHub", href: `https://github.com/${org.github_org}` }
      : null,
    org.twitter_handle
      ? {
          label: "X / Twitter",
          href: `https://x.com/${org.twitter_handle.replace(/^@/, "")}`,
        }
      : null,
    org.linkedin_url ? { label: "LinkedIn", href: org.linkedin_url } : null,
    org.docs_url ? { label: "Docs", href: org.docs_url } : null,
  ].filter((l): l is { label: string; href: string } => l !== null);

  return (
    <NotesSplitShell
      entityRef={{ ...entityRef, title: entityTitle }}
      className="mx-auto max-w-7xl"
    >
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <DossierHero
        kind="organization"
        entityId={org.organization_id}
        href={ENTITY_HREF.organization(org.slug)}
        initialSaved={ssState.saved.has(k)}
        initialFollowing={ssState.following.has(k)}
        notesCount={notesCtx.count}
        supportsSplit
        title={org.name ?? org.slug}
        subtitle={org.primary_ai_focus ?? org.organization_type ?? null}
        description={org.overview}
        imageUrl={org.logo_url}
        tags={org.tags}
        meta={[
          org.organization_type,
          org.headquarters_city && org.headquarters_country
            ? `${org.headquarters_city}, ${org.headquarters_country}`
            : org.headquarters_country,
          org.founded_year ? `Founded ${org.founded_year}` : null,
          org.headcount_band ? `${org.headcount_band} employees` : null,
        ]}
        links={links}
        backHref="/explore/organization"
        backLabel="Back to Organizations"
      />

      <Section title="Leadership & team">
        <RelationshipSection
          rows={[
            {
              label: "CEO",
              items: dossier.ceo ? [dossier.ceo] : [],
              emptyHint: "No CEO indexed.",
            },
            {
              label: "Founders",
              items: dossier.founders,
              emptyHint: "No founders indexed.",
            },
            {
              label: "Team",
              items: dossier.employees,
              emptyHint: "No employees indexed.",
            },
          ]}
        />
      </Section>

      <Section title="Products & code">
        <RelationshipSection
          rows={[
            {
              label: "Libraries",
              items: dossier.libraries,
              emptyHint: "No libraries owned.",
            },
            {
              label: "Products",
              items: dossier.products,
              emptyHint: "No products tracked.",
            },
            {
              label: "Repos",
              items: dossier.repos,
              emptyHint: "No repos indexed.",
            },
          ]}
        />
      </Section>

      <Section title="In the corpus">
        <CorpusSection
          groups={[
            {
              label: "Sponsored events",
              items: dossier.sponsoredEvents,
              emptyHint: "No sponsored events tracked.",
            },
          ]}
        />
      </Section>

      <Section title="Notes">
        <EntityNotesFooter
          entity={{
            kind: "organization",
            id: org.organization_id,
            title: entityTitle,
          }}
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
