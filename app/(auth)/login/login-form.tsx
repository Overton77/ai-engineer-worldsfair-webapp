"use client";

import { useActionState } from "react";
import { ArrowRight, MailCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  requestMagicLinkAction,
  type LoginActionState,
} from "./actions";

const INITIAL: LoginActionState = { status: "idle" };

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(
    requestMagicLinkAction,
    INITIAL,
  );

  if (state.status === "ok") {
    return (
      <Card className="border-border/70 w-full max-w-md">
        <CardHeader>
          <div className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-full">
            <MailCheck className="size-5" />
          </div>
          <CardTitle className="mt-3">Check your inbox</CardTitle>
          <CardDescription>
            We sent a sign-in link to{" "}
            <span className="text-foreground font-medium">{state.email}</span>.
            Open it on this device to finish signing in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs">
            The link expires in an hour. If you do not see it, check your
            spam folder or try again with a different address.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 w-full max-w-md">
      <CardHeader>
        <div className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-full">
          <Sparkles className="size-5" />
        </div>
        <CardTitle className="mt-3">Welcome back</CardTitle>
        <CardDescription>
          Sign in with a magic link. No password to remember.
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-foreground text-sm font-medium"
            >
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              disabled={pending}
            />
          </div>
          {state.status === "error" ? (
            <p className="text-destructive text-sm" role="alert">
              {state.message}
            </p>
          ) : null}
          <p className="text-muted-foreground text-xs">
            By continuing you agree to receive a one-time sign-in email.
            We will never email you marketing.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={pending}
          >
            {pending ? "Sending…" : "Send magic link"}
            {!pending ? <ArrowRight className="size-4" /> : null}
          </Button>
          {/*
           * GitHub OAuth button intentionally omitted — it lights up
           * once GITHUB_OAUTH_CLIENT_ID / SECRET are set in Supabase.
           * See https://supabase.com/docs/guides/auth/social-login/auth-github
           */}
        </CardFooter>
      </form>
    </Card>
  );
}
