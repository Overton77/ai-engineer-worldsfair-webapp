"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { VariantProps } from "class-variance-authority";

import { Button, buttonVariants } from "@/components/ui/button";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type ButtonVariants = VariantProps<typeof buttonVariants>;

export function SignOutButton({
  variant = "outline",
  size = "sm",
}: {
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      const supabase = createBrowserSupabase();
      await supabase.auth.signOut();
      router.refresh();
      router.push("/");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={pending}
      onClick={handleSignOut}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
