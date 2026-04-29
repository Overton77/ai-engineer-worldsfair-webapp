import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type ModuleProseProps = ComponentPropsWithoutRef<"article">;

export function ModuleProse({ className, ...props }: ModuleProseProps) {
  return (
    <article
      className={cn(
        "text-foreground max-w-3xl text-base leading-7",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
        "[&_blockquote]:border-border [&_blockquote]:text-muted-foreground [&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic",
        "[&_caption]:text-muted-foreground [&_caption]:mt-2 [&_caption]:text-sm",
        "[&_code]:bg-muted [&_code]:rounded-md [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm",
        "[&_figure]:my-8 [&_figure]:overflow-hidden [&_figure]:rounded-xl [&_figure]:border [&_figure]:border-border/60 [&_figure]:bg-card",
        "[&_figcaption]:text-muted-foreground [&_figcaption]:border-border/60 [&_figcaption]:border-t [&_figcaption]:px-4 [&_figcaption]:py-3 [&_figcaption]:text-sm",
        "[&_h1]:font-heading [&_h1]:mt-10 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight",
        "[&_h2]:font-heading [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight",
        "[&_h3]:font-heading [&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold",
        "[&_h4]:font-heading [&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold",
        "[&_hr]:border-border/60 [&_hr]:my-8",
        "[&_img]:h-auto [&_img]:w-full",
        "[&_li]:my-1.5",
        "[&_ol]:my-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6",
        "[&_p]:my-5",
        "[&_pre]:bg-muted [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:text-sm",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_strong]:font-semibold",
        "[&_ul]:my-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6",
        className,
      )}
      {...props}
    />
  );
}
