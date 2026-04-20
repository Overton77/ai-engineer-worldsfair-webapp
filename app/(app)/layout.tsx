import { CommandPalette } from "@/components/command-palette/command-palette";
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-context";
import { NotesQuickDrawer } from "@/components/notes/notes-quick-drawer";
import { LeftRail } from "@/components/shell/left-rail";
import { MobileNav } from "@/components/shell/mobile-nav";
import { TopBar } from "@/components/shell/top-bar";
import { requireUser } from "@/lib/auth/require-user";
import { getShellProfile } from "@/lib/db/profile";
import { getCurrentUserStats } from "@/lib/db/stats";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const [shell, stats] = await Promise.all([
    getShellProfile(user.id),
    getCurrentUserStats(user.id),
  ]);

  const email = shell.email || user.email || "";

  return (
    <CommandPaletteProvider>
      <div className="bg-background flex min-h-dvh flex-col">
        <TopBar
          email={email}
          displayName={shell.displayName}
          avatarUrl={shell.avatarUrl}
        />
        <div className="mx-auto flex w-full max-w-[1600px] flex-1">
          <LeftRail xpTotal={stats.xpTotal} streakDays={stats.streakDays} />
          <main className="min-w-0 flex-1 px-4 pt-6 pb-24 md:px-8 md:pb-10">
            {children}
          </main>
        </div>
        <MobileNav />
        <CommandPalette />
        <NotesQuickDrawer />
      </div>
    </CommandPaletteProvider>
  );
}
