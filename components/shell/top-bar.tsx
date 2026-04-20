import { Logo } from "@/components/brand/logo";

import { AssistantToggle } from "./assistant-toggle";
import { CommandTrigger } from "./command-trigger";
import { NotificationsBell } from "./notifications-bell";
import { UserMenu } from "./user-menu";

type TopBarProps = {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export function TopBar({ email, displayName, avatarUrl }: TopBarProps) {
  return (
    <header className="border-border/60 bg-background/85 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full items-center gap-3 px-4">
        <Logo />
        <div className="ml-2 flex flex-1 items-center justify-center">
          <CommandTrigger />
        </div>
        <div className="flex items-center gap-1">
          <AssistantToggle />
          <NotificationsBell />
          <UserMenu
            email={email}
            displayName={displayName}
            avatarUrl={avatarUrl}
          />
        </div>
      </div>
    </header>
  );
}
