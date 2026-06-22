"use client";

import {
  BadgeCheck,
  BrainCircuit,
  CalendarDays,
  ChevronRight,
  Clock3,
  Crown,
  Database,
  HardDrive,
  RefreshCw,
  MapPin,
  Swords,
  UsersRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState } from "react";

import { useUfcData } from "@/components/providers/data-provider";
import { DataState } from "@/components/shared/data-state";
import { FighterAvatar } from "@/components/shared/fighter-avatar";
import { cn } from "@/lib/utils";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    weekday: "short",
  }).format(new Date(`${value}T12:00:00`));
}

function formatSyncTime(value?: string) {
  if (!value) return "Henüz canlı güncelleme yapılmadı";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Henüz canlı güncelleme yapılmadı";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function DashboardPage() {
  const {
    fighters,
    events,
    fights,
    metadata,
    loading,
    error,
    onlineMode,
    syncing,
    syncError,
    syncNow,
    refresh,
  } = useUfcData();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  if (loading || error) {
    return (
      <DataState loading={loading} error={error} onRetry={() => void refresh()} />
    );
  }

  const activeEvent =
    events.find((event) => event.id === selectedEventId) ?? events[0];
  const activeFights = fights.filter(
    (fight) => fight.event_id === activeEvent?.id,
  );
  const champions = fighters
    .filter((fighter) => fighter.is_champion)
    .sort((a, b) => (a.champion_order ?? 0) - (b.champion_order ?? 0));

  return (
    <div className="space-y-6">
      <section className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-red-500 uppercase">
            <Database className="size-3" />
            {onlineMode ? "Güncel UFC Verisi" : "Yerel Veri Arşivi"}
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white">
            Fight Center
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Yaklaşan kartlar, eşleşmeler ve güncel sıklet şampiyonları.
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-right">
          <p className="text-[9px] font-bold tracking-[0.15em] text-zinc-600 uppercase">
            Veri anlık görüntüsü
          </p>
          <p className="mt-1 text-xs font-semibold text-zinc-300">
            {metadata.last_online_sync
              ? formatSyncTime(metadata.last_online_sync)
              : metadata.dataset_snapshot ?? "—"}
          </p>
        </div>
      </section>

      <section
        className={cn(
          "flex items-center gap-4 rounded-2xl border p-4",
          syncError
            ? "border-red-500/15 bg-red-500/[0.035]"
            : onlineMode
              ? "border-emerald-500/15 bg-emerald-500/[0.025]"
              : "border-amber-500/15 bg-amber-500/[0.025]",
        )}
      >
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            syncError
              ? "bg-red-500/10 text-red-400"
              : onlineMode
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-amber-500/10 text-amber-400",
          )}
        >
          {onlineMode ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-zinc-200">
            {syncError
              ? "Canlı güncelleme başarısız — yerel veriler güvende"
              : onlineMode
                ? "Online Mod aktif — UFC.com verileri yerel önbelleğe alınıyor"
                : "Çevrimdışı Mod — doğrulanmış yerel veri anlık görüntüsü"}
          </p>
          <p className="mt-1 text-[10px] text-zinc-600">
            {syncError ??
              (onlineMode
                ? `Son başarılı güncelleme: ${formatSyncTime(metadata.last_online_sync)}`
                : "Online Mod'u sağ üstteki anahtardan açarak güncel kartları ve istatistikleri alabilirsiniz.")}
          </p>
        </div>
        {onlineMode ? (
          <button
            type="button"
            disabled={syncing}
            onClick={() => void syncNow()}
            className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[10px] font-bold text-zinc-300 transition-colors hover:bg-white/[0.05] disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} />
            {syncing ? "Güncelleniyor" : "Şimdi güncelle"}
          </button>
        ) : null}
      </section>

      <section className="grid grid-cols-3 border border-white/[0.08] bg-[#090b0d]">
        <div className="flex items-start gap-3 border-r border-white/[0.08] p-4">
          <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
          <div>
            <p className="text-[10px] font-bold tracking-wider text-zinc-300 uppercase">
              Resmî UFC verisi
            </p>
            <p className="mt-1 text-[10px] leading-4 text-zinc-600">
              Profiller, sıralamalar ve etkinlik kartları
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 border-r border-white/[0.08] p-4">
          <HardDrive className="mt-0.5 size-4 shrink-0 text-blue-400" />
          <div>
            <p className="text-[10px] font-bold tracking-wider text-zinc-300 uppercase">
              Yerel önbellek
            </p>
            <p className="mt-1 text-[10px] leading-4 text-zinc-600">
              {metadata.fighter_images_cached ?? "0"} fotoğraf · SQLite veri tabanı
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4">
          <BrainCircuit className="mt-0.5 size-4 shrink-0 text-red-400" />
          <div>
            <p className="text-[10px] font-bold tracking-wider text-zinc-300 uppercase">
              Türetilmiş analiz
            </p>
            <p className="mt-1 text-[10px] leading-4 text-zinc-600">
              H2H skorları ve kardiyo projeksiyonları model çıktısıdır
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Aktif dövüşçü",
            value: fighters.length,
            icon: UsersRound,
            accent: "text-zinc-300",
          },
          {
            label: "Yaklaşan etkinlik",
            value: events.length,
            icon: CalendarDays,
            accent: "text-red-400",
          },
          {
            label: "Sıklet şampiyonu",
            value: champions.length,
            icon: Crown,
            accent: "text-amber-400",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-2xl border border-white/[0.07] bg-[#0d0f12] p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-500">{item.label}</p>
                <Icon className={cn("size-4", item.accent)} />
              </div>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">
                {item.value}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-[0.92fr_1.7fr] gap-5">
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f12] p-4">
          <div className="flex items-center justify-between px-2 pb-4 pt-1">
            <div>
              <p className="text-sm font-bold text-zinc-100">Etkinlik takvimi</p>
              <p className="mt-1 text-[11px] text-zinc-600">
                Resmî UFC kartlarından yerel kopya
              </p>
            </div>
            <CalendarDays className="size-4 text-red-500" />
          </div>
          <div className="space-y-2">
            {events.map((event, index) => {
              const active = event.id === activeEvent?.id;
              return (
                <button
                  type="button"
                  key={event.id}
                  onClick={() => setSelectedEventId(event.id)}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-colors",
                    active
                      ? "border-red-500/20 bg-red-500/[0.07]"
                      : "border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.035]",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-lg text-xs font-black",
                        active
                          ? "bg-red-600 text-white"
                          : "bg-white/[0.04] text-zinc-500",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-zinc-200">
                        {event.name}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-600">
                        <Clock3 className="size-3" />
                        {formatDate(event.date)} · {event.start_time}
                      </span>
                    </span>
                    <ChevronRight
                      className={cn(
                        "size-4",
                        active ? "text-red-500" : "text-zinc-700",
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0f12]">
          <div className="relative border-b border-white/[0.06] bg-[radial-gradient(circle_at_90%_0%,rgba(210,10,10,0.15),transparent_40%)] p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] text-red-500 uppercase">
                  Seçili etkinlik
                </p>
                <h3 className="mt-2 text-xl font-black tracking-[-0.03em] text-white">
                  {activeEvent?.name}
                </h3>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <MapPin className="size-3.5 text-zinc-600" />
                  {activeEvent?.location}
                </p>
              </div>
              <span className="rounded-full border border-red-500/15 bg-red-500/[0.06] px-3 py-1.5 text-[9px] font-bold tracking-widest text-red-400 uppercase">
                Main Card
              </span>
            </div>
          </div>
          <div className="divide-y divide-white/[0.05] px-6">
            {activeFights.map((fight, index) => (
              <div
                key={fight.id}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-5 py-5"
              >
                <div className="flex items-center justify-end gap-3 text-right">
                  <div>
                    <p className="text-sm font-bold text-zinc-100">
                      {fight.fighter1_name}
                    </p>
                    <p className="mt-1 text-[10px] text-zinc-600">
                      {fighters.find((item) => item.id === fight.fighter1_id)?.country}
                    </p>
                  </div>
                  <FighterAvatar
                    name={fight.fighter1_name}
                    imageUrl={fight.fighter1_image_url}
                    imagePath={fight.fighter1_image_path}
                  />
                </div>
                <div className="text-center">
                  <span className="mx-auto grid size-8 place-items-center rounded-full border border-white/[0.07] bg-white/[0.025]">
                    <Swords className="size-3.5 text-red-500" />
                  </span>
                  <p className="mt-1.5 text-[8px] font-black tracking-widest text-zinc-700 uppercase">
                    {index === 0 ? "Main" : `Bout ${index + 1}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <FighterAvatar
                    name={fight.fighter2_name}
                    imageUrl={fight.fighter2_image_url}
                    imagePath={fight.fighter2_image_path}
                  />
                  <div>
                    <p className="text-sm font-bold text-zinc-100">
                      {fight.fighter2_name}
                    </p>
                    <p className="mt-1 text-[10px] text-zinc-600">
                      {fighters.find((item) => item.id === fight.fighter2_id)?.country}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#0d0f12] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-zinc-100">Güncel şampiyonlar</p>
            <p className="mt-1 text-[11px] text-zinc-600">
              {metadata.last_online_sync
                ? `Resmî UFC senkronu · ${formatSyncTime(metadata.last_online_sync)}`
                : "Doğrulanmış yerel sıralama anlık görüntüsü"}
            </p>
          </div>
          <Crown className="size-4 text-amber-400" />
        </div>
        <div className="mt-5 grid grid-cols-4 gap-3 2xl:grid-cols-6">
          {champions.map((champion) => (
            <div
              key={champion.id}
              className="rounded-xl border border-white/[0.05] bg-white/[0.018] p-4"
            >
              <FighterAvatar
                name={champion.name}
                champion
                imageUrl={champion.image_url}
                imagePath={champion.image_path}
                className="size-12"
              />
              <p className="mt-3 truncate text-xs font-bold text-zinc-200">
                {champion.name}
              </p>
              <p className="mt-1 truncate text-[9px] font-bold tracking-wider text-amber-500/70 uppercase">
                {champion.champion_title}
              </p>
              <p className="mt-2 text-[10px] text-zinc-600">
                {champion.wins}-{champion.losses}-{champion.draws}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
