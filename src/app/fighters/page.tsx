"use client";

import {
  Crown,
  Filter,
  Search,
  SlidersHorizontal,
  Trophy,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";

import {
  type FightHistory,
  useUfcData,
} from "@/components/providers/data-provider";
import { DataState } from "@/components/shared/data-state";
import { FighterAvatar } from "@/components/shared/fighter-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const selectClassName =
  "h-10 rounded-lg border border-white/[0.07] bg-[#111317] px-3 text-xs font-medium text-zinc-300 outline-none transition-colors focus:border-red-500/40";

function RecentForm({ fights }: { fights: FightHistory[] }) {
  if (fights.length === 0) {
    return <span className="text-[10px] text-zinc-700">Veri yok</span>;
  }
  return (
    <div className="flex gap-1" aria-label="Son maç formu">
      {fights.slice(0, 5).map((fight) => (
        <span
          key={fight.id}
          title={`${fight.opponent_name} · ${fight.method}`}
          className={cn(
            "grid size-5 place-items-center border text-[9px] font-black",
            fight.result === "W"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : fight.result === "L"
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
          )}
        >
          {fight.result}
        </span>
      ))}
    </div>
  );
}

export default function FightersPage() {
  const { fighters, fightHistory, loading, error, refresh } = useUfcData();
  const [search, setSearch] = useState("");
  const [weightClass, setWeightClass] = useState("all");
  const [style, setStyle] = useState("all");
  const [minStreak, setMinStreak] = useState("0");
  const [tacticalFilter, setTacticalFilter] = useState<"all" | "ko3" | "td80" | "fast">("all");

  const weightClasses = useMemo(
    () => [...new Set(fighters.map((fighter) => fighter.weight_class))],
    [fighters],
  );
  const styles = useMemo(
    () => [...new Set(fighters.map((fighter) => fighter.style))],
    [fighters],
  );

  const filteredFighters = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("tr-TR");
    return fighters.filter((fighter) => {
      const matchesSearch =
        !needle ||
        fighter.name.toLocaleLowerCase("tr-TR").includes(needle) ||
        fighter.nickname?.toLocaleLowerCase("tr-TR").includes(needle) ||
        (fighter.country ?? "").toLocaleLowerCase("tr-TR").includes(needle);

      return (
        matchesSearch &&
        (weightClass === "all" || fighter.weight_class === weightClass) &&
        (style === "all" || fighter.style === style) &&
        fighter.win_streak >= Number(minStreak) &&
        (tacticalFilter === "all" ||
          (tacticalFilter === "td80" && fighter.td_def >= 0.8) ||
          (tacticalFilter === "ko3" && fightHistory.filter((fight) => fight.fighter_id === fighter.id).slice(0, 3).length === 3 && fightHistory.filter((fight) => fight.fighter_id === fighter.id).slice(0, 3).every((fight) => fight.result === "W" && /KO|TKO/i.test(fight.method))) ||
          (tacticalFilter === "fast" && fightHistory.filter((fight) => fight.fighter_id === fighter.id).length > 0 && fightHistory.filter((fight) => fight.fighter_id === fighter.id).every((fight) => fight.round === 1)))
      );
    });
  }, [fighters, fightHistory, minStreak, search, style, tacticalFilter, weightClass]);

  if (loading || error) {
    return (
      <DataState loading={loading} error={error} onRetry={() => void refresh()} />
    );
  }

  const hasFilters =
    search || weightClass !== "all" || style !== "all" || minStreak !== "0" || tacticalFilter !== "all";

  function clearFilters() {
    setSearch("");
    setWeightClass("all");
    setStyle("all");
    setMinStreak("0");
    setTacticalFilter("all");
  }

  return (
    <div className="space-y-6">
      <section className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] text-red-500 uppercase">
            Fighter Explorer
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white">
            Dövüşçü veritabanı
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            {fighters.length} aktif sporcu · tamamı yerel SQLite üzerinde
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
          <Trophy className="size-4 text-amber-400" />
          <span className="text-xs font-semibold text-zinc-300">
            {fighters.filter((fighter) => fighter.is_champion).length} şampiyon
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#0d0f12] p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-white/[0.05] pb-4">
          <span className="mr-2 text-[9px] font-bold tracking-[0.14em] text-red-500 uppercase">Taktiksel Filtreler</span>
          {[
            ["all", "Tüm Kadro"],
            ["ko3", "Son 3: KO/TKO"],
            ["td80", "TD Savunma ≥ %80"],
            ["fast", "Ortalama < 1 Round"],
          ].map(([value, label]) => <button key={value} type="button" onClick={() => setTacticalFilter(value as typeof tacticalFilter)} className={`border px-3 py-2 text-[9px] font-bold transition ${tacticalFilter === value ? "border-red-500/35 bg-red-500/10 text-red-400" : "border-white/[0.07] text-zinc-600 hover:text-zinc-300"}`}>{label}</button>)}
        </div>
        <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.65fr_auto] gap-3">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="İsim, lakap veya ülke ara..."
              className="h-10 w-full rounded-lg border border-white/[0.07] bg-[#111317] pl-10 pr-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-red-500/40"
            />
          </label>
          <select
            aria-label="Sıklet"
            value={weightClass}
            onChange={(event) => setWeightClass(event.target.value)}
            className={selectClassName}
          >
            <option value="all">Tüm sıkletler</option>
            {weightClasses.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            aria-label="Dövüş stili"
            value={style}
            onChange={(event) => setStyle(event.target.value)}
            className={selectClassName}
          >
            <option value="all">Tüm stiller</option>
            {styles.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            aria-label="Minimum galibiyet serisi"
            value={minStreak}
            onChange={(event) => setMinStreak(event.target.value)}
            className={selectClassName}
          >
            <option value="0">Tüm seriler</option>
            <option value="3">3+ seri</option>
            <option value="5">5+ seri</option>
            <option value="8">8+ seri</option>
          </select>
          <Button
            variant="outline"
            size="icon"
            disabled={!hasFilters}
            onClick={clearFilters}
            title="Filtreleri temizle"
          >
            <X />
          </Button>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-4">
          <p className="flex items-center gap-2 text-[11px] text-zinc-600">
            <Filter className="size-3.5" />
            {filteredFighters.length} sonuç anında eşleşti
          </p>
          <p className="flex items-center gap-2 text-[10px] text-zinc-700">
            <SlidersHorizontal className="size-3" />
            Arama ve filtreler cihaz içinde çalışır
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0f12]">
        <div className="grid grid-cols-[1.7fr_1fr_0.75fr_0.85fr_0.65fr_0.65fr_0.65fr] gap-4 border-b border-white/[0.06] bg-white/[0.015] px-6 py-3 text-[9px] font-bold tracking-[0.14em] text-zinc-600 uppercase">
          <span>Dövüşçü</span>
          <span>Sıklet / Stil</span>
          <span>Rekor</span>
          <span>Son 5</span>
          <span>Vuruş / dk</span>
          <span>Takedown sav.</span>
          <span>Uzanma</span>
        </div>
        <div className="max-h-[620px] divide-y divide-white/[0.045] overflow-y-auto">
          {filteredFighters.map((fighter) => (
            <Link
              href={`/analytics?fighter=${fighter.id}`}
              key={fighter.id}
              className="grid grid-cols-[1.7fr_1fr_0.75fr_0.85fr_0.65fr_0.65fr_0.65fr] items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.018]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FighterAvatar
                  name={fighter.name}
                  champion={Boolean(fighter.is_champion)}
                  imageUrl={fighter.image_url}
                  imagePath={fighter.image_path}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-zinc-100">
                      {fighter.name}
                    </p>
                    {fighter.is_champion ? (
                      <Crown className="size-3 fill-amber-400 text-amber-400" />
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-[10px] text-zinc-600">
                    {fighter.nickname ? `“${fighter.nickname}” · ` : ""}
                    {fighter.country}
                  </p>
                </div>
              </div>
              <div>
                <p className="truncate text-xs font-semibold text-zinc-300">
                  {fighter.weight_class}
                </p>
                <span
                  className={cn(
                    "mt-1.5 inline-flex rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase",
                    fighter.style === "Striker"
                      ? "bg-red-500/10 text-red-400"
                      : fighter.style === "Grappler"
                        ? "bg-blue-500/10 text-blue-400"
                        : fighter.style === "BJJ"
                          ? "bg-violet-500/10 text-violet-400"
                          : "bg-zinc-500/10 text-zinc-400",
                  )}
                >
                  {fighter.style}
                </span>
              </div>
              <div>
                <p className="text-sm font-black text-zinc-200">
                  {fighter.wins}-{fighter.losses}-{fighter.draws}
                </p>
                <p className="mt-1 text-[9px] text-zinc-600">
                  {fighter.ko_wins + fighter.submission_wins} bitiriş
                </p>
              </div>
              <RecentForm
                fights={fightHistory.filter(
                  (fight) => fight.fighter_id === fighter.id,
                )}
              />
              <p className="text-sm font-bold tabular-nums text-zinc-300">
                {fighter.slpm.toFixed(2)}
              </p>
              <p className="text-sm font-bold tabular-nums text-zinc-300">
                %{Math.round(fighter.td_def * 100)}
              </p>
              <div>
                <p className="text-sm font-bold tabular-nums text-zinc-300">
                  {fighter.reach > 0 ? `${fighter.reach.toFixed(1)}″` : "—"}
                </p>
                <p className="mt-1 text-[9px] text-zinc-600">{fighter.stance}</p>
              </div>
            </Link>
          ))}
          {filteredFighters.length === 0 ? (
            <div className="py-20 text-center">
              <Search className="mx-auto size-6 text-zinc-700" />
              <p className="mt-3 text-sm font-semibold text-zinc-400">
                Eşleşen dövüşçü bulunamadı
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2 text-xs font-semibold text-red-500 hover:text-red-400"
              >
                Filtreleri temizle
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
