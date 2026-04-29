import { notFound } from "next/navigation";

import { ModuleContent } from "@/components/modules/module-content";
import { ModuleOutline } from "@/components/modules/module-outline";
import { ModuleReaderRail } from "@/components/modules/module-reader-rail";
import { ModuleReaderShell } from "@/components/modules/module-reader-shell";
import { requireUser } from "@/lib/auth/require-user";
import {
  getModuleBySlug,
  getStandaloneModuleCompletion,
  listChallengesForModule,
  listCourseModulePrerequisites,
} from "@/lib/db/learn";

import { extractMarkdownHeadings } from "@/components/modules/module-reader-utils";

export const metadata = { title: "Module" };

type StandaloneModulePageProps = {
  params: Promise<{ moduleSlug: string }>;
};

export default async function StandaloneModulePage({
  params,
}: StandaloneModulePageProps) {
  const [{ moduleSlug }, user] = await Promise.all([params, requireUser()]);
  const courseModule = await getModuleBySlug(moduleSlug);
  if (!courseModule) notFound();

  const [completion, challenges, prerequisites] = await Promise.all([
    getStandaloneModuleCompletion(user.id, courseModule.module_id),
    listChallengesForModule(courseModule.module_id),
    listCourseModulePrerequisites([courseModule.module_id]),
  ]);

  return (
    <ModuleReaderShell
      outline={
        <ModuleOutline
          mode="standalone"
          headings={extractMarkdownHeadings(courseModule.body_md)}
          prerequisites={prerequisites}
          completion={completion}
        />
      }
      content={
        <ModuleContent
          module={courseModule}
          contextLabel="Standalone module"
          completion={completion}
        />
      }
      rail={<ModuleReaderRail challenges={challenges} />}
    />
  );
}
