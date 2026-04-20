import type { Metadata } from "next";
import { LogOut, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/require-user";
import { getOwnProfile } from "@/lib/db/profile";
import Link from "next/link";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const user = await requireUser();
  const profile = await getOwnProfile();

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Email</CardTitle>
          <CardDescription>
            Magic-link sign-in uses this email. Changing it requires
            re-verification — coming with the linked-accounts unit.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Mail className="text-muted-foreground size-4" />
          <span className="text-sm">{profile.email ?? user.email}</span>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Sessions</CardTitle>
          <CardDescription>
            You can sign out of this device. Per-device session
            management ships post-launch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href="/logout" prefetch={false}>
              <LogOut className="size-4" /> Sign out
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
