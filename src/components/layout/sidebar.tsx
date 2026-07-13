"use client";

import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  ChartNoAxesCombined,
  CloudDownload,
  Database,
  Gauge,
  MapPin,
  Radio,
  Settings2,
  Swords,
  ScanSearch,
  Trophy,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
    shortLabel: "Komuta Merkezi",
    description: "Canlı operasyon ve etkinlik istihbaratı",
    icon: Gauge,
  },
  {
    href: "/fighters",
    label: "Roster / DB",
    shortLabel: "Dövüşçü Veritabanı",
    description: "Taktiksel filtreler ve sıralamalar",
    icon: UsersRound,
  },
  {
    href: "/h2h",
    label: "Taktiksel Çarpışma",
    shortLabel: "Matchup / H2H",
    description: "Stil, fizik ve ortak rakip analizi",
    icon: Swords,
  },
  {
    href: "/analytics",
    label: "Fighter Intel",
    shortLabel: "Dövüşçü Karnesi",
    description: "Cephanelik, kondisyon ve operasyon kaydı",
    icon: ScanSearch,
  },
  {
    href: "/lab",
    label: "Analytics Lab",
    shortLabel: "Analitik Laboratuvarı",
    description: "Liderler ve organizasyon trendleri",
    icon: ChartNoAxesCombined,
  },
];

function isActiveRoute(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const remaining = Math.max(0, target - now);
  const totalSeconds = Math.floor(remaining / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    live: target > 0 && remaining <= 0,
    valid: target > 0,
  };
}

