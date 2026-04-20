"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LayerCard } from "@/components/wizard/layer-card";
import {
  DOMAIN_LAYERS,
  DOMAIN_LAYER_META,
  type DomainLayer,
} from "@/lib/schema/taxonomy";

import { saveStepAction } from "../../actions";
import { hrefForStep } from "../../steps";

export function LayerStep({
  initialLayer,
}: {
  initialLayer: string | null;
}) {
  const [layer, setLayer] = useState<DomainLayer | null>(() =>
    (DOMAIN_LAYERS as readonly string[]).includes(initialLayer ?? "")
      ? (initialLayer as DomainLayer)
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit() {
    if (!layer) {
      setError("Pick a layer to land your home on.");
      return;
    }
    start(async () => {
      setError(null);
      const result = await saveStepAction("layer", { home_layer: layer });
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Where do you want to land?</CardTitle>
        <CardDescription>
          The five-layer stack is how we organise the curriculum. Pick
          your home altitude — you can drift up or down anytime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DOMAIN_LAYERS.map((value) => {
            const meta = DOMAIN_LAYER_META[value];
            return (
              <LayerCard
                key={value}
                code={meta.code}
                label={meta.label}
                tagline={meta.tagline}
                selected={layer === value}
                onSelect={() => setLayer(value)}
              />
            );
          })}
        </div>
        {error ? (
          <p className="text-destructive mt-3 text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
      <CardContent className="flex items-center justify-between border-t pt-5">
        <Button asChild variant="ghost" size="sm">
          <Link href={hrefForStep("goals")}>
            <ArrowLeft className="size-4" /> Back
          </Link>
        </Button>
        <Button type="button" onClick={onSubmit} disabled={pending || !layer}>
          {pending ? "Saving…" : "Finish"}
          {!pending ? <ArrowRight className="size-4" /> : null}
        </Button>
      </CardContent>
    </Card>
  );
}
