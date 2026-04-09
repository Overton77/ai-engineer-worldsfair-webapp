"use client";

import { Fragment, useMemo } from "react";

import { linkifyDescriptionToParts } from "@/lib/linkify-description";
import { cn } from "@/lib/utils";

export function DescriptionWithLinks({
  text,
  className,
}: {
  text: string | null | undefined;
  className?: string;
}) {
  const lines = useMemo(() => {
    const body = text?.trim() ? text : "";
    if (!body) return [];
    return body.split(/\r?\n/);
  }, [text]);

  if (!lines.length) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        No description on file for this recording.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "max-w-none whitespace-pre-wrap break-words text-[13px] leading-relaxed text-foreground",
        className,
      )}
    >
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 ? "\n" : null}
          <LineWithLinks line={line} />
        </Fragment>
      ))}
    </div>
  );
}

function LineWithLinks({ line }: { line: string }) {
  const parts = useMemo(() => linkifyDescriptionToParts(line), [line]);
  return (
    <>
      {parts.map((p, i) =>
        p.type === "text" ? (
          <span key={i}>{p.value}</span>
        ) : (
          <a
            key={i}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline decoration-primary/40 underline-offset-[3px] transition-colors hover:text-primary/90 hover:decoration-primary"
          >
            {p.label}
          </a>
        ),
      )}
    </>
  );
}
