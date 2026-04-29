import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ModuleCompletionActions } from "@/components/modules/module-completion-actions";
import { ModuleQuiz } from "@/components/modules/module-quiz";
import { ModuleProse } from "@/components/modules/module-prose";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  CourseModuleCompletionRow,
  CourseModuleRow,
  ModuleCompletionRow,
} from "@/lib/db/learn";
import type {
  CourseModuleCompletionActionInput,
  ModuleCompletionActionInput,
  ModuleCompletionActionResult,
} from "@/lib/learn/module-completion-actions";
import {
  formatQuizPercent,
  getPassThreshold,
  miniQuizViewModel,
} from "@/lib/learn/module-quiz";

import {
  compactLabel,
  formatDomain,
  formatMinutes,
  headingId,
  jsonStrings,
  moduleXp,
} from "./module-reader-utils";

type ModuleContentProps = {
  module: CourseModuleRow;
  contextLabel: string;
  completion?: ModuleCompletionRow | CourseModuleCompletionRow | null;
  actionInput: ModuleCompletionActionInput | CourseModuleCompletionActionInput;
  quizAction: (
    input: ModuleCompletionActionInput | CourseModuleCompletionActionInput,
  ) => Promise<ModuleCompletionActionResult>;
  markCompleteAction: (
    input: ModuleCompletionActionInput | CourseModuleCompletionActionInput,
  ) => Promise<ModuleCompletionActionResult>;
};

export function ModuleContent({
  module,
  contextLabel,
  completion = null,
  actionInput,
  quizAction,
  markCompleteAction,
}: ModuleContentProps) {
  const objectives = jsonStrings(module.learning_objectives);
  const quizQuestions = miniQuizViewModel(module.mini_quiz);
  const quizThreshold = getPassThreshold({
    miniQuiz: module.mini_quiz,
    metadata: module.metadata,
  });
  const quizScoreLabel = completion?.quiz_score != null
    ? `Score ${formatQuizPercent(completion.quiz_score)}`
    : null;
  const metadataLabel = compactLabel([
    formatDomain(module.difficulty),
    formatMinutes(module.duration_min),
    quizQuestions.length > 0 ? "Quiz" : undefined,
    `+${moduleXp(module.metadata)} XP`,
  ]);

  return (
    <main className="min-w-0 space-y-8">
      <header className="space-y-5">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">
            {contextLabel}
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
            {module.title}
          </h1>
          {metadataLabel ? (
            <p className="text-muted-foreground text-sm">{metadataLabel}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Published v{module.version}</Badge>
          <Badge variant="outline">{formatDomain(module.body_kind) ?? module.body_kind}</Badge>
          {completion ? <Badge variant="secondary">Completed</Badge> : null}
          {quizScoreLabel ? <Badge variant="outline">{quizScoreLabel}</Badge> : null}
        </div>

        {objectives.length > 0 ? (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Objectives</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                {objectives.map((objective) => (
                  <li key={objective} className="flex gap-2">
                    <span className="bg-primary mt-2 size-1.5 rounded-full" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </header>

      <ModuleProse>
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            a({ href, children, node, ...props }) {
              void node;
              if (!href) return <a {...props}>{children}</a>;
              if (href.startsWith("/")) {
                return (
                  <Link href={href} {...props}>
                    {children}
                  </Link>
                );
              }
              return (
                <a
                  href={href}
                  rel="noreferrer noopener"
                  target="_blank"
                  {...props}
                >
                  {children}
                </a>
              );
            },
            h2({ children, node, ...props }) {
              void node;
              return (
                <h2 id={headingId(children)} {...props}>
                  {children}
                </h2>
              );
            },
            h3({ children, node, ...props }) {
              void node;
              return (
                <h3 id={headingId(children)} {...props}>
                  {children}
                </h3>
              );
            },
            img({ alt }) {
              return (
                <Card className="border-border/60 my-6">
                  <CardContent className="text-muted-foreground py-6 text-sm">
                    Image asset placeholder{alt ? `: ${alt}` : ""}. Full asset
                    previews arrive in a later unit.
                  </CardContent>
                </Card>
              );
            },
          }}
        >
          {module.body_md}
        </Markdown>
      </ModuleProse>

      {quizQuestions.length > 0 ? (
        <ModuleQuiz
          questions={quizQuestions}
          threshold={quizThreshold}
          actionInput={actionInput}
          action={quizAction}
          completed={Boolean(completion)}
          score={completion?.quiz_score}
          attempts={completion?.attempts}
        />
      ) : (
        <ModuleCompletionActions
          actionInput={actionInput}
          action={markCompleteAction}
          completed={Boolean(completion)}
        />
      )}
    </main>
  );
}
