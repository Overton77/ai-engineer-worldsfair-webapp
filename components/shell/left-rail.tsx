import {
  BookOpen,
  Bookmark,
  Bot,
  Compass,
  GraduationCap,
  Home,
  Notebook,
  Trophy,
  UsersRound,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";

import { NavLink } from "./nav-link";
import { XpStreakBadge } from "./xp-streak-badge";

type LeftRailProps = {
  xpTotal: number;
  streakDays: number;
};

const ICON_CLASSES = "size-4";

export function LeftRail({ xpTotal, streakDays }: LeftRailProps) {
  return (
    <aside className="border-border/60 bg-background/50 hidden h-full w-56 shrink-0 flex-col border-r p-3 md:flex">
      <nav className="flex flex-col gap-0.5">
        <NavLink href="/" icon={<Home className={ICON_CLASSES} />} label="Home" exact />
        <NavLink href="/explore" icon={<Compass className={ICON_CLASSES} />} label="Explore" />
        <NavLink href="/notes" icon={<Notebook className={ICON_CLASSES} />} label="Notes" />
        <NavLink href="/saved" icon={<Bookmark className={ICON_CLASSES} />} label="Saved" />
        <NavLink href="/follows" icon={<UsersRound className={ICON_CLASSES} />} label="Follows" />
      </nav>
      <Separator className="my-3" />
      <nav className="flex flex-col gap-0.5">
        <NavLink href="/learn" icon={<BookOpen className={ICON_CLASSES} />} label="Learn" />
        <NavLink href="/courses" icon={<GraduationCap className={ICON_CLASSES} />} label="Courses" />
        <NavLink href="/challenges" icon={<Trophy className={ICON_CLASSES} />} label="Arena" />
      </nav>
      <Separator className="my-3" />
      <nav className="flex flex-col gap-0.5">
        <NavLink href="/ask" icon={<Bot className={ICON_CLASSES} />} label="Assistant" />
      </nav>
      <div className="mt-auto pt-3">
        <XpStreakBadge xpTotal={xpTotal} streakDays={streakDays} />
      </div>
    </aside>
  );
}
