"use client";

import type { LucideIcon } from "lucide-react";
import {
  ChartNoAxesCombined,
  CloudDownload,
  Database,
  Gauge,
  Settings2,
  Swords,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { OctagonMark } from "@/components/brand/octagon-mark";
import { useUfcData } from "@/components/providers/data-provider";
import { cn } from "@/lib/utils";

export interface NavigationItem {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
}

export const primaryNavigation: NavigationItem[] = [
  {
    href: "/",
    label: "Fight Center",
    shortLabel: "Dashboard",
    description: "Etkinlikler, kartlar ve şampiyonlar",
    icon: Gauge,
  },
  {
    href: "/fighters",
    label: "Fighter Explorer",
    shortLabel: "Dövüşçüler",
    description: "Arama ve gelişmiş filtreleme",
    icon: UsersRound,
  },
  {
    href: "/h2h",
    label: "H2H Laboratuvarı",
    shortLabel: "Karşılaştırma",
    description: "İki dövüşçüyü karşılaştır",
    icon: Swords,
  },
  {
    href: "/analytics",
    label: "Oktagon Analizi",
    shortLabel: "Derin analiz",
    description: "Bireysel performans metrikleri",
    icon: ChartNoAxesCombined,
  },
];

function isActiveRoute(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const { fighters, loading, error, onlineMode, syncing } = useUfcData();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/[0.12] bg-[#07090b]">
      <div className="flex h-24 items-center gap-3 border-b border-white/[0.06] px-7">
        <OctagonMark className="text-red-600 drop-shadow-[0_0_18px_rgba(220,38,38,0.3)]" />
        <div>
          <p className="text-lg font-black tracking-[-0.03em] text-white uppercase">
            UFC <span className="text-red-500">PANEL</span>
          </p>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
            Combat Intelligence
          </p>
        </div>
      </div>

      <nav aria-label="Ana navigasyon" className="flex-1 px-4 py-7">
        <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.18em] text-zinc-600 uppercase">
          Analiz Merkezi
        </p>
        <ul className="space-y-1.5">
          {primaryNavigation.map((item, index) => {
            const active = isActiveRoute(pathname, item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-none border border-transparent px-3 py-3.5 transition-colors",
                    active
                      ? "border-red-500/25 bg-red-600/10 text-white"
                      : "text-zinc-500 hover:border-white/[0.08] hover:bg-white/[0.025] hover:text-zinc-200",
                  )}
                >
                  {active && (
                    <span className="absolute inset-y-0 left-0 w-0.5 bg-red-500" />
                  )}
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-lg border transition-colors",
                      active
                        ? "border-red-500/25 bg-red-500/10 text-red-400"
                        : "border-white/[0.06] bg-white/[0.02] text-zinc-600 group-hover:text-zinc-300",
                    )}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="text-[9px] font-bold text-zinc-700">
                    0{index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold tracking-wide uppercase">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-zinc-600 group-hover:text-zinc-500">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-white/[0.06] p-4">
        <div className="rounded-none border border-emerald-500/15 bg-emerald-500/[0.025] p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            {onlineMode ? (
              <CloudDownload className="size-3.5 text-emerald-500" />
            ) : (
              <Database className="size-3.5 text-emerald-500" />
            )}
            {onlineMode ? "Çevrimiçi + Yerel" : "Yerel veritabanı"}
            <span
              className={cn(
                "ml-auto size-1.5 rounded-none",
                error
                  ? "bg-red-500"
                  : loading || syncing
                    ? "animate-pulse bg-amber-400"
                    : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]",
              )}
            />
          </div>
          <p className="mt-1.5 text-[11px] leading-4 text-zinc-600">
            {error
              ? "Bağlantı kontrol edilmeli."
              : syncing
                ? "UFC verileri güncelleniyor."
                : loading
                ? "Başlangıç verileri yükleniyor."
                : onlineMode
                  ? `${fighters.length} dövüşçü · güncel önbellek.`
                  : `${fighters.length} dövüşçü çevrimdışı hazır.`}
          </p>
        </div>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-none border border-transparent px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-white/[0.08] hover:bg-white/[0.025] hover:text-zinc-300"
        >
          <Settings2 className="size-4" />
          Ayarlar
          <span className="ml-auto rounded bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-zinc-700 uppercase">
            Yakında
          </span>
        </button>
      </div>
    </aside>
  );
}

export function getNavigationItem(pathname: string) {
  return (
    primaryNavigation.find((item) => isActiveRoute(pathname, item.href)) ??
    primaryNavigation[0]
  );
}
