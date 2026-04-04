import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function RelationshipSection({
  title,
  relation,
  description,
  children,
  className,
}: {
  title: string
  relation: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn("gap-0 py-0 shadow-none", className)}>
      <CardHeader className="gap-1 border-b bg-muted/40 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wide">
            {relation}
          </Badge>
        </div>
        {description ? (
          <CardDescription className="text-xs">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="py-3">{children}</CardContent>
    </Card>
  )
}

export function RelationshipEdgeCard({
  primary,
  secondary,
  meta,
  className,
}: {
  primary: React.ReactNode
  secondary?: React.ReactNode
  meta?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm",
        className,
      )}
    >
      <div className="font-medium text-foreground">{primary}</div>
      {secondary ? (
        <div className="text-xs text-muted-foreground">{secondary}</div>
      ) : null}
      {meta ? <div className="text-[11px] text-muted-foreground">{meta}</div> : null}
    </div>
  )
}

export function RelationshipDivider() {
  return <Separator className="my-2" />
}
