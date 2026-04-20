import {
  Building2,
  Calendar,
  FileText,
  GraduationCap,
  type LucideIcon,
  Library,
  Mic,
  Newspaper,
  Notebook,
  Package,
  PlaySquare,
  ScrollText,
  Trophy,
  User2,
  type LucideProps,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { EntityKind } from "@/lib/schema/entity-kind";
import { cn } from "@/lib/utils";

type EntityKindMeta = {
  label: string;
  icon: LucideIcon;
};

const META: Record<EntityKind, EntityKindMeta> = {
  person: { label: "Person", icon: User2 },
  organization: { label: "Org", icon: Building2 },
  library: { label: "Library", icon: Library },
  product: { label: "Product", icon: Package },
  paper: { label: "Paper", icon: FileText },
  session: { label: "Talk", icon: Mic },
  youtube_video: { label: "Video", icon: PlaySquare },
  event: { label: "Event", icon: Calendar },
  news_item: { label: "News", icon: Newspaper },
  repo: { label: "Repo", icon: ScrollText },
  report: { label: "Report", icon: ScrollText },
  course: { label: "Course", icon: GraduationCap },
  course_module: { label: "Module", icon: GraduationCap },
  challenge: { label: "Challenge", icon: Trophy },
  attempt: { label: "Attempt", icon: Trophy },
  image: { label: "Image", icon: PlaySquare },
  notes: { label: "Note", icon: Notebook },
};

export function entityKindLabel(kind: EntityKind): string {
  return META[kind]?.label ?? kind;
}

export function EntityKindIcon({
  kind,
  ...props
}: { kind: EntityKind } & LucideProps) {
  const Meta = META[kind] ?? META.person;
  const Icon = Meta.icon;
  return <Icon {...props} />;
}

export function EntityKindChip({
  kind,
  className,
}: {
  kind: EntityKind;
  className?: string;
}) {
  const Meta = META[kind] ?? META.person;
  const Icon = Meta.icon;
  return (
    <Badge variant="outline" className={cn("gap-1", className)}>
      <Icon className="size-3" />
      {Meta.label}
    </Badge>
  );
}
