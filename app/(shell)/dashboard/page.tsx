import { createServerSupabase } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Your dashboard</CardTitle>
            <CardDescription>
              Signed in as{" "}
              <span className="font-medium text-foreground">
                {user?.email ?? "—"}
              </span>
              . We’ll expand this area with saved items and preferences next.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              User id:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                {user?.id ?? "—"}
              </code>
            </p>
            <p>
              Last sign-in:{" "}
              {user?.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString()
                : "—"}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
