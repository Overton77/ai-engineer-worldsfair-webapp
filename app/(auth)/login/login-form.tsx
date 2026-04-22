"use client";

import { useActionState, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  MailCheck,
  Sparkles,
} from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  requestMagicLinkAction,
  signInWithPasswordAction,
  signUpWithPasswordAction,
  type LoginActionState,
} from "./actions";

const INITIAL: LoginActionState = { status: "idle" };

type Mode = "password" | "magic";

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>("password");

  if (mode === "magic") {
    return <MagicLinkForm next={next} onBack={() => setMode("password")} />;
  }

  return <PasswordForm next={next} onUseMagicLink={() => setMode("magic")} />;
}

function PasswordForm({
  next,
  onUseMagicLink,
}: {
  next: string;
  onUseMagicLink: () => void;
}) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction, signInPending] = useActionState(
    signInWithPasswordAction,
    INITIAL,
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUpWithPasswordAction,
    INITIAL,
  );

  if (signUpState.status === "check_email") {
    return (
      <CheckEmailCard
        email={signUpState.email}
        title="Confirm your email"
        description="We sent a confirmation link to verify your address. Open it to finish creating your account."
      />
    );
  }

  return (
    <Card className="border-border/70 w-full max-w-md">
      <CardHeader>
        <div className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-full">
          <Sparkles className="size-5" />
        </div>
        <CardTitle className="mt-3">
          {tab === "signin" ? "Welcome back" : "Create your account"}
        </CardTitle>
        <CardDescription>
          {tab === "signin"
            ? "Sign in with your email and password."
            : "Use an email and a password of at least 8 characters."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as "signin" | "signup")}
        >
          <TabsList className="w-full">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-5">
            <PasswordCredentialsForm
              key="signin"
              action={signInAction}
              pending={signInPending}
              state={signInState}
              next={next}
              submitLabel="Sign in"
              passwordAutoComplete="current-password"
              minPasswordLength={6}
            />
          </TabsContent>

          <TabsContent value="signup" className="mt-5">
            <PasswordCredentialsForm
              key="signup"
              action={signUpAction}
              pending={signUpPending}
              state={signUpState}
              next={next}
              submitLabel="Create account"
              passwordAutoComplete="new-password"
              minPasswordLength={8}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <div className="text-muted-foreground flex w-full items-center gap-3 text-xs">
          <span className="bg-border h-px flex-1" />
          or
          <span className="bg-border h-px flex-1" />
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onUseMagicLink}
        >
          <Mail className="size-4" />
          Email me a magic link instead
        </Button>
      </CardFooter>
    </Card>
  );
}

function PasswordCredentialsForm({
  action,
  pending,
  state,
  next,
  submitLabel,
  passwordAutoComplete,
  minPasswordLength,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  state: LoginActionState;
  next: string;
  submitLabel: string;
  passwordAutoComplete: "current-password" | "new-password";
  minPasswordLength: number;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div className="space-y-1.5">
        <label
          htmlFor={`email-${passwordAutoComplete}`}
          className="text-foreground text-sm font-medium"
        >
          Email
        </label>
        <Input
          id={`email-${passwordAutoComplete}`}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={pending}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`password-${passwordAutoComplete}`}
          className="text-foreground text-sm font-medium"
        >
          Password
        </label>
        <div className="relative">
          <Input
            id={`password-${passwordAutoComplete}`}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={passwordAutoComplete}
            placeholder="••••••••"
            required
            minLength={minPasswordLength}
            disabled={pending}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-10 items-center justify-center"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      {state.status === "error" ? (
        <p className="text-destructive text-sm" role="alert">
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={pending}
      >
        <KeyRound className="size-4" />
        {pending ? "Working…" : submitLabel}
        {!pending ? <ArrowRight className="size-4" /> : null}
      </Button>
    </form>
  );
}

function MagicLinkForm({
  next,
  onBack,
}: {
  next: string;
  onBack: () => void;
}) {
  const [state, action, pending] = useActionState(
    requestMagicLinkAction,
    INITIAL,
  );

  if (state.status === "magic_link_sent") {
    return (
      <CheckEmailCard
        email={state.email}
        title="Check your inbox"
        description={
          <>
            We sent a sign-in link to{" "}
            <span className="text-foreground font-medium">{state.email}</span>.
            Open it on this device to finish signing in.
          </>
        }
        footnote="The link expires in an hour. If you do not see it, check your spam folder or try again with a different address."
      />
    );
  }

  return (
    <Card className="border-border/70 w-full max-w-md">
      <CardHeader>
        <div className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-full">
          <Mail className="size-5" />
        </div>
        <CardTitle className="mt-3">Email me a magic link</CardTitle>
        <CardDescription>
          We will send a one-time sign-in link to your inbox. No password
          required.
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div className="space-y-1.5">
            <label
              htmlFor="magic-email"
              className="text-foreground text-sm font-medium"
            >
              Email
            </label>
            <Input
              id="magic-email"
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
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={onBack}
            disabled={pending}
          >
            <ArrowLeft className="size-4" />
            Back to password sign in
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function CheckEmailCard({
  email,
  title,
  description,
  footnote,
}: {
  email: string;
  title: string;
  description: React.ReactNode;
  footnote?: string;
}) {
  return (
    <Card className="border-border/70 w-full max-w-md">
      <CardHeader>
        <div className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-full">
          <MailCheck className="size-5" />
        </div>
        <CardTitle className="mt-3">{title}</CardTitle>
        <CardDescription>
          {typeof description === "string" ? description : description}
        </CardDescription>
      </CardHeader>
      {footnote ? (
        <CardContent>
          <p className="text-muted-foreground text-xs">{footnote}</p>
        </CardContent>
      ) : (
        <CardContent>
          <p className="text-muted-foreground text-xs">
            Sent to{" "}
            <span className="text-foreground font-medium">{email}</span>.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
