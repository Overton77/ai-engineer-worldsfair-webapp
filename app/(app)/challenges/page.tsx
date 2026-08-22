import Link from "next/link";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
export const metadata={title:"Arena"};
export default function ChallengesPage(){return <div className="mx-auto max-w-5xl space-y-6"><h1 className="text-2xl font-semibold tracking-tight">Arena</h1><article className="rounded-xl border bg-card p-6"><div className="flex items-start gap-4"><Trophy className="mt-1 size-6 text-primary"/><div className="space-y-3"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Adult curriculum · Mission 001</p><h2 className="text-xl font-semibold">Source-grounded stock research lab</h2></div><p className="max-w-2xl text-sm text-muted-foreground">Research a ticker from public, dated evidence and make a synthetic paper-trade recommendation.</p><Button asChild><Link href="/challenges/source-grounded-stock-research/v/1.0.0">Open version 1.0.0</Link></Button></div></div></article></div>}
