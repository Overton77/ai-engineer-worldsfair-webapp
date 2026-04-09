import { DirectoryExplorer } from "@/components/directory-explorer";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function DirectoryPage() {
  let viewer: { id: string; email?: string | null } | null = null;

  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      viewer = { id: user.id, email: user.email ?? null };
    }
  } catch {
    viewer = null;
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <DirectoryExplorer viewer={viewer} />
    </main>
  );
}
