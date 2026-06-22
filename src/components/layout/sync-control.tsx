"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CloudDownload,
  HardDrive,
  LoaderCircle,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";

import { useUfcData } from "@/components/providers/data-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatLastSync(value?: string) {
  if (!value) return "Henüz güncellenmedi";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Henüz güncellenmedi";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function SyncControl() {
  const {
    onlineMode,
    syncing,
    syncProgress,
    syncError,
    syncReport,
    metadata,
    setOnlineMode,
    syncNow,
  } = useUfcData();
  const progress = syncProgress
    ? Math.round((syncProgress.current / Math.max(1, syncProgress.total)) * 100)
    : 0;

  return (
    <div className="relative flex items-center gap-2">
      <div className="flex h-11 items-center gap-3 rounded-none border border-white/[0.12] bg-black/40 px-3.5">
        <span
          className={cn(
            "grid size-7 place-items-center rounded-lg",
            onlineMode
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-zinc-500/10 text-zinc-500",
          )}
        >
          {onlineMode ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
        </span>
        <div className="min-w-32">
          <p className="text-[10px] font-bold text-zinc-300">
            {onlineMode ? "Online Mod" : "Çevrimdışı Mod"}
          </p>
          <p className="mt-0.5 text-[9px] text-zinc-600">
            {onlineMode
              ? `Son: ${formatLastSync(metadata.last_online_sync)}`
              : "Yerel SQLite verisi"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-label="Online veri modunu değiştir"
          aria-checked={onlineMode}
          aria-busy={syncing}
          disabled={syncing}
          onClick={() => void setOnlineMode(!onlineMode)}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-none border transition-colors duration-150 outline-none",
            "focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080a0d]",
            "disabled:cursor-wait disabled:opacity-60",
            onlineMode
              ? "border-emerald-400/30 bg-emerald-500"
              : "border-white/[0.08] bg-zinc-700",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-5 rounded-none bg-white shadow-none transition-transform duration-150",
              onlineMode ? "translate-x-[18px]" : "translate-x-0",
            )}
          />
        </button>
      </div>

      <Button
        variant="outline"
        size="icon"
        disabled={!onlineMode || syncing}
        onClick={() => void syncNow()}
        title={onlineMode ? "UFC.com verilerini şimdi güncelle" : "Önce Online Mod'u açın"}
      >
        <RefreshCw className={cn(syncing && "animate-spin")} />
      </Button>

      {(syncing || syncError || syncReport) && (
        <div className="absolute right-0 top-14 z-50 w-[360px] rounded-xl border border-white/[0.09] bg-[#111317] p-4 shadow-2xl shadow-black/50">
          {syncing ? (
            <>
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-500">
                  <LoaderCircle className="size-4 animate-spin" />
                </span>
                <div>
                  <p className="text-xs font-bold text-zinc-100">Canlı veri güncelleniyor</p>
                  <p className="mt-1 text-[10px] leading-4 text-zinc-500">
                    {syncProgress?.message ?? "UFC.com ile bağlantı kuruluyor"}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                <span
                  className="block h-full rounded-full bg-red-500 transition-[width]"
                  style={{ width: `${Math.max(5, progress)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[9px] text-zinc-700">
                <span>{syncProgress?.stage ?? "connecting"}</span>
                <span>%{progress}</span>
              </div>
            </>
          ) : syncError ? (
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-500">
                <AlertTriangle className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-100">Güncelleme tamamlanamadı</p>
                <p className="mt-1 text-[10px] leading-4 text-zinc-500">{syncError}</p>
                <p className="mt-2 flex items-center gap-1.5 text-[9px] text-emerald-500/70">
                  <HardDrive className="size-3" />
                  Yerel veriler kullanılmaya devam ediyor.
                </p>
              </div>
            </div>
          ) : syncReport ? (
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-zinc-100">Veriler güncel</p>
                <p className="mt-1 text-[10px] leading-4 text-zinc-500">
                  {syncReport.fighterProfilesUpdated} sporcu · {syncReport.fightHistoryUpdated} geçmiş maç · {syncReport.eventsUpdated} etkinlik
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-[9px] text-zinc-700">
                  <CloudDownload className="size-3" />
                  UFC.com → yerel SQLite önbelleği
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
