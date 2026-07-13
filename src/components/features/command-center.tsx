"use client";

import { AlertTriangle, BadgeCheck, CalendarClock, ChevronRight, Clock3, MapPin, Radio, ShieldCheck, Swords, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Fight, UfcEvent } from "@/components/providers/data-provider";
import { FighterAvatar } from "@/components/shared/fighter-avatar";
import { cn } from "@/lib/utils";

function fightOutcome(fight?: Fight) {
  if (!fight?.result) return null;
  const f1Won = fight.result === "W";
  const f2Won = fight.result === "L";
  return {
    f1Won,
    f2Won,
    decided: f1Won || f2Won,
    label: fight.result === "NC" ? "NC" : fight.result === "D" ? "Berabere" : "Galip",
    detail: [fight.method, fight.round ? `R${fight.round}` : null, fight.fight_time]
      .filter(Boolean)
      .join(" · "),
  };
}

function useCountdown(event?: UfcEvent) {
  const target = useMemo(() => {
    if (!event) return 0;
    const parsed = Date.parse(`${event.date}T${event.start_time || "22:00"}`);
    return Number.isNaN(parsed) ? Date.parse(`${event.date}T22:00:00`) : parsed;
  }, [event]);
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()));
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, target - Date.now()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [target]);
  const totalSeconds = Math.floor(remaining / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function formatIstanbulTime(event: UfcEvent) {
  const match = event.start_time.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?\s*([A-Z]{2,5})/i);
  if (!match) return `${event.date} · ${event.start_time}`;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  const offsets: Record<string, number> = { EDT: -4, EST: -5, CDT: -5, CST: -6, PDT: -7, PST: -8, SAST: 2, BST: 1, GMT: 0, UTC: 0, CET: 1, CEST: 2, JST: 9, AEST: 10, AEDT: 11 };
  const offset = offsets[match[4].toUpperCase()];
  if (offset === undefined) return `${event.date} · ${event.start_time}`;
  const [year, month, day] = event.date.split("-").map(Number);
  const instant = new Date(Date.UTC(year, month - 1, day, hour - offset, minute));
  return new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }).format(instant);
}

