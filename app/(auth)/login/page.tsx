import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your AI Engineer account.",
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

function safeNext(value: string | undefined): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  return <LoginForm next={safeNext(next)} />;
}
