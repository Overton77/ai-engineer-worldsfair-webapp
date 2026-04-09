import { redirect } from "next/navigation";

import { createServerSupabase } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/notes" : "/directory");
}
