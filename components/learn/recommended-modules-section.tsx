import Link from "next/link";

import { ModuleCard } from "@/components/modules/module-card";
import { Button } from "@/components/ui/button";
import type { ModuleCatalogItem } from "@/lib/db/learn";

import { moduleToCardViewModel } from "./view-models";

type RecommendedModulesSectionProps = {
  modules: ModuleCatalogItem[];
};

export function RecommendedModulesSection({
  modules,
}: RecommendedModulesSectionProps) {
  if (modules.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Standalone modules for you</h2>
          <p className="text-muted-foreground text-sm">
            Focused lessons you can complete globally without course credit.
          </p>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/modules">See all</Link>
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((item) => (
          <ModuleCard
            key={item.module.module_id}
            module={moduleToCardViewModel(item)}
          />
        ))}
      </div>
    </section>
  );
}
