import type { Metadata } from "next";

import { getOwnProfile } from "@/lib/db/profile";

import { ProfileSettingsForm } from "./profile-settings-form";

export const metadata: Metadata = { title: "Profile settings" };
export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const profile = await getOwnProfile();
  return (
    <ProfileSettingsForm
      userId={profile.id}
      profile={{
        display_name: profile.display_name,
        username: profile.username,
        headline: profile.headline,
        bio: profile.bio,
        country: profile.country,
        location: profile.location,
        timezone: profile.timezone,
        current_role_title: profile.current_role_title,
        is_public: profile.is_public,
        experience_level: profile.experience_level,
        home_layer: profile.home_layer,
        interest_tags: profile.interest_tags ?? [],
        expertise_tags: profile.expertise_tags ?? [],
        goals: profile.goals ?? [],
        avatar_url: profile.avatar_url,
        email: profile.email,
      }}
    />
  );
}
