import { DirectoryExplorer } from "@/components/directory-explorer";

export default function Home() {
  return (
    <div className="min-h-full flex-1 bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="min-h-full bg-white dark:bg-zinc-950">
        <DirectoryExplorer />
      </main>
    </div>
  );
}
