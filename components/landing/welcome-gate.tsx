"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { signInWithPassword, signUpWithPassword } from "@/app/auth/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function WelcomeGateInner({
  initialError,
  initialMessage,
  redirectPath,
}: {
  initialError?: string | null;
  initialMessage?: string | null;
  redirectPath: string;
}) {
  const searchParams = useSearchParams();

  const error = initialError ?? searchParams.get("error") ?? null;
  const message = initialMessage ?? searchParams.get("message") ?? null;

  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-col items-center justify-center px-4 py-12",
        "bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <Card
        className="relative z-10 w-full max-w-md shadow-lg ring-1 ring-foreground/10"
        size="sm"
      >
        <CardHeader className="border-b border-border/80 text-center sm:text-left">
          <CardTitle className="text-xl sm:text-2xl">
            AI Engineer
          </CardTitle>
          <CardDescription className="text-pretty">
            Sign in to take notes and save items, or continue as a
            guest to explore the directory.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {error ? (
            <p
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {message ? (
            <p
              className="rounded-lg border border-border bg-muted/60 px-3 py-2 text-sm text-foreground"
              role="status"
            >
              {message}
            </p>
          ) : null}

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-4 space-y-3">
              <form action={signInWithPassword} className="space-y-3">
                <input type="hidden" name="redirect" value={redirectPath} />
                <div className="space-y-1.5">
                  <label htmlFor="w-email-in" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="w-email-in"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="w-pass-in" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="w-pass-in"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Sign in with password
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="mt-4 space-y-3">
              <form action={signUpWithPassword} className="space-y-3">
                <input type="hidden" name="redirect" value={redirectPath} />
                <div className="space-y-1.5">
                  <label htmlFor="w-email-up" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="w-email-up"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="w-pass-up" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="w-pass-up"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" variant="secondary" className="w-full">
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <Separator />

          <Link
            href="/directory"
            className={cn(
              buttonVariants({
                variant: "ghost",
                className:
                  "h-auto w-full py-3 text-base font-medium no-underline hover:no-underline",
              }),
            )}
          >
            Continue without signing in
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            You can explore sessions and speakers. Sign in anytime for
            notes and saved items.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function WelcomeGate({
  initialError,
  initialMessage,
  redirectPath,
}: {
  initialError?: string | null;
  initialMessage?: string | null;
  redirectPath: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center px-4">
          <div className="h-80 w-full max-w-md animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <WelcomeGateInner
        initialError={initialError}
        initialMessage={initialMessage}
        redirectPath={redirectPath}
      />
    </Suspense>
  );
}
