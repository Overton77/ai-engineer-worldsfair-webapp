import { LockKeyhole } from "lucide-react";

import { ChallengePreviewCard } from "@/components/challenges/challenge-preview-card";
import type { ChallengePreviewCardViewModel } from "@/components/learn/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChallengeRow } from "@/lib/db/learn";

import { formatDomain, formatMinutes } from "./module-reader-utils";

type ModuleReaderRailProps = {
  challenges: ChallengeRow[];
};

export function ModuleReaderRail({ challenges }: ModuleReaderRailProps) {
  return (
    <aside className="space-y-4">
      <RelatedChallenges challenges={challenges} />
      <AssistantLockedCard />
    </aside>
  );
}

function RelatedChallenges({ challenges }: { challenges: ChallengeRow[] }) {
  const previews = challenges.map(challengeToPreview);

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Related challenge</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {previews.length > 0 ? (
          previews.map((challenge) => (
            <div key={challenge.action.href} id={challenge.action.href.slice(1)}>
              <ChallengePreviewCard challenge={challenge} />
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">
            No published challenge previews are attached to this module yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AssistantLockedCard() {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LockKeyhole className="size-4" />
          Assistant coming later
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Assistant context coming later. It will understand this module, course
          progress, sources, quiz state, and related challenges.
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled variant="outline">
          Locked
        </Button>
      </CardFooter>
    </Card>
  );
}

function challengeToPreview(challenge: ChallengeRow): ChallengePreviewCardViewModel {
  return {
    eyebrow: "Read-only preview",
    title: challenge.title,
    summary: markdownSummary(challenge.task_md),
    estimatedTimeLabel: formatMinutes(challenge.est_minutes),
    runtimeLabel: formatDomain(challenge.runtime) ?? challenge.runtime,
    statusLabel: "Preview only",
    action: {
      label: "Preview only",
      href: `#challenge-${challenge.slug}`,
      ariaLabel: `Preview challenge ${challenge.title}`,
    },
  };
}

function markdownSummary(markdown: string) {
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`-]/g, "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  return stripped ?? "Read the challenge brief before runnable challenges arrive.";
}
