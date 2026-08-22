import { notFound } from "next/navigation";
import { ResearchLab } from "@/components/stock-research/research-lab";
import { requireUser } from "@/lib/auth/require-user";
import { listRuns } from "@/lib/stock-research/db";
import { createServerSupabase } from "@/lib/supabase/server";
export const metadata={title:"Mission 001 · Stock research"};
export default async function Page({params}:{params:Promise<{slug:string;version:string}>}){
 const {slug,version}=await params;if(slug!=="source-grounded-stock-research"||version!=="1.0.0")notFound();
 const user=await requireUser();const runs=await listRuns(await createServerSupabase(),user.id);
 return <div className="mx-auto max-w-4xl space-y-6"><header><p className="text-sm font-medium text-primary">Adult curriculum · Mission 001 · v1.0.0</p><h1 className="mt-1 text-3xl font-semibold">Source-grounded stock research lab</h1><p className="mt-3 max-w-3xl text-muted-foreground">Build a thesis, counter-thesis, uncertainty register, and cited evidence under a strict as-of date. Recommendations are paper-trade simulations only—not personalized investment advice.</p></header><aside className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm"><strong>Safety boundary:</strong> This lab never connects to a brokerage, accepts credentials, or places orders. Use public information and synthetic portfolio data only.</aside><ResearchLab runs={runs}/></div>;
}
