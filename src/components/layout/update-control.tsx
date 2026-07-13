"use client";

import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAppPreferences } from "@/hooks/use-app-preferences";
import { UPDATE_CHECK_REQUESTED } from "@/lib/preferences";
import { cn } from "@/lib/utils";

type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "current"
  | "error";

const LAST_UPDATE_CHECK_KEY = "ufc-panel:last-update-check";
const DISMISSED_UPDATE_KEY = "ufc-panel:dismissed-update";
const AUTO_CHECK_INTERVAL = 30 * 60 * 1000;
const DISMISS_INTERVAL = 12 * 60 * 60 * 1000;

interface DismissedUpdate {
  version: string;
  dismissedAt: number;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function UpdateControl() {
  const { preferences } = useAppPreferences();
  const rootRef = useRef<HTMLDivElement>(null);
  const updateRef = useRef<Update | null>(null);
  const checkLock = useRef(false);
  const installLock = useRef(false);
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [isOpen, setIsOpen] = useState(false);
  const [currentVersion, setCurrentVersion] = useState("0.1.0");
  const [nextVersion, setNextVersion] = useState<string>();
  const [releaseNotes, setReleaseNotes] = useState<string>();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();

  const wasRecentlyDismissed = useCallback((version: string) => {
    try {
      const dismissed = JSON.parse(
        localStorage.getItem(DISMISSED_UPDATE_KEY) ?? "null",
      ) as DismissedUpdate | null;
      return Boolean(
        dismissed?.version === version &&
          Date.now() - dismissed.dismissedAt < DISMISS_INTERVAL,
      );
    } catch {
      localStorage.removeItem(DISMISSED_UPDATE_KEY);
      return false;
    }
  }, []);

  const dismissPanel = useCallback(() => {
    if (nextVersion && status === "available") {
      const dismissed: DismissedUpdate = {
        version: nextVersion,
        dismissedAt: Date.now(),
      };
      localStorage.setItem(DISMISSED_UPDATE_KEY, JSON.stringify(dismissed));
    }
    setIsOpen(false);
  }, [nextVersion, status]);

  const checkForUpdates = useCallback(async (showResult = true) => {
    if (!isTauri() || checkLock.current || installLock.current) return;

    checkLock.current = true;
    setStatus("checking");
    setError(undefined);
    if (showResult) setIsOpen(true);

    try {
      const update = await check();
      localStorage.setItem(LAST_UPDATE_CHECK_KEY, Date.now().toString());

      if (!update) {
        updateRef.current = null;
        setNextVersion(undefined);
        setStatus(showResult ? "current" : "idle");
        return;
      }

      updateRef.current = update;
      setNextVersion(update.version);
      setReleaseNotes(update.body ?? undefined);
      setStatus("available");
      if (showResult || !wasRecentlyDismissed(update.version)) setIsOpen(true);
    } catch (caught) {
      if (!showResult) {
        setStatus("idle");
        return;
      }

      setError(errorMessage(caught));
      setStatus("error");
    } finally {
      checkLock.current = false;
    }
  }, [wasRecentlyDismissed]);

  const installUpdate = useCallback(async () => {
    const update = updateRef.current;
    if (!update || installLock.current) return;

    installLock.current = true;
    setStatus("downloading");
    setProgress(0);
    setError(undefined);

    let downloaded = 0;
    let total = 0;

    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
          return;
        }

        if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          setProgress(total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : 0);
          return;
        }

        if (event.event === "Finished") setProgress(100);
      });

      await relaunch();
    } catch (caught) {
      setError(errorMessage(caught));
      setStatus("error");
      installLock.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isTauri()) return;

    void getVersion().then(setCurrentVersion).catch(() => undefined);

    if (!preferences.automaticUpdateChecks) return;

    const timer = window.setTimeout(() => void checkForUpdates(false), 3500);
    const interval = window.setInterval(
      () => void checkForUpdates(false),
      AUTO_CHECK_INTERVAL,
    );
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [checkForUpdates, preferences.automaticUpdateChecks]);

  useEffect(() => {
    const onRequested = () => void checkForUpdates(true);
    window.addEventListener(UPDATE_CHECK_REQUESTED, onRequested);
    return () => window.removeEventListener(UPDATE_CHECK_REQUESTED, onRequested);
  }, [checkForUpdates]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideInteraction = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) dismissPanel();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismissPanel();
    };
    document.addEventListener("pointerdown", closeOnOutsideInteraction);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideInteraction);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [dismissPanel, isOpen]);

  const busy = status === "checking" || status === "downloading";
  const hasUpdate = status === "available" || status === "downloading";

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="outline"
        size="icon"
        className={cn(hasUpdate && "border-red-500/60 bg-red-950/30 text-red-400")}
        onClick={() => {
          if (status === "idle") void checkForUpdates(true);
          else setIsOpen((value) => !value);
        }}
        title="Uygulama güncellemelerini denetle"
        aria-label="Uygulama güncellemelerini denetle"
        aria-expanded={isOpen}
      >
        {busy ? <LoaderCircle className="animate-spin" /> : <PackageCheck />}
      </Button>

      {hasUpdate && !isOpen && (
        <span className="absolute -top-1 -right-1 size-2.5 border border-[#050607] bg-red-500" />
      )}

      {isOpen && (
        <div className="absolute top-14 right-0 z-50 w-[440px] border border-white/[0.14] bg-[#090b0e] shadow-[0_28px_80px_rgba(0,0,0,.72)]">
          <span className="absolute -top-[7px] right-3 size-3 rotate-45 border-t border-l border-white/[0.14] bg-[#090b0e]" />
          <div className="relative flex items-start justify-between gap-4 overflow-hidden border-b border-white/[0.08] px-5 py-4">
            <span className="absolute top-0 left-0 h-full w-[3px] bg-red-500" />
            <span className="absolute top-0 left-0 h-px w-36 bg-red-500/80" />
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center border border-red-500/30 bg-red-500/[0.07] text-red-500">
                <PackageCheck className="size-[18px]" />
              </div>
              <div>
                <p className="font-display text-[11px] font-black tracking-[0.18em] text-red-500 uppercase">
                  System Update // Verified
                </p>
                <p className="mt-1 text-[9px] text-zinc-600">Yüklü sürüm v{currentVersion}</p>
              </div>
            </div>
            <button
              type="button"
              className="grid size-7 place-items-center border border-white/[0.08] text-zinc-600 hover:text-zinc-200"
              onClick={dismissPanel}
              aria-label="Güncelleme penceresini kapat"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="px-5 py-5">
            {status === "checking" && (
              <StatusLine icon={<LoaderCircle className="animate-spin" />} title="Yeni sürüm aranıyor">
                İmzalı yayın kanalı kontrol ediliyor.
              </StatusLine>
            )}

            {status === "current" && (
              <StatusLine icon={<CheckCircle2 />} title="Uygulama güncel" tone="success">
                Kullanılabilir daha yeni bir sürüm bulunamadı.
              </StatusLine>
            )}

            {status === "available" && (
              <>
                <div className="grid grid-cols-[1fr_auto] items-end gap-5 border-b border-white/[0.07] pb-4">
                  <div>
                    <p className="text-[8px] font-black tracking-[0.2em] text-zinc-600 uppercase">Yeni sürüm hazır</p>
                    <p className="mt-2 font-display text-[32px] leading-none font-black tracking-[-0.03em] text-white">v{nextVersion}</p>
                  </div>
                  <div className="flex items-center gap-2 pb-1 text-[9px] font-bold tracking-wider text-emerald-400 uppercase">
                    <CheckCircle2 className="size-3.5" /> İmza doğrulanacak
                  </div>
                </div>
                {releaseNotes && (
                  <p className="mt-4 max-h-28 overflow-y-auto border-l-2 border-red-500/50 bg-white/[0.018] py-2 pr-3 pl-3 text-[10px] leading-5 whitespace-pre-line text-zinc-400">
                    {releaseNotes}
                  </p>
                )}
                <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                  <Button className="group h-11" onClick={() => void installUpdate()}>
                    <Download />
                    Şimdi güncelle
                    <ArrowRight className="ml-auto transition-transform group-hover:translate-x-0.5" />
                  </Button>
                  <Button variant="outline" className="h-11 px-4" onClick={dismissPanel}>
                    Sonra
                  </Button>
                </div>
                <p className="mt-3 text-[8px] leading-4 text-zinc-700">
                  İndirme arka planda doğrulanır; kurulumdan sonra uygulama otomatik yeniden açılır.
                </p>
              </>
            )}

            {status === "downloading" && (
              <>
                <StatusLine icon={<LoaderCircle className="animate-spin" />} title={`v${nextVersion} kuruluyor`} tone="accent">
                  Uygulama işlem tamamlanınca güvenli biçimde yeniden başlayacak.
                </StatusLine>
                <div className="mt-4 h-1.5 bg-white/[0.06]">
                  <span
                    className="block h-full bg-red-600 transition-[width]"
                    style={{ width: `${progress || 3}%` }}
                  />
                </div>
                <p className="mt-2 text-right text-[9px] text-zinc-600">%{progress}</p>
              </>
            )}

            {status === "error" && (
              <>
                <StatusLine icon={<AlertTriangle />} title="Güncelleme denetlenemedi" tone="danger">
                  {error ?? "Yayın sunucusuna ulaşılamadı."}
                </StatusLine>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => void checkForUpdates(true)}
                >
                  <RefreshCw />
                  Yeniden dene
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusLine({
  icon,
  title,
  tone = "neutral",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone?: "neutral" | "success" | "accent" | "danger";
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center border [&_svg]:size-4",
          tone === "success" && "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
          tone === "accent" && "border-red-500/25 bg-red-500/10 text-red-500",
          tone === "danger" && "border-amber-500/25 bg-amber-500/10 text-amber-400",
          tone === "neutral" && "border-white/[0.08] bg-white/[0.03] text-zinc-400",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-zinc-100">{title}</p>
        <p className="mt-1 break-words text-[10px] leading-4 text-zinc-500">{children}</p>
      </div>
    </div>
  );
}
