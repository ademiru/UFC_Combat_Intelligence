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
  Trophy,
  UsersRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState } from "react";

import { useUfcData } from "@/components/providers/data-provider";
import { CommandCenter } from "@/components/features/command-center";
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
  const today = new Date().toISOString().slice(0, 10);
  const latestCompletedEvent =
    events.find((event) => event.date < today) ?? events[0];
  const nextEvent = [...events]
    .filter((event) => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const activeFights = fights.filter(
    (fight) => fight.event_id === activeEvent?.id,
  );
  const champions = fighters
    .filter((fighter) => fighter.is_champion)
    .sort((a, b) => (a.champion_order ?? 0) - (b.champion_order ?? 0));

  return (
    <div className="space-y-6">
      <section className="flex items-end justify-between">
        <div className="flex items-stretch gap-4">
          <span className="w-1 shrink-0 bg-gradient-to-b from-red-500 to-red-700 shadow-[0_0_14px_rgba(225,20,20,0.6)]" />
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-red-500 uppercase">
              <Database className="size-3" />
              {onlineMode ? "Güncel UFC Verisi" : "Yerel Veri Arşivi"}
            </div>
            <h2 className="mt-2 text-4xl font-bold tracking-[0.01em] text-white">
              Fight Center
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Yaklaşan kartlar, eşleşmeler ve güncel sıklet şampiyonları.
            </p>
          </div>
        </div>
        <div className="clip-corner-sm border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-right">
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

      <CommandCenter event={latestCompletedEvent} nextEvent={nextEvent} fights={fights} />

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
              className="group relative overflow-hidden border border-white/[0.07] bg-[#0d0f12] p-5 transition-colors hover:border-white/15"
            >
              <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-600/70 to-transparent" />
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                  {item.label}
                </p>
                <Icon className={cn("size-4", item.accent)} />
              </div>
              <p className="font-display mt-3 text-5xl leading-none font-bold tracking-tight text-white tabular-nums">
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
                      <span className={`mt-2 inline-block border px-2 py-1 text-[8px] font-black tracking-wider uppercase ${event.date < new Date().toISOString().slice(0, 10) ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400" : "border-blue-500/20 bg-blue-500/[0.06] text-blue-400"}`}>
                        {event.date < new Date().toISOString().slice(0, 10) ? "Tamamlandı" : "Yaklaşan"}
                      </span>
                    </span>
                    {fights.some(
                      (fight) => fight.event_id === event.id && fight.result,
                    ) ? (
                      <span className="shrink-0 border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-emerald-400 uppercase">
                        Sonuçlandı
                      </span>
                    ) : null}
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
          <div className="relative border-b border-red-500/15 bg-[linear-gradient(135deg,rgba(210,10,10,.05)_0_18%,transparent_18%)] p-6">
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
              {(() => {
                const decided = activeFights.filter((fight) => fight.result).length;
                return decided > 0 ? (
                  <span className="flex shrink-0 items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[9px] font-bold tracking-widest text-emerald-400 uppercase">
                    <BadgeCheck className="size-3" />
                    Sonuçlandı · {decided}/{activeFights.length}
                  </span>
                ) : (
                  <span className="shrink-0 border border-red-500/15 bg-red-500/[0.06] px-3 py-1.5 text-[9px] font-bold tracking-widest text-red-400 uppercase">
                    Main Card
                  </span>
                );
              })()}
            </div>
          </div>
          <div className="space-y-5 px-5 py-4">
            {["Main Card", "Prelims", "Early Prelims"].map((cardType) => {
              const cardFights = activeFights.filter((fight) => fight.card_type === cardType);
              if (cardFights.length === 0) return null;
              return (
                <section key={cardType}>
                  <div className="mb-1 flex items-center justify-between border-b border-white/[0.08] pb-2">
                    <h4 className="text-[10px] font-black tracking-[0.16em] text-zinc-200 uppercase">{cardType}</h4>
                    <span className="text-[8px] font-bold tracking-wider text-zinc-700 uppercase">{cardFights.length} Maç</span>
                  </div>
                  <div className="divide-y divide-white/[0.05]">
            {cardFights.map((fight, index) => {
              const f1Won = fight.result === "W";
              const f2Won = fight.result === "L";
              const decided = f1Won || f2Won;
              const outcome = fight.result
                ? [
                    fight.method,
                    fight.round ? `R${fight.round}` : null,
                    fight.fight_time,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : null;
              return (
                <div
                  key={fight.id}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-5 py-5"
                >
                  <div className="flex items-center justify-end gap-3 text-right">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "flex items-center justify-end gap-1.5 text-sm font-bold",
                          f1Won
                            ? "text-emerald-400"
                            : decided
                              ? "text-zinc-500"
                              : "text-zinc-100",
                        )}
                      >
                        {f1Won && (
                          <Trophy className="size-3 shrink-0 text-emerald-400" />
                        )}
                        <span className="truncate">{fight.fighter1_name}</span>
                      </p>
                      <p className="mt-1 truncate text-[10px] text-zinc-600">
                        {fighters.find((item) => item.id === fight.fighter1_id)?.country}
                      </p>
                    </div>
                    <FighterAvatar
                      name={fight.fighter1_name}
                      imageUrl={fight.fighter1_image_url}
                      imagePath={fight.fighter1_image_path}
                      className={cn(
                        f1Won && "ring-2 ring-emerald-500/70",
                        decided && !f1Won && "opacity-40 grayscale",
                      )}
                    />
                  </div>
                <div className="text-center">
                    {fight.result ? (
                      <>
                        <span
                          className={cn(
                            "mx-auto grid h-6 min-w-[3.5rem] place-items-center px-2 text-[9px] font-black tracking-wider uppercase",
                            decided
                              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              : "border border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
                          )}
                        >
                          {fight.result === "NC"
                            ? "NC"
                            : fight.result === "D"
                              ? "Berabere"
                              : "Galip"}
                        </span>
                        {outcome && (
                          <p className="mt-1.5 text-[8px] font-bold tracking-wider text-zinc-500 uppercase">
                            {outcome}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="mx-auto grid size-8 place-items-center rounded-full border border-white/[0.07] bg-white/[0.025]">
                          <Swords className="size-3.5 text-red-500" />
                        </span>
                        <p className="mt-1.5 text-[8px] font-black tracking-widest text-zinc-700 uppercase">
                          {cardType === "Main Card" && index === 0 ? "Main Event" : `Bout ${index + 1}`}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <FighterAvatar
                      name={fight.fighter2_name}
                      imageUrl={fight.fighter2_image_url}
                      imagePath={fight.fighter2_image_path}
                      className={cn(
                        f2Won && "ring-2 ring-emerald-500/70",
                        decided && !f2Won && "opacity-40 grayscale",
                      )}
                    />
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "flex items-center gap-1.5 text-sm font-bold",
                          f2Won
                            ? "text-emerald-400"
                            : decided
                              ? "text-zinc-500"
                              : "text-zinc-100",
                        )}
                      >
                        {f2Won && (
                          <Trophy className="size-3 shrink-0 text-emerald-400" />
                        )}
                        <span className="truncate">{fight.fighter2_name}</span>
                      </p>
                      <p className="mt-1 truncate text-[10px] text-zinc-600">
                        {fighters.find((item) => item.id === fight.fighter2_id)?.country}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
                  </div>
                </section>
              );
            })}
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
              className="clip-corner group relative border border-amber-500/15 bg-gradient-to-b from-amber-500/[0.06] to-transparent p-4 transition-colors hover:border-amber-500/35"
            >
              <FighterAvatar
                name={champion.name}
                champion
                imageUrl={champion.image_url}
                imagePath={champion.image_path}
                className="size-12"
              />
              <p className="font-display mt-3 truncate text-sm font-bold tracking-wide text-zinc-100 uppercase">
                {champion.name}
              </p>
              <p className="mt-1 truncate text-[9px] font-bold tracking-wider text-amber-500/80 uppercase">
                {champion.champion_title}
              </p>
              <p className="mt-2 font-tabular text-[10px] text-zinc-500">
                {champion.wins}-{champion.losses}-{champion.draws}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