function StatChip({
  value,
  label,
  index,
}: {
  value: number;
  label: string;
  index: string;
}) {
  return (
    <div className="group relative min-w-0 px-4 py-4 transition-colors hover:bg-white/[0.018]">
      <div className="flex items-start justify-between">
        <p className="font-display text-[25px] leading-none font-black tracking-[-0.035em] text-zinc-100 tabular-nums">
          {String(value).padStart(2, "0")}
        </p>
        <span className="font-mono text-[7px] text-zinc-800 transition-colors group-hover:text-red-500/70">
          {index}
        </span>
      </div>
      <p className="mt-2 truncate text-[8px] font-bold tracking-[0.16em] text-zinc-500 uppercase transition-colors group-hover:text-zinc-300">
        {label}
      </p>
      <span className="absolute right-4 bottom-0 left-4 h-px bg-white/[0.07] transition-colors group-hover:bg-red-500/60" />
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { fighters, events, loading, error, onlineMode, syncing } =
    useUfcData();

  const championCount = useMemo(
    () => fighters.filter((fighter) => fighter.is_champion).length,
    [fighters],
  );

  const today = new Date().toISOString().slice(0, 10);
  const nextEvent = useMemo(
    () =>
      [...events]
        .filter((event) => event.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))[0],
    [events, today],
  );

  const target = useMemo(() => {
    if (!nextEvent) return 0;
    const parsed = Date.parse(`${nextEvent.date}T22:00:00`);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [nextEvent]);
  const countdown = useCountdown(target);
  const eventSoon = countdown.valid && countdown.days <= 10;

  const statusBusy = loading || syncing;

  return (
    <aside className="fixed top-9 bottom-0 left-0 z-40 flex w-72 flex-col bg-gradient-to-b from-[#0a0c0e] to-[#070809]">
      <span className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-red-500/60 via-white/[0.08] to-red-700/25 shadow-[2px_0_12px_rgba(225,20,20,.12)]" />

      {/* Live metrics */}
      <div className="relative grid grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.08] bg-[#080a0c]">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-red-600/80 via-red-600/15 to-transparent" />
        <StatChip value={fighters.length} label="Dövüşçü" index="01" />
        <StatChip value={events.length} label="Etkinlik" index="02" />
        <StatChip value={championCount} label="Şampiyon" index="03" />
      </div>

      {/* Navigation */}
      <nav
        aria-label="Ana navigasyon"
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <p className="mb-3 flex items-center gap-2 px-3 text-[10px] font-bold tracking-[0.18em] text-zinc-600 uppercase">
          <span className="h-px w-4 bg-red-600/50" />
          Analiz Merkezi
        </p>
        <ul className="space-y-1.5">
          {primaryNavigation.map((item, index) => {
            const active = isActiveRoute(pathname, item.href);
            const Icon = item.icon;
            const badge =
              item.href === "/fighters" && fighters.length > 0
                ? `${fighters.length}`
                : null;
            const showLive = item.href === "/" && eventSoon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-none border border-transparent px-3 py-3 transition-all",
                    active
                      ? "border-red-500/25 bg-gradient-to-r from-red-600/[0.16] to-transparent text-white"
                      : "text-zinc-500 hover:border-white/[0.08] hover:bg-white/[0.025] hover:text-zinc-200",
                  )}
                >
                  {active && (
                    <span className="absolute inset-y-0 left-0 w-[3px] bg-red-500 shadow-[0_0_12px_rgba(225,20,20,0.8)]" />
                  )}
                  <span
                    className={cn(
                      "relative grid size-9 place-items-center rounded-lg border transition-colors",
                      active
                        ? "border-red-500/30 bg-red-500/15 text-red-400"
                        : "border-white/[0.06] bg-white/[0.02] text-zinc-600 group-hover:text-zinc-300",
                    )}
                  >
                    <Icon className="size-[18px]" />
                    {showLive && (
                      <span className="absolute -right-1 -top-1 flex size-2.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500/70" />
                        <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
                      </span>
                    )}
                  </span>
                  <span className="font-tabular text-[9px] font-bold text-zinc-700">
                    0{index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-display block text-sm font-bold tracking-[0.02em] uppercase">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-zinc-600 group-hover:text-zinc-500">
                      {item.description}
                    </span>
                  </span>
                  {badge && (
                    <span className="font-tabular shrink-0 rounded-none border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-bold text-zinc-500">
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Next event countdown */}
      <div className="space-y-3 border-t border-white/[0.06] p-4">
        {nextEvent ? (
          <Link
            href="/"
            className="clip-corner-sm group relative block overflow-hidden border border-red-500/25 bg-[radial-gradient(circle_at_85%_0%,rgba(220,38,38,0.2),transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] p-3.5"
          >
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.16em] text-red-500 uppercase">
                {countdown.live ? (
                  <>
                    <Radio className="size-3 animate-pulse" /> Canlı
                  </>
                ) : (
                  <>
                    <CalendarClock className="size-3" /> Sıradaki Etkinlik
                  </>
                )}
              </p>
              <span className="font-tabular text-[9px] text-zinc-600">
                {nextEvent.date}
              </span>
            </div>
            <p className="font-display mt-2 truncate text-sm font-bold tracking-wide text-white uppercase">
              {nextEvent.name}
            </p>
            {countdown.live ? (
              <p className="mt-2.5 flex items-center gap-2 text-[11px] font-bold text-red-400">
                <span className="size-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(225,20,20,0.9)]" />
                Etkinlik başladı
              </p>
            ) : (
              <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                {[
                  { value: countdown.days, label: "Gün" },
                  { value: countdown.hours, label: "Sa" },
                  { value: countdown.minutes, label: "Dk" },
                  { value: countdown.seconds, label: "Sn" },
                ].map((unit) => (
                  <div
                    key={unit.label}
                    className="border border-white/[0.08] bg-black/40 py-1.5 text-center"
                  >
                    <p className="font-display text-base leading-none font-bold text-white tabular-nums">
                      {String(unit.value).padStart(2, "0")}
                    </p>
                    <p className="mt-0.5 text-[7px] font-bold tracking-widest text-zinc-600 uppercase">
                      {unit.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2.5 flex items-center gap-1.5 truncate text-[10px] text-zinc-500">
              <MapPin className="size-3 shrink-0 text-zinc-600" />
              <span className="truncate">{nextEvent.location}</span>
            </p>
          </Link>
        ) : (
          <div className="border border-dashed border-white/[0.08] p-3.5 text-center">
            <Trophy className="mx-auto size-4 text-zinc-700" />
            <p className="mt-2 text-[10px] text-zinc-600">
              Planlanmış etkinlik bulunmuyor
            </p>
          </div>
        )}

        {/* Data source status */}
        <div
          className={cn(
            "flex items-center gap-2 border px-3 py-2 text-[10px] font-semibold",
            error
              ? "border-red-500/20 bg-red-500/[0.04] text-red-300"
              : "border-emerald-500/15 bg-emerald-500/[0.03] text-zinc-300",
          )}
        >
          {onlineMode ? (
            <CloudDownload className="size-3.5 text-emerald-500" />
          ) : (
            <Database className="size-3.5 text-emerald-500" />
          )}
          <span className="truncate">
            {error
              ? "Bağlantı kontrol edilmeli"
              : syncing
                ? "Veriler güncelleniyor"
                : loading
                  ? "Yükleniyor"
                  : onlineMode
                    ? "Çevrimiçi + Yerel"
                    : "Yerel veritabanı"}
          </span>
          <span
            className={cn(
              "ml-auto size-1.5 shrink-0 rounded-full",
              error
                ? "bg-red-500"
                : statusBusy
                  ? "animate-pulse bg-amber-400"
                  : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]",
            )}
          />
        </div>

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-none border border-transparent px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-white/[0.08] hover:bg-white/[0.025] hover:text-zinc-300"
        >
          <Settings2 className="size-4" />
          Ayarlar
          <span className="font-tabular ml-auto rounded bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-zinc-700 uppercase">
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
