"use client";

import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "current"
  | "error";

const LAST_UPDATE_CHECK_KEY = "ufc-panel:last-update-check";
const AUTO_CHECK_INTERVAL = 24 * 60 * 60 * 1000;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function UpdateControl() {
  const updateRef = useRef<Update | null>(null);
  const autoCheckStarted = useRef(false);
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [isOpen, setIsOpen] = useState(false);
  const [currentVersion, setCurrentVersion] = useState("0.1.0");
  const [nextVersion, setNextVersion] = useState<string>();
  const [releaseNotes, setReleaseNotes] = useState<string>();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();

  const checkForUpdates = useCallback(async (showResult = true) => {
    if (!isTauri()) return;

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
      setIsOpen(true);
    } catch (caught) {
      if (!showResult) {
        setStatus("idle");
        return;
      }

      setError(errorMessage(caught));
      setStatus("error");
    }
  }, []);

  const installUpdate = useCallback(async () => {
    const update = updateRef.current;
    if (!update) return;

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
    }
  }, []);

  useEffect(() => {
    if (!isTauri()) return;

    void getVersion().then(setCurrentVersion).catch(() => undefined);

    if (autoCheckStarted.current) return;
    autoCheckStarted.current = true;

    const lastCheck = Number(localStorage.getItem(LAST_UPDATE_CHECK_KEY) ?? 0);
    if (Date.now() - lastCheck < AUTO_CHECK_INTERVAL) return;

    const timer = window.setTimeout(() => void checkForUpdates(false), 3500);
    return () => window.clearTimeout(timer);
  }, [checkForUpdates]);

  const busy = status === "checking" || status === "downloading";
  const hasUpdate = status === "available" || status === "downloading";

  return (
    <div className="relative">
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
        <div className="absolute top-14 right-0 z-50 w-[380px] border border-white/[0.12] bg-[#0b0d10] p-4 shadow-2xl shadow-black/70">
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] text-red-500 uppercase">
                Uygulama Güncellemesi
              </p>
              <p className="mt-1 text-[10px] text-zinc-600">Yüklü sürüm v{currentVersion}</p>
            </div>
            <button
              type="button"
              className="grid size-7 place-items-center border border-white/[0.08] text-zinc-600 hover:text-zinc-200"
              onClick={() => setIsOpen(false)}
              aria-label="Güncelleme penceresini kapat"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="pt-4">
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
                <StatusLine icon={<Download />} title={`v${nextVersion} kullanıma hazır`} tone="accent">
                  Paket imzası indirme sırasında otomatik doğrulanır.
                </StatusLine>
                {releaseNotes && (
                  <p className="mt-3 max-h-24 overflow-y-auto border-l-2 border-red-500/50 pl-3 text-[10px] leading-4 whitespace-pre-line text-zinc-500">
                    {releaseNotes}
                  </p>
                )}
                <Button className="mt-4 w-full" onClick={() => void installUpdate()}>
                  <Download />
                  İndir, doğrula ve kur
                </Button>
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
