import { SiteHeader } from "@/components/auth/site-header";

export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <div className="flex min-h-0 flex-1">{children}</div>
    </div>
  );
}
