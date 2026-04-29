import { LearnDashboard } from "@/components/learn/learn-dashboard";
import { requireUser } from "@/lib/auth/require-user";
import { listLearnerHub } from "@/lib/db/learn";
import { getShellProfile } from "@/lib/db/profile";
import { getCurrentUserStats } from "@/lib/db/stats";

export const metadata = { title: "Learn" };

export default async function LearnPage() {
  const user = await requireUser();
  const [shell, stats, hub] = await Promise.all([
    getShellProfile(user.id),
    getCurrentUserStats(user.id),
    listLearnerHub(user.id),
  ]);
  const greeting = shell.displayName ?? shell.email.split("@")[0] ?? "there";

  return <LearnDashboard greeting={greeting} stats={stats} hub={hub} />;
}
