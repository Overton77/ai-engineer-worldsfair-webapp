import { redirect } from "next/navigation";

import { NotesView } from "@/components/notes/notes-view";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function NotesPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/?redirect=/notes");

  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return <NotesView initialNotes={notes ?? []} />;
}
