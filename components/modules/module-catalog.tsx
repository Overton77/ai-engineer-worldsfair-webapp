import { Boxes } from "lucide-react";

import { moduleToCardViewModel } from "@/components/learn/view-models";
import { ModuleCard } from "@/components/modules/module-card";
import { EmptyState } from "@/components/shell/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ModuleCatalogItem } from "@/lib/db/learn";

type ModuleCatalogProps = {
  modules: ModuleCatalogItem[];
  totalCount: number;
  query: string;
};

export function ModuleCatalog({ modules, totalCount, query }: ModuleCatalogProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Modules</h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Focused lessons you can complete standalone. These do not
            automatically count as full-course credit.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          Standalone progress stays separate from course progress
        </Badge>
      </header>

      <form className="border-border/60 bg-card/60 rounded-xl border p-3">
        <label className="text-muted-foreground mb-2 block text-xs font-medium">
          Search modules
        </label>
        <div className="flex gap-2">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search modules..."
            type="search"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </div>
      </form>

      <p className="text-muted-foreground text-sm">
        {modules.length.toLocaleString()} of {totalCount.toLocaleString()}{" "}
        standalone modules
      </p>

      {modules.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {modules.map((item) => (
            <ModuleCard
              key={item.module.module_id}
              module={moduleToCardViewModel(item)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Boxes}
          title={query ? "No matching modules" : "No published modules yet"}
          description={
            query
              ? "Try a different title, bucket, difficulty, or objective search."
              : "Published standalone lessons will appear here."
          }
        />
      )}
    </div>
  );
}
