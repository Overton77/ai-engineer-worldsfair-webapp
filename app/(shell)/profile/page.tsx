import { redirect } from "next/navigation";

import { ProfileView } from "@/components/profile/profile-view";
import { ensureProfile } from "@/lib/profile";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/?redirect=/profile");

  const profile = await ensureProfile(supabase, user);

  return (
    <ProfileView
      initialProfile={profile}
      user={{
        email: user.email ?? null,
        id: user.id,
        lastSignInAt: user.last_sign_in_at ?? null,
      }}
    />
  );
}
