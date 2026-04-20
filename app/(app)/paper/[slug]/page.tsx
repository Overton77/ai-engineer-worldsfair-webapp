import { notFound } from "next/navigation";

import { CorpusSection } from "@/components/dossier/corpus-section";
import { DossierHero } from "@/components/dossier/dossier-hero";
import { EntityNotesFooter } from "@/components/dossier/notes-placeholder";
import { RelationshipSection } from "@/components/dossier/relationship-section";
import { NotesSplitShell } from "@/components/notes/notes-split-shell";
import { Separator } from "@/components/ui/separator";
import { getPaperDossier } from "@/lib/db/dossier";
import { getDossierNotesContext } from "@/lib/db/dossier-notes";
import { getSaveFollowState } from "@/lib/db/save-follow-state";
import { refKey } from "@/lib/db/saves";
import { ENTITY_HREF } from "@/types/domain";

type PaperPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PaperPageProps) {
  const { slug } = await params;
  const dossier = await getPaperDossier(slug).catch(() => null);
  if (!dossier) return { title: "Paper" };
  return { title: dossier.paper.title };
}

export default async function PaperDossierPage({ params }: PaperPageProps) {
  const { slug } = await params;
  const dossier = await getPaperDossier(slug);
  if (!dossier) notFound();

  const { paper } = dossier;
  const entityRef = { kind: "paper" as const, id: paper.slug };
  const [ssState, notesCtx] = await Promise.all([
    getSaveFollowState([entityRef]),
    getDossierNotesContext(entityRef),
  ]);
  const k = refKey(entityRef);
  const links = [
    paper.url ? { label: "Web", href: paper.url } : null,
    paper.pdf_url ? { label: "PDF", href: paper.pdf_url } : null,
    paper.arxiv_id
      ? { label: "arXiv", href: `https://arxiv.org/abs/${paper.arxiv_id}` }
      : null,
    paper.doi ? { label: "DOI", href: `https://doi.org/${paper.doi}` } : null,
  ].filter((l): l is { label: string; href: string } => l !== null);

  return (
    <NotesSplitShell
      entityRef={{ ...entityRef, title: paper.title }}
      className="mx-auto max-w-7xl"
    >
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <DossierHero
        kind="paper"
        entityId={paper.slug}
        href={ENTITY_HREF.paper(paper.slug)}
        initialSaved={ssState.saved.has(k)}
        initialFollowing={ssState.following.has(k)}
        notesCount={notesCtx.count}
        supportsSplit
        title={paper.title}
        subtitle={paper.venue}
        description={paper.abstract}
        tags={paper.tags}
        meta={[
          paper.published_on
            ? new Date(paper.published_on).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
              })
            : null,
          paper.arxiv_id ? `arXiv:${paper.arxiv_id}` : null,
          typeof paper.citation_count === "number"
            ? `${paper.citation_count} citations`
            : null,
        ]}
        links={links}
        backHref="/explore/paper"
        backLabel="Back to Papers"
      />

      <Section title="Authors">
        <RelationshipSection
          rows={[
            {
              label: "Authors",
              items: dossier.authors,
              emptyHint: "No authors linked.",
            },
          ]}
        />
      </Section>

      <Section title="In the corpus">
        <CorpusSection
          groups={[
            {
              label: "Cited / discussed in",
              items: dossier.appearedInTalks,
              variant: "media",
              emptyHint: "No talks reference this paper yet.",
            },
          ]}
        />
      </Section>

      <Section title="Notes">
        <EntityNotesFooter
          entity={{ kind: "paper", id: paper.slug, title: paper.title }}
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
