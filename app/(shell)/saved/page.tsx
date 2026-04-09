import { redirect } from "next/navigation";

import { SavedItemsView } from "@/components/saved/saved-items-view";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function SavedPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/?redirect=/saved");

  const { data: savedItems } = await supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <SavedItemsView initialSavedItems={savedItems ?? []} />;
}
