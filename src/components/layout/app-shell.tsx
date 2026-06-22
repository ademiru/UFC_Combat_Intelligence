"use client";

import { Activity } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { getNavigationItem, Sidebar } from "@/components/layout/sidebar";
import { SyncControl } from "@/components/layout/sync-control";
import { UpdateControl } from "@/components/layout/update-control";
import { DataProvider } from "@/components/providers/data-provider";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <DataProvider>
      <AppChrome>{children}</AppChrome>
    </DataProvider>
  );
}

function AppChrome({ children }: AppShellProps) {
  const pathname = usePathname();
  const currentSection = getNavigationItem(pathname);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="ml-72 min-h-screen">
        <header className="sticky top-0 z-30 flex h-24 items-center justify-between border-b border-white/[0.1] bg-[#050607]/95 px-8 2xl:px-10">
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-red-500 uppercase">
              <Activity className="size-3" />
              UFC Combat Intelligence
            </div>
            <h1 className="text-xl font-bold tracking-[-0.025em] text-zinc-100 uppercase">
              {currentSection.shortLabel}
            </h1>
            <p className="mt-1 text-[10px] text-zinc-600">
              {currentSection.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SyncControl />
            <UpdateControl />
          </div>
        </header>
        <main className="p-8 2xl:p-10">{children}</main>
      </div>
    </div>
  );
}
