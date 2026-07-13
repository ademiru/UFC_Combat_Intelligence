"use client";

import {
  AlertTriangle,
  Check,
  HardDrive,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { useUfcData } from "@/components/providers/data-provider";
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

function getOverallProgress(
  syncProgress?: { current: number; total: number; stage: string } | null,
) {
  const progress = syncProgress
    ? Math.round((syncProgress.current / Math.max(1, syncProgress.total)) * 100)
    : 0;
  const stageBase: Record<string, [number, number]> = {
    connecting: [2, 8],
    rankings: [8, 16],
    events: [16, 36],
    fighters: [36, 78],
    saving: [78, 96],
    complete: [100, 100],
  };
  const [stageStart, stageEnd] = stageBase[syncProgress?.stage ?? "connecting"] ?? [4, 92];
  return Math.min(
    100,
    Math.round(stageStart + ((stageEnd - stageStart) * progress) / 100),
  );
}

export function SyncProgressStrip() {
  const { syncing, syncProgress } = useUfcData();
  if (!syncing) return null;

  const overallProgress = getOverallProgress(syncProgress);

  return (
    <div className="pointer-events-none fixed top-[116px] right-0 left-72 z-[80] border-b border-red-500/25 bg-[#08090b] shadow-[0_8px_24px_-20px_rgba(239,68,68,.7)]">
      <div className="flex h-9 items-center px-6 2xl:px-8">
        <LoaderCircle className="mr-2.5 size-3 animate-spin text-red-500" />
        <span className="text-[8px] font-black tracking-[0.18em] text-red-400 uppercase">
          Veri güncelleniyor
        </span>
        <span className="mx-3 h-3 w-px bg-white/[0.09]" />
        <span className="truncate text-[9px] text-zinc-500">
          {syncProgress?.message ?? "Resmî UFC verileri kontrol ediliyor"}
        </span>
        <span className="ml-auto font-mono text-[8px] font-bold tracking-[0.08em] text-zinc-500">
          %{overallProgress.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-black">
        <span
          className="block h-full bg-red-500 shadow-[0_0_9px_rgba(239,68,68,.65)] transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(3, overallProgress)}%` }}
        />
      </div>
    </div>
  );
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
    <div className="relative">
      <div
        role="group"
        aria-label="Çevrimiçi veri kontrolleri"
        className="flex h-10 items-stretch"
      >
        <button
          type="button"
          role="switch"
          aria-label="Online veri modunu değiştir"
          aria-checked={onlineMode}
          aria-busy={syncing}
          disabled={syncing}
          onClick={() => void setOnlineMode(!onlineMode)}
          title={
            onlineMode
              ? `Son güncelleme: ${formatLastSync(metadata.last_online_sync)}`
              : "Yerel SQLite verileri kullanılıyor"
          }
          className={cn(
            "group relative z-20 h-full w-[122px] overflow-hidden bg-white/[0.14] text-left outline-none transition-colors [clip-path:polygon(0_0,calc(100%-18px)_0,100%_50%,calc(100%-18px)_100%,0_100%)] focus-visible:bg-red-500/60 active:bg-emerald-300/80 disabled:cursor-wait",
            syncReport
              ? "bg-emerald-300/70 [filter:drop-shadow(0_0_7px_rgba(52,211,153,.34))]"
              : onlineMode
                ? "bg-emerald-400/40 [filter:drop-shadow(0_0_5px_rgba(52,211,153,.22))] hover:bg-emerald-300/60"
                : "bg-white/[0.08] hover:bg-white/[0.2]",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-px bg-[#090b0d] transition-colors duration-150 [clip-path:inherit]",
              onlineMode
                ? "group-hover:bg-[#0a100f] group-active:bg-[#0d1814]"
                : "group-hover:bg-[#0d0f12] group-active:bg-[#111419]",
            )}
          />
          <span className="relative z-10 flex h-full w-[calc(100%-18px)] items-center justify-center transition-transform duration-75 group-active:translate-x-px group-active:translate-y-px">
            <span
              className={cn(
                "translate-y-px text-[24px] leading-none font-black tracking-[0.025em] whitespace-nowrap transition-[letter-spacing,transform] duration-150 [font-family:'Bahnschrift_Condensed','Arial_Narrow',Impact,sans-serif] [font-stretch:condensed] [transform:scaleY(1.14)] group-hover:tracking-[0.045em] group-active:[transform:scale(.97,1.08)]",
                onlineMode ? "text-zinc-100" : "text-zinc-500",
              )}
            >
              {onlineMode ? "ONLINE" : "YEREL"}
            </span>
          </span>
          {syncReport ? (
            <span className="absolute inset-px z-30 bg-emerald-400 [animation:sync-success-shutter_5s_cubic-bezier(.65,0,.35,1)_both]">
              <span className="flex h-full w-[calc(100%-18px)] items-center justify-center">
                <span className="translate-y-px text-[22px] leading-none font-black tracking-[0.025em] whitespace-nowrap text-[#03110b] [font-family:'Bahnschrift_Condensed','Arial_Narrow',Impact,sans-serif] [font-stretch:condensed] [text-shadow:0_1px_0_rgba(255,255,255,.25)] [transform:scaleY(1.12)]">
                  GÜNCEL
                </span>
              </span>
            </span>
          ) : null}
        </button>

        <button
          type="button"
          disabled={!onlineMode || syncing || Boolean(syncReport)}
          aria-label="UFC verilerini şimdi yenile"
          aria-busy={syncing}
          onClick={() => void syncNow()}
          title={onlineMode ? "UFC.com verilerini şimdi güncelle" : "Önce Online Mod'u açın"}
          className="group relative z-10 -ml-3 h-full w-[62px] overflow-hidden bg-white/[0.13] text-zinc-400 outline-none transition-colors [clip-path:polygon(0_0,100%_0,100%_100%,0_100%,20px_50%)] hover:bg-red-500/65 focus-visible:bg-red-500/75 active:bg-red-400/85 disabled:cursor-not-allowed disabled:bg-white/[0.055] disabled:text-zinc-700"
        >
          <span
            aria-hidden="true"
            className="absolute inset-px bg-[#090b0d] transition-colors duration-150 [clip-path:inherit] group-hover:bg-[#160b0e] group-active:bg-[#240c11] group-disabled:bg-[#08090a]"
          />
          <span className="relative z-10 flex h-full items-center justify-center pl-5 transition-transform duration-75 group-active:translate-x-px group-active:translate-y-px">
            <RefreshCw
              strokeWidth={1.8}
              className={cn(
                "size-[21px] shrink-0 will-change-transform transition-[transform,color] duration-500 ease-[cubic-bezier(.22,.8,.3,1)] group-active:scale-90",
                syncing
                  ? "animate-spin text-red-400"
                  : "group-hover:rotate-180 group-hover:scale-110 group-hover:text-red-300",
              )}
            />
          </span>
          {syncReport ? (
            <span className="absolute inset-px z-30 flex items-center justify-center bg-emerald-400 pl-5 [animation:refresh-success-shutter_5s_cubic-bezier(.65,0,.35,1)_both]">
              <Check
                aria-hidden="true"
                strokeWidth={2.5}
                className="size-[23px] text-[#03110b]"
              />
            </span>
          ) : null}
        </button>
      </div>

      <span className="sr-only" aria-live="polite">
        {syncing
          ? "Veriler güncelleniyor"
          : syncReport
            ? "Veriler güncel"
            : onlineMode
              ? "Online mod etkin"
              : "Yerel mod etkin"}
      </span>

      {syncError && (
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
                  <p className="mt-2 text-[9px] leading-4 text-zinc-700">
                    Modu kapatıp açmanız gerekmez. İşlem bitince panel otomatik kapanır.
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
          ) : null}
        </div>
      )}
    </div>
  );
}
