"use client";

import { useState } from "react";
import { Loader2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Tables } from "@/types/database.types";

type ProfileViewProps = {
  initialProfile: Tables<"profiles">;
  user: {
    email: string | null;
    id: string;
    lastSignInAt: string | null;
  };
};

export function ProfileView({ initialProfile, user }: ProfileViewProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  async function saveProfile(formData: FormData) {
    setProfileBusy(true);
    setProfileMessage(null);

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: String(formData.get("display_name") ?? "").trim() || null,
        bio: String(formData.get("bio") ?? "").trim() || null,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { data?: Tables<"profiles">; error?: string }
      | null;

    if (!response.ok || !payload?.data) {
      setProfileMessage(payload?.error ?? "Failed to update profile.");
      setProfileBusy(false);
      return;
    }

    setProfile(payload.data);
    setProfileMessage("Profile updated.");
    setProfileBusy(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <UserRound className="size-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">{user.email ?? "No email"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">User ID</p>
            <p className="mt-1 truncate font-mono text-xs text-foreground">{user.id}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Display name</p>
            <p className="mt-1 truncate text-sm font-medium text-foreground">
              {profile.display_name || "Not set"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Last sign-in</p>
            <p className="mt-1 text-sm text-foreground">
              {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : "Unknown"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
          <CardDescription>
            Update your display name and bio for your private workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            key={profile.updated_at}
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void saveProfile(new FormData(event.currentTarget));
            }}
          >
            <div className="grid gap-2">
              <label htmlFor="display_name" className="text-sm font-medium text-foreground">
                Display name
              </label>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={profile.display_name ?? ""}
                placeholder="How should your profile appear?"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="bio" className="text-sm font-medium text-foreground">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                defaultValue={profile.bio ?? ""}
                rows={5}
                className="min-h-32 rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                placeholder="Add a short bio for your own workspace context."
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={profileBusy}>
                {profileBusy ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Save profile
              </Button>
              {profileMessage ? (
                <span className="text-sm text-muted-foreground">{profileMessage}</span>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