export function CommandCenter({ event, nextEvent, fights }: { event?: UfcEvent; nextEvent?: UfcEvent; fights: Fight[] }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const countdown = useCountdown(event);
  const eventFights = fights
    .filter((fight) => fight.event_id === event?.id)
    .sort((a, b) => a.bout_order - b.bout_order);
  const mainEvent = eventFights.find((fight) => fight.card_type === "Main Card" && fight.bout_order === 1) ?? eventFights[0];
  const cardGroups = ["Main Card", "Prelims", "Early Prelims"]
    .map((name) => ({ name, fights: eventFights.filter((fight) => fight.card_type === name) }))
    .filter((group) => group.fights.length > 0);
  const nextEventFights = fights.filter((fight) => fight.event_id === nextEvent?.id).sort((a, b) => a.bout_order - b.bout_order);
  const nextMainEvent = nextEventFights.find((fight) => fight.card_type === "Main Card" && fight.bout_order === 1) ?? nextEventFights[0];
  const publishedResults = eventFights.filter((fight) => fight.result).length;

  useEffect(() => {
    if (!detailsOpen) return;
    const onKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") setDetailsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailsOpen]);

  return (
    <>
    <section className="grid grid-cols-[1.6fr_0.8fr] gap-5">
      <article
        role="button"
        tabIndex={0}
        onClick={() => event && setDetailsOpen(true)}
        onKeyDown={(keyboardEvent) => {
          if ((keyboardEvent.key === "Enter" || keyboardEvent.key === " ") && event) setDetailsOpen(true);
        }}
        className="clip-corner group relative cursor-pointer overflow-hidden border border-red-500/25 bg-[linear-gradient(135deg,rgba(220,38,38,.055)_0_18%,transparent_18%_100%),#0c0e11] p-7 shadow-[inset_0_1px_rgba(255,255,255,.04),0_0_26px_-20px_rgba(239,68,68,.7),6px_6px_0_rgba(0,0,0,.3)] transition hover:border-red-500/50 hover:shadow-[inset_0_1px_rgba(255,255,255,.05),0_0_30px_-18px_rgba(239,68,68,.75),6px_6px_0_rgba(0,0,0,.3)]"
      >
        <span className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-red-500 to-red-700" />
        <div className="absolute right-6 top-5 text-[9px] font-bold tracking-[0.18em] text-red-400 uppercase">Latest Fight Card // Intel</div>
        <p className="flex items-center gap-2 text-[9px] font-bold tracking-[0.18em] text-zinc-500 uppercase"><CalendarClock className="size-3.5 text-red-500" /> En son dövüş kartı</p>
        <h3 className="mt-4 max-w-2xl text-3xl font-black tracking-[-0.05em] text-white">{event?.name ?? "Etkinlik bekleniyor"}</h3>
        <p className="mt-2 flex items-center gap-2 text-[10px] text-zinc-500"><MapPin className="size-3" /> {event?.location ?? "—"} · {event?.date ?? "—"} · {event?.start_time ?? "—"} TSİ</p>
        {mainEvent ? (() => {
          const o = fightOutcome(mainEvent);
          return (
            <div className={cn("mt-7 flex items-center gap-4 border-l-2 pl-5", o?.decided ? "border-emerald-500" : "border-red-500")}>
              <FighterAvatar name={mainEvent.fighter1_name} imageUrl={mainEvent.fighter1_image_url} imagePath={mainEvent.fighter1_image_path} className={cn("size-12", o?.f1Won && "ring-2 ring-emerald-500/70", o?.decided && !o.f1Won && "opacity-40 grayscale")} />
              <div className="min-w-0">
                <p className={cn("text-[9px] font-bold uppercase", o?.decided ? "text-emerald-500" : "text-red-500")}>{o?.decided ? "Main Event · Sonuçlandı" : "Main Event"}</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-black text-white">
                  <span className={cn("flex items-center gap-1", o?.f1Won && "text-emerald-400", o?.decided && !o.f1Won && "text-zinc-500")}>{o?.f1Won && <Trophy className="size-3 shrink-0 text-emerald-400" />}{mainEvent.fighter1_name}</span>
                  <span className="text-zinc-700">VS</span>
                  <span className={cn("flex items-center gap-1", o?.f2Won && "text-emerald-400", o?.decided && !o.f2Won && "text-zinc-500")}>{mainEvent.fighter2_name}{o?.f2Won && <Trophy className="size-3 shrink-0 text-emerald-400" />}</span>
                </p>
                {o?.detail ? <p className="mt-1 text-[9px] font-bold tracking-wider text-emerald-400/80 uppercase">{o.detail}</p> : null}
              </div>
              <FighterAvatar name={mainEvent.fighter2_name} imageUrl={mainEvent.fighter2_image_url} imagePath={mainEvent.fighter2_image_path} className={cn("size-12", o?.f2Won && "ring-2 ring-emerald-500/70", o?.decided && !o.f2Won && "opacity-40 grayscale")} />
            </div>
          );
        })() : null}
        {publishedResults > 0 ? (
          <div className="mt-7 flex items-center gap-3 border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3.5">
            <BadgeCheck className="size-6 shrink-0 text-emerald-400" />
            <div>
              <p className="font-display text-base leading-none font-bold tracking-wide text-emerald-400 uppercase">Etkinlik Sonuçlandı</p>
              <p className="mt-1.5 text-[10px] text-zinc-400">{publishedResults}/{eventFights.length} maçın resmî sonucu yayınlandı · detaylar için karta tıklayın</p>
            </div>
          </div>
        ) : (
          <div className="mt-7 flex gap-2">{Object.entries(countdown).map(([label, value]) => <div key={label} className="relative min-w-20 overflow-hidden border border-white/[0.08] bg-black/40 px-4 py-3 text-center"><span className="absolute inset-x-0 top-0 h-px bg-red-600/50" /><p className="font-display text-3xl leading-none font-bold tabular-nums text-white">{String(value).padStart(2,"0")}</p><p className="mt-1.5 text-[8px] font-bold tracking-widest text-zinc-600 uppercase">{{days:"Gün",hours:"Saat",minutes:"Dakika",seconds:"Saniye"}[label]}</p></div>)}</div>
        )}
        <div className="absolute bottom-7 right-7 flex items-center gap-2 text-[9px] font-bold tracking-wider text-zinc-500 uppercase transition group-hover:text-red-400">Kart detaylarını aç <ChevronRight className="size-3.5" /></div>
      </article>
      <article className="border border-white/[0.08] bg-[#0d0f12] p-5">
        <div className="flex items-center justify-between"><div><p className="flex items-center gap-2 text-[10px] font-bold text-white"><Radio className="size-3.5 text-red-500"/> İstihbarat Akışı</p><p className="mt-1 text-[9px] text-zinc-600">Son 24–48 saat · doğrulanmış kaynaklar</p></div><span className="size-2 animate-pulse bg-emerald-500"/></div>
        <div className="mt-5 border border-dashed border-white/[0.09] px-4 py-7 text-center"><ShieldCheck className="mx-auto size-6 text-emerald-500/60"/><p className="mt-3 text-xs font-bold text-zinc-300">Kırmızı Kod bulunmuyor</p><p className="mt-2 text-[9px] leading-4 text-zinc-600">Mevcut UFC senkronunda sakatlık ve tartı ihlali akışı bulunmuyor. Doğrulanmamış bildirim üretilmedi.</p></div>
        <p className="mt-4 flex items-center gap-2 text-[9px] text-amber-500/70"><AlertTriangle className="size-3"/> Haber kaynağı entegrasyonu gerekli</p>
      </article>
    </section>

    {nextEvent ? <section className="border border-blue-500/15 bg-[linear-gradient(110deg,rgba(37,99,235,.08),transparent_45%),#0d0f12] p-6">
      <div className="grid grid-cols-[0.85fr_1.15fr] gap-8">
        <div><p className="text-[9px] font-bold tracking-[0.18em] text-blue-400 uppercase">Next Operation · Türkiye Saati</p><h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">{nextEvent.name}</h3><p className="mt-3 flex items-center gap-2 text-xs font-bold capitalize text-zinc-300"><CalendarClock className="size-4 text-blue-400" />{formatIstanbulTime(nextEvent)} TSİ</p><p className="mt-2 flex items-center gap-2 text-[10px] text-zinc-600"><MapPin className="size-3.5" />{nextEvent.location}</p>{nextMainEvent ? <div className="mt-5 border-l-2 border-blue-500 pl-4"><p className="text-[8px] font-bold tracking-wider text-blue-400 uppercase">Beklenen Ana Maç</p><p className="mt-1 text-sm font-black text-white">{nextMainEvent.fighter1_name} <span className="mx-2 text-zinc-700">VS</span> {nextMainEvent.fighter2_name}</p></div> : null}</div>
        <div><div className="flex items-center justify-between"><p className="text-[10px] font-bold text-zinc-300">Açıklanan kart</p><span className="text-[9px] text-zinc-600">{nextEventFights.length} maç</span></div><div className="mt-3 grid grid-cols-2 gap-2">{nextEventFights.slice(0, 6).map((fight) => <div key={fight.id} className="flex items-center justify-between border border-white/[0.06] bg-black/20 px-3 py-2.5 text-[9px]"><span className="max-w-28 truncate font-bold text-zinc-300">{fight.fighter1_name}</span><span className="mx-2 text-blue-500">VS</span><span className="max-w-28 truncate text-right font-bold text-zinc-300">{fight.fighter2_name}</span></div>)}</div></div>
      </div>
    </section> : null}

    {detailsOpen && event ? (
      <div className="fixed inset-0 z-[120] bg-black/80 p-6 backdrop-blur-md" onMouseDown={() => setDetailsOpen(false)}>
        <section className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden border border-white/[0.12] bg-[#080a0c] shadow-2xl" onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}>
          <header className="relative border-b border-red-500/20 bg-[linear-gradient(135deg,rgba(220,38,38,.06)_0_22%,transparent_22%),#0d0f12] px-8 py-7">
            <button type="button" onClick={() => setDetailsOpen(false)} aria-label="Etkinlik detaylarını kapat" className="absolute right-6 top-6 grid size-10 place-items-center border border-white/[0.08] text-zinc-500 hover:border-red-500/30 hover:text-white"><X className="size-4" /></button>
            <p className="flex items-center gap-2 text-[9px] font-bold tracking-[0.18em] text-red-500 uppercase"><Swords className="size-3.5" /> Event Operations File</p>
            <h2 className="mt-3 pr-16 text-3xl font-black tracking-[-0.05em] text-white">{event.name}</h2>
            <div className="mt-3 flex items-center gap-5 text-[10px] text-zinc-500"><span className="flex items-center gap-2"><CalendarClock className="size-3.5" />{event.date}</span><span className="flex items-center gap-2"><Clock3 className="size-3.5" />{event.start_time} TSİ</span><span className="flex items-center gap-2"><MapPin className="size-3.5" />{event.location}</span><span className="border border-white/[0.08] px-2.5 py-1 font-bold text-zinc-400">{eventFights.length} MAÇ</span></div>
            <div className={`mt-4 inline-flex items-center gap-2 border px-3 py-2 text-[9px] font-bold ${publishedResults > 0 ? "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-400" : "border-amber-500/20 bg-amber-500/[0.05] text-amber-400"}`}><span className={`size-1.5 ${publishedResults > 0 ? "bg-emerald-500" : "animate-pulse bg-amber-400"}`} />{publishedResults > 0 ? `${publishedResults}/${eventFights.length} resmî sonuç yayınlandı` : "UFC resmî sonuçları bekleniyor · 60 saniyede bir kontrol ediliyor"}</div>
          </header>

          <div className="flex-1 overflow-y-auto px-8 py-7">
            {mainEvent ? (() => { const mo = fightOutcome(mainEvent); return <article className={cn("mb-8 grid grid-cols-[1fr_auto_1fr] items-center gap-7 border p-6", mo?.decided ? "border-emerald-500/25 bg-emerald-500/[0.04]" : "border-red-500/20 bg-red-500/[0.035]")}>
              <div className="flex items-center justify-end gap-4 text-right"><div><p className={cn("flex items-center justify-end gap-2 text-lg font-black", mo?.f1Won ? "text-emerald-400" : mo?.decided ? "text-zinc-500" : "text-white")}>{mo?.f1Won && <Trophy className="size-4 shrink-0 text-emerald-400" />}{mainEvent.fighter1_name}</p><p className="mt-1 text-[9px] text-zinc-600">{mainEvent.weight_class}</p></div><FighterAvatar name={mainEvent.fighter1_name} imageUrl={mainEvent.fighter1_image_url} imagePath={mainEvent.fighter1_image_path} className={cn("size-16", mo?.f1Won && "ring-2 ring-emerald-500/70", mo?.decided && !mo.f1Won && "opacity-40 grayscale")} /></div>
              <div className="text-center"><p className={cn("text-[8px] font-bold tracking-[0.2em] uppercase", mo?.decided ? "text-emerald-500" : "text-red-500")}>{mo?.decided ? mo.label : "Main Event"}</p><span className={cn("mt-2 grid size-10 place-items-center border", mo?.decided ? "border-emerald-500/25 bg-emerald-500/10" : "border-red-500/25 bg-red-500/10")}>{mo?.decided ? <Trophy className="size-4 text-emerald-400" /> : <Swords className="size-4 text-red-500" />}</span>{mo?.detail ? <p className="mt-2 text-[8px] font-bold tracking-wider text-emerald-400/80 uppercase">{mo.detail}</p> : null}</div>
              <div className="flex items-center gap-4"><FighterAvatar name={mainEvent.fighter2_name} imageUrl={mainEvent.fighter2_image_url} imagePath={mainEvent.fighter2_image_path} className={cn("size-16", mo?.f2Won && "ring-2 ring-emerald-500/70", mo?.decided && !mo.f2Won && "opacity-40 grayscale")} /><div><p className={cn("flex items-center gap-2 text-lg font-black", mo?.f2Won ? "text-emerald-400" : mo?.decided ? "text-zinc-500" : "text-white")}>{mo?.f2Won && <Trophy className="size-4 shrink-0 text-emerald-400" />}{mainEvent.fighter2_name}</p><p className="mt-1 text-[9px] text-zinc-600">{mainEvent.weight_class}</p></div></div>
            </article>; })() : null}

            <div className="space-y-7">{cardGroups.map((group) => <section key={group.name}>
              <div className="mb-3 flex items-center justify-between border-b border-white/[0.07] pb-3"><h3 className="text-xs font-black tracking-[0.14em] text-white uppercase">{group.name}</h3><span className="text-[9px] text-zinc-700">{group.fights.length} eşleşme</span></div>
              <div className="grid grid-cols-2 gap-3">{group.fights.map((fight, index) => {
                const o = fightOutcome(fight);
                return (
                <article key={fight.id} className={cn("grid grid-cols-[1fr_auto_1fr] items-center gap-3 border p-4", o?.decided ? "border-emerald-500/20 bg-emerald-500/[0.03]" : "border-white/[0.07] bg-white/[0.018]")}>
                <div className="flex min-w-0 items-center justify-end gap-3 text-right"><div className="min-w-0"><p className={cn("flex items-center justify-end gap-1 text-[11px] font-bold", o?.f1Won ? "text-emerald-400" : o?.decided ? "text-zinc-500" : "text-zinc-200")}>{o?.f1Won && <Trophy className="size-2.5 shrink-0 text-emerald-400" />}<span className="truncate">{fight.fighter1_name}</span></p></div><FighterAvatar name={fight.fighter1_name} imageUrl={fight.fighter1_image_url} imagePath={fight.fighter1_image_path} className={cn("size-9", o?.f1Won && "ring-2 ring-emerald-500/70", o?.decided && !o.f1Won && "opacity-40 grayscale")} /></div>
                <div className="text-center">{o ? <span className={cn("inline-block px-1.5 py-0.5 text-[7px] font-black tracking-wider uppercase", o.decided ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border border-zinc-500/30 text-zinc-400")}>{o.label}</span> : <p className="text-[8px] font-black text-red-500">VS</p>}<p className="mt-1 text-[7px] text-zinc-700">{String(index + 1).padStart(2,"0")}</p></div>
                <div className="flex min-w-0 items-center gap-3"><FighterAvatar name={fight.fighter2_name} imageUrl={fight.fighter2_image_url} imagePath={fight.fighter2_image_path} className={cn("size-9", o?.f2Won && "ring-2 ring-emerald-500/70", o?.decided && !o.f2Won && "opacity-40 grayscale")} /><div className="min-w-0"><p className={cn("flex items-center gap-1 text-[11px] font-bold", o?.f2Won ? "text-emerald-400" : o?.decided ? "text-zinc-500" : "text-zinc-200")}>{o?.f2Won && <Trophy className="size-2.5 shrink-0 text-emerald-400" />}<span className="truncate">{fight.fighter2_name}</span></p></div></div>
                <p className="col-span-3 border-t border-white/[0.05] pt-2 text-center text-[8px] font-bold tracking-wider text-zinc-600 uppercase">{o?.detail ? o.detail : fight.weight_class}</p>
              </article>
                );
              })}</div>
            </section>)}</div>
          </div>
        </section>
      </div>
    ) : null}
    </>
  );
}
