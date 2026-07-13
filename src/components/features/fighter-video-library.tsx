"use client";

import { invoke } from "@tauri-apps/api/core";
import Hls from "hls.js";
import { Check, Clapperboard, LoaderCircle, Play, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface FighterVideo {
  id: number;
  fighterId: number;
  ufcNodeId: number;
  dveId: number;
  title: string;
  thumbnailUrl: string | null;
  sourceUrl: string;
}

interface VideoPlayback {
  hlsUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
}

interface FighterVideoLibraryProps {
  fighterId: number;
  fighterName: string;
  sourceUrl: string;
}

function formatDuration(value: number | null) {
  if (!value || value < 1) return null;
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function FighterVideoLibrary({
  fighterId,
  fighterName,
  sourceUrl,
}: FighterVideoLibraryProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestId = useRef(0);
  const playbackRequestId = useRef(0);
  const [videos, setVideos] = useState<FighterVideo[]>([]);
  const [selected, setSelected] = useState<FighterVideo | null>(null);
  const [playback, setPlayback] = useState<VideoPlayback | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setCatalogLoading(true);
    playbackRequestId.current += 1;
    setCatalogError(null);
    setPlayback(null);
    setPlaybackError(null);

    try {
      const result = await invoke<FighterVideo[]>("sync_fighter_videos", {
        fighterId,
        sourceUrl,
      });
      if (currentRequest !== requestId.current) return;
      setVideos(result);
      setSelected(result[0] ?? null);
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setVideos([]);
      setSelected(null);
      setCatalogError(messageFrom(error));
    } finally {
      if (currentRequest === requestId.current) setCatalogLoading(false);
    }
  }, [fighterId, sourceUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCatalog(), 0);
    return () => {
      window.clearTimeout(timer);
      requestId.current += 1;
    };
  }, [loadCatalog]);

  useEffect(() => {
    if (!playback?.hlsUrl || !videoRef.current) return;
    const video = videoRef.current;
    let hls: Hls | null = null;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = playback.hlsUrl;
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        startLevel: -1,
      });
      hls.loadSource(playback.hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls?.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls?.recoverMediaError();
        } else {
          hls?.destroy();
        }
      });
    }

    return () => {
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [playback]);

  const playVideo = async (video: FighterVideo) => {
    const currentRequest = ++playbackRequestId.current;
    setSelected(video);
    setPlayback(null);
    setPlaybackError(null);
    setPlaybackLoading(true);

    try {
      const result = await invoke<VideoPlayback>("resolve_fighter_video", {
        dveId: video.dveId,
      });
      if (currentRequest !== playbackRequestId.current) return;
      setPlayback(result);
      window.setTimeout(() => void videoRef.current?.play().catch(() => undefined), 80);
    } catch (error) {
      if (currentRequest !== playbackRequestId.current) return;
      setPlaybackError(messageFrom(error));
    } finally {
      if (currentRequest === playbackRequestId.current) setPlaybackLoading(false);
    }
  };

  const poster = playback?.thumbnailUrl ?? selected?.thumbnailUrl ?? undefined;

  return (
    <section className="overflow-hidden border border-white/[0.08] bg-[#090b0e]">
      <header className="flex min-h-16 items-center justify-between border-b border-white/[0.07] bg-[linear-gradient(90deg,rgba(239,68,68,.055),transparent_34%)] px-5">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center border border-red-500/30 bg-red-500/[0.07] text-red-500">
            <Clapperboard className="size-4" />
          </div>
          <div>
            <p className="text-[9px] font-black tracking-[0.2em] text-red-500 uppercase">
              Fighter Film Room
            </p>
            <h3 className="mt-1 text-sm font-black text-white">
              {fighterName} · Resmî video arşivi
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 text-[9px] font-bold tracking-wider text-emerald-500/75 uppercase xl:flex">
            <ShieldCheck className="size-3.5" />
            UFC kaynağı · katalog yerelde
          </div>
          <button
            type="button"
            onClick={() => void loadCatalog()}
            disabled={catalogLoading}
            className="group flex h-9 items-center gap-2 border border-white/[0.1] bg-white/[0.025] px-3 text-[9px] font-black tracking-[0.12em] text-zinc-400 uppercase transition-colors hover:border-red-500/45 hover:text-white disabled:cursor-wait disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 transition-transform duration-500 group-hover:rotate-180 ${catalogLoading ? "animate-spin" : ""}`} />
            Arşivi yenile
          </button>
        </div>
      </header>

      <div className="grid min-h-[360px] grid-cols-[minmax(0,1.45fr)_minmax(290px,.55fr)] max-xl:grid-cols-1">
        <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden border-r border-white/[0.07] bg-black max-xl:border-r-0 max-xl:border-b">
          {poster && !playback ? (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-45 blur-[1px]"
              style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.12),rgba(0,0,0,.8)),url(${JSON.stringify(poster).slice(1, -1)})` }}
            />
          ) : null}

          {playback ? (
            <video
              ref={videoRef}
              className="absolute inset-0 size-full bg-black object-contain"
              controls
              playsInline
              poster={poster}
            />
          ) : selected ? (
            <button
              type="button"
              onClick={() => void playVideo(selected)}
              disabled={playbackLoading}
              className="group relative z-10 grid size-20 place-items-center border border-white/20 bg-black/70 text-white shadow-[0_0_0_8px_rgba(255,255,255,.025)] transition-all hover:border-red-500 hover:bg-red-600 disabled:cursor-wait"
              aria-label={`${selected.title} videosunu oynat`}
            >
              {playbackLoading ? (
                <LoaderCircle className="size-7 animate-spin" />
              ) : (
                <Play className="ml-1 size-7 fill-current transition-transform group-hover:scale-110" />
              )}
            </button>
          ) : (
            <div className="relative z-10 max-w-md px-8 text-center">
              {catalogLoading ? (
                <LoaderCircle className="mx-auto size-7 animate-spin text-red-500" />
              ) : (
                <Clapperboard className="mx-auto size-7 text-zinc-700" />
              )}
              <p className="mt-4 text-sm font-black text-zinc-300">
                {catalogLoading ? "Resmî UFC arşivi taranıyor" : "Bu profil için video bulunamadı"}
              </p>
              <p className="mt-2 text-[10px] leading-5 text-zinc-600">
                {catalogLoading
                  ? "Tanıtım, röportaj ve öne çıkanlar dövüşçüyle eşleştiriliyor."
                  : "UFC profilinde yayımlanmış bir video olduğunda burada otomatik görünecek."}
              </p>
            </div>
          )}

          {selected && !playback ? (
            <div className="absolute inset-x-0 bottom-0 z-10 border-t border-white/[0.08] bg-black/80 px-5 py-4 backdrop-blur-sm">
              <p className="text-[9px] font-black tracking-[0.16em] text-red-500 uppercase">Seçili kayıt</p>
              <p className="mt-1 line-clamp-1 text-sm font-bold text-white">{selected.title}</p>
            </div>
          ) : null}

          {playbackError ? (
            <div className="absolute inset-x-4 bottom-4 z-20 border border-red-500/30 bg-[#19090b]/95 px-4 py-3 text-[10px] text-red-300">
              {playbackError}
            </div>
          ) : null}
        </div>

        <aside className="flex min-h-0 flex-col bg-[#0c0e11]">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
            <p className="text-[9px] font-black tracking-[0.16em] text-zinc-500 uppercase">Video dizini</p>
            <span className="text-[9px] font-bold text-zinc-700">{videos.length.toString().padStart(2, "0")} KAYIT</span>
          </div>
          <div className="max-h-[360px] flex-1 overflow-y-auto">
            {videos.map((video, index) => {
              const isSelected = selected?.id === video.id;
              return (
                <button
                  type="button"
                  key={video.id}
                  onClick={() => void playVideo(video)}
                  className={`group grid w-full grid-cols-[72px_1fr_auto] items-center gap-3 border-b px-3 py-3 text-left transition-colors ${
                    isSelected
                      ? "border-red-500/25 bg-red-500/[0.07]"
                      : "border-white/[0.05] hover:bg-white/[0.035]"
                  }`}
                >
                  <div
                    className="relative aspect-video overflow-hidden border border-white/[0.08] bg-black bg-cover bg-center"
                    style={video.thumbnailUrl ? { backgroundImage: `url(${JSON.stringify(video.thumbnailUrl).slice(1, -1)})` } : undefined}
                  >
                    <span className="absolute inset-0 grid place-items-center bg-black/25 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="size-4 fill-current" />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className={`line-clamp-2 text-[10px] font-bold leading-4 ${isSelected ? "text-white" : "text-zinc-400"}`}>
                      {video.title}
                    </p>
                    <p className="mt-1 text-[8px] font-bold tracking-wider text-zinc-700 uppercase">UFC · #{index + 1}</p>
                  </div>
                  {isSelected ? <Check className="size-3.5 text-red-500" /> : null}
                </button>
              );
            })}
          </div>
          <div className="mt-auto flex h-10 shrink-0 items-center justify-between border-t border-white/[0.06] px-4 text-[8px] font-bold tracking-wider text-zinc-700 uppercase">
            <span>Yerel oynatıcı · HLS</span>
            {playback?.duration ? <span>{formatDuration(playback.duration)}</span> : <span>Resmî yayın</span>}
          </div>
          {catalogError ? (
            <div className="border-t border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 text-[9px] leading-4 text-amber-500/80">
              {catalogError}
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
