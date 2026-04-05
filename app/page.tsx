import { WelcomeGate } from "@/components/landing/welcome-gate";

type Props = {
  searchParams: Promise<{ error?: string; message?: string; redirect?: string }>;
};

function safeRedirectParam(value: string | undefined): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/directory";
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const redirectPath = safeRedirectParam(params.redirect);

  return (
    <WelcomeGate
      initialError={params.error ?? null}
      initialMessage={params.message ?? null}
      redirectPath={redirectPath}
    />
  );
}
