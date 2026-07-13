"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { getNavigationItem, primaryNavigation, Sidebar } from "@/components/layout/sidebar";
import { GlobalSearch } from "@/components/layout/global-search";
import { SyncControl, SyncProgressStrip } from "@/components/layout/sync-control";
import { UpdateControl } from "@/components/layout/update-control";
import { WindowTitlebar } from "@/components/layout/window-titlebar";
import { DataProvider, useUfcData } from "@/components/providers/data-provider";
import { cn } from "@/lib/utils";

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
  const router = useRouter();
  const { syncing } = useUfcData();
  const currentSection = getNavigationItem(pathname);
  const currentSectionIndex = Math.max(
    1,
    primaryNavigation.findIndex((item) => item.href === currentSection.href) + 1,
  );
  const isHome = pathname === "/";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === "ArrowLeft" && pathname !== "/") {
        event.preventDefault();
        if (window.history.length > 1) router.back();
        else router.push("/");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pathname, router]);

  return (
    <div className="relative min-h-screen text-foreground">
      <WindowTitlebar />
      <Sidebar />
      <SyncProgressStrip />
      <div className="ml-72 min-h-screen pt-9">
        <header className="sticky top-9 z-30 flex h-20 items-stretch border-b border-white/[0.09] bg-[#070809]/98">
          <button
            type="button"
            disabled={isHome}
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push("/");
            }}
            title={isHome ? "Ana sayfadasınız" : "Geri dön (Alt + Sol Ok)"}
            aria-label="Önceki sayfaya dön"
            className="group relative flex w-16 shrink-0 flex-col items-center justify-center gap-1.5 overflow-hidden border-r border-white/[0.1] bg-[#090b0d] text-zinc-400 outline-none transition-[background-color,color,border-color] duration-200 hover:border-r-red-500/30 hover:bg-[#0c0e11] hover:text-white focus-visible:bg-[#0c0e11] active:bg-[#0e1013] disabled:cursor-not-allowed disabled:bg-[#080a0c] disabled:text-zinc-600"
          >
            <span className="relative grid size-8 place-items-center border border-white/[0.12] bg-white/[0.018] transition-[border-color,background-color,transform] duration-200 group-hover:border-red-500/45 group-hover:bg-red-500/[0.07] group-active:translate-y-px group-disabled:border-white/[0.06] group-disabled:bg-transparent">
              <span className="absolute -top-px -left-px h-2 w-2 border-t border-l border-red-500/0 transition-colors group-hover:border-red-500/90" />
              <span className="absolute -right-px -bottom-px h-2 w-2 border-r border-b border-red-500/0 transition-colors group-hover:border-red-500/90" />
              <ArrowLeft className="size-[17px] stroke-[1.9] transition-transform duration-200 group-hover:-translate-x-0.5 group-active:-translate-x-1 group-disabled:translate-x-0" />
            </span>
            <span className="font-display text-[7px] font-black tracking-[0.2em] uppercase transition-colors group-hover:text-red-400">
              Geri
            </span>
            <span className="absolute top-2 right-1.5 font-mono text-[5px] tracking-[0.08em] text-zinc-800 group-hover:text-zinc-600">
              ALT
            </span>
          </button>

          <div className="relative h-full w-[clamp(270px,28vw,380px)] shrink-0 overflow-hidden bg-white/[0.09] [clip-path:polygon(0_0,calc(100%-26px)_0,100%_50%,calc(100%-26px)_100%,0_100%)]">
            <div className="absolute inset-px bg-[#0a0c0e] [clip-path:inherit]" />
            <span className="absolute inset-y-0 left-0 z-10 w-[3px] bg-red-500" />
            <span className="absolute top-0 left-0 z-10 h-px w-28 bg-red-500/80" />
            <div className="relative z-10 flex h-full min-w-0 items-center gap-4 px-5 pr-11">
              <span className="font-display text-[30px] leading-none font-black tracking-[-0.04em] text-red-500/25 tabular-nums">
                {String(currentSectionIndex).padStart(2, "0")}
              </span>
              <div className="min-w-0 border-l border-white/[0.08] pl-4">
                <div className="mb-1 text-[7px] font-black tracking-[0.24em] text-red-500 uppercase">
                  {currentSection.label}
                </div>
                <h1 className="truncate font-display text-[24px] leading-none font-black tracking-[0.01em] text-zinc-100 uppercase">
                  {currentSection.shortLabel}
                </h1>
                <p className="mt-1 truncate text-[8px] text-zinc-600">
                  {currentSection.description}
                </p>
              </div>
            </div>
          </div>

          <div className="relative ml-auto flex min-w-0 items-center justify-end gap-2 px-5 2xl:px-7">
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-red-500/25" />
            <GlobalSearch />
            <span className="mx-1 h-6 w-px bg-white/[0.07]" />
            <SyncControl />
            <UpdateControl />
          </div>
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/[0.055]" />
          <span className="pointer-events-none absolute right-0 bottom-0 h-[2px] w-20 bg-red-500/60" />
        </header>
        <main
          className={cn(
            "px-6 pb-6 transition-[padding] duration-300 2xl:px-8 2xl:pb-8",
            syncing ? "pt-[60px] 2xl:pt-16" : "pt-6 2xl:pt-8",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
