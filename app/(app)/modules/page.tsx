import { ModuleCatalog } from "@/components/modules/module-catalog";
import { requireUser } from "@/lib/auth/require-user";
import { listPublishedModuleCatalog } from "@/lib/db/learn";

export const metadata = { title: "Modules" };

type ModulesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ModulesPage({ searchParams }: ModulesPageProps) {
  const user = await requireUser();
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const modules = await listPublishedModuleCatalog({ userId: user.id });
  const filteredModules = query
    ? modules.filter((item) => matchesModule(item, query))
    : modules;

  return (
    <ModuleCatalog
      modules={filteredModules}
      totalCount={modules.length}
      query={query}
    />
  );
}

type ModuleCatalogItem = Awaited<
  ReturnType<typeof listPublishedModuleCatalog>
>[number];

function matchesModule(item: ModuleCatalogItem, query: string): boolean {
  const needle = query.toLowerCase();
  return [
    item.module.title,
    item.module.search_text,
    item.module.difficulty,
    item.module.body_kind,
    ...item.module.domain_buckets,
  ]
    .filter((value): value is string => typeof value === "string")
    .some((value) => value.toLowerCase().includes(needle));
}
