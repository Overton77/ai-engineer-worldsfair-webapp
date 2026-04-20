"use client";

import { Bell, BellOff } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { toggleFollowAction } from "@/app/actions/follow";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { FollowEntityKind } from "@/lib/schema/entity-kind";
import { cn } from "@/lib/utils";

type FollowButtonProps = {
  entity: {
    kind: FollowEntityKind;
    id: string;
    title: string;
    /** Used as the click-through URL on the resulting notification. */
    url?: string | null;
  };
  initialFollowing?: boolean;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  iconOnly?: boolean;
  className?: string;
  onChange?: (following: boolean) => void;
};

export function FollowButton({
  entity,
  initialFollowing = false,
  size = "sm",
  variant = "outline",
  iconOnly = false,
  className,
  onChange,
}: FollowButtonProps) {
  const [following, setFollowing] = React.useState(initialFollowing);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing]);

  const handleClick = () => {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const result = await toggleFollowAction({
        kind: entity.kind,
        id: entity.id,
        title: entity.title,
        url: entity.url ?? null,
        intent: next ? "follow" : "unfollow",
      });
      if (!result.ok) {
        setFollowing(!next);
        toast.error(result.error || "Failed to update follow");
        return;
      }
      onChange?.(next);
      toast.success(next ? "Following" : "Unfollowed", {
        description: entity.title,
        duration: 1800,
      });
    });
  };

  const Icon = following ? BellOff : Bell;

  return (
    <Button
      type="button"
      size={size}
      variant={following ? "secondary" : variant}
      onClick={handleClick}
      disabled={pending}
      aria-pressed={following}
      aria-label={
        following ? `Unfollow ${entity.title}` : `Follow ${entity.title}`
      }
      className={cn(className)}
    >
      <Icon className="size-3.5" />
      {iconOnly ? null : following ? "Following" : "Follow"}
    </Button>
  );
}
