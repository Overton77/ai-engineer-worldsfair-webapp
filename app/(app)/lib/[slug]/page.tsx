import { notFound } from "next/navigation";

import { CorpusSection } from "@/components/dossier/corpus-section";
import { DossierHero } from "@/components/dossier/dossier-hero";
import { NotesPlaceholder } from "@/components/dossier/notes-placeholder";
import { RelationshipSection } from "@/components/dossier/relationship-section";
import { Separator } from "@/components/ui/separator";
import { getLibraryDossier } from "@/lib/db/dossier";
import { getSaveFollowState } from "@/lib/db/save-follow-state";
import { refKey } from "@/lib/db/saves";
import { ENTITY_HREF } from "@/types/domain";

type LibraryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: LibraryPageProps) {
  const { slug } = await params;
  const dossier = await getLibraryDossier(slug).catch(() => null);
  if (!dossier) return { title: "Library" };
  return { title: dossier.library.name };
}

function fmtNumber(n: number | null | undefined): string | null {
  if (n === null || n === undefined) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export default async function LibraryDossierPage({ params }: LibraryPageProps) {
  const { slug } = await params;
  const dossier = await getLibraryDossier(slug);
  if (!dossier) notFound();

  const { library: lib } = dossier;
  const entityRef = { kind: "library" as const, id: lib.slug };
  const ssState = await getSaveFollowState([entityRef]);
  const k = refKey(entityRef);
  const links = [
    lib.homepage_url ? { label: "Homepage", href: lib.homepage_url } : null,
    lib.docs_url ? { label: "Docs", href: lib.docs_url } : null,
    lib.github_url ? { label: "GitHub", href: lib.github_url } : null,
    lib.npm_name
      ? { label: "npm", href: `https://www.npmjs.com/package/${lib.npm_name}` }
      : null,
    lib.pypi_name
      ? { label: "PyPI", href: `https://pypi.org/project/${lib.pypi_name}/` }
      : null,
    lib.huggingface_id
      ? {
          label: "Hugging Face",
          href: `https://huggingface.co/${lib.huggingface_id}`,
        }
      : null,
  ].filter((l): l is { label: string; href: string } => l !== null);

  const stars = fmtNumber(lib.github_stars);
  const forks = fmtNumber(lib.github_forks);
  const downloads = fmtNumber(
    lib.pypi_monthly_downloads ?? lib.npm_weekly_downloads ?? null,
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <DossierHero
        kind="library"
        entityId={lib.slug}
        href={ENTITY_HREF.library(lib.slug)}
        initialSaved={ssState.saved.has(k)}
        initialFollowing={ssState.following.has(k)}
        title={lib.name}
        subtitle={lib.tagline}
        description={lib.description}
        tags={lib.tags}
        meta={[
          lib.kind,
          lib.language,
          lib.license,
          stars ? `★ ${stars}` : null,
          forks ? `${forks} forks` : null,
          downloads
            ? `${downloads}/${lib.pypi_monthly_downloads ? "mo" : "wk"} downloads`
            : null,
          lib.latest_version ? `v${lib.latest_version}` : null,
        ]}
        links={links}
        backHref="/explore/library"
        backLabel="Back to Libraries"
      />

      <Section title="Relationships">
        <RelationshipSection
          rows={[
            {
              label: "Owned by",
              items: dossier.organization ? [dossier.organization] : [],
              emptyHint: "No owner organization indexed.",
            },
            {
              label: "Repos",
              items: dossier.repos,
              emptyHint: "No source repos indexed.",
            },
            {
              label: "Uses",
              items: dossier.usesLibraries,
              emptyHint: "No upstream libraries tracked.",
            },
            {
              label: "Used by",
              items: dossier.usedByLibraries,
              emptyHint: "No downstream libraries tracked.",
            },
          ]}
        />
      </Section>

      <Section title="In the corpus">
        <CorpusSection
          groups={[
            {
              label: "Talks",
              items: dossier.appearedInTalks,
              variant: "media",
              emptyHint: "No videos featuring this library.",
            },
            {
              label: "Sessions",
              items: dossier.appearedInSessions,
              emptyHint: "No conference sessions featuring this library.",
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
