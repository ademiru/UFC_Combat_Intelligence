"use client";

import {
  Activity,
  BrainCircuit,
  ChevronRight,
  Ruler,
  Shield,
  Sparkles,
  Swords,
  Target,
} from "lucide-react";
import { useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import {
  type Fighter,
  type FightHistory,
  useUfcData,
} from "@/components/providers/data-provider";
import { DataState } from "@/components/shared/data-state";
import { FighterAvatar } from "@/components/shared/fighter-avatar";
import { calculateMatchup, createRadarData } from "@/lib/fighter-analysis";

const selectClassName =
  "h-11 w-full rounded-lg border border-white/[0.08] bg-[#111317] px-3 text-xs font-semibold text-zinc-200 outline-none focus:border-red-500/40";

interface PhysicalRowProps {
  label: string;
  first: number;
  second: number;
  suffix: string;
}

function PhysicalRow({ label, first, second, suffix }: PhysicalRowProps) {
  const maximum = Math.max(first, second, 1);
  const formatValue = (value: number) =>
    value > 0 ? `${value.toFixed(1)} ${suffix}` : "—";
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[10px]">
        <span className="font-bold text-zinc-200">
          {formatValue(first)}
        </span>
        <span className="font-semibold tracking-wider text-zinc-600 uppercase">
          {label}
        </span>
        <span className="font-bold text-zinc-200">
          {formatValue(second)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div className="flex h-1.5 justify-end overflow-hidden rounded-l-full bg-white/[0.04]">
          <span
            className="h-full rounded-full bg-red-500"
            style={{ width: `${(first / maximum) * 100}%` }}
          />
        </div>
        <div className="h-1.5 overflow-hidden rounded-r-full bg-white/[0.04]">
          <span
            className="block h-full rounded-full bg-blue-500"
            style={{ width: `${(second / maximum) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function FighterSelector({
  fighter,
  fighters,
  onChange,
  color,
  recentFights,
}: {
  fighter: Fighter;
  fighters: Fighter[];
  onChange: (id: number) => void;
  color: "red" | "blue";
  recentFights: FightHistory[];
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f12] p-5">
      <div className="flex items-center gap-4">
        <FighterAvatar
          name={fighter.name}
          champion={Boolean(fighter.is_champion)}
          imageUrl={fighter.image_url}
          imagePath={fighter.image_path}
          className="size-14"
        />
        <div className="min-w-0 flex-1">
          <p
            className={`text-[9px] font-bold tracking-[0.16em] uppercase ${color === "red" ? "text-red-500" : "text-blue-500"}`}
          >
            Dövüşçü {color === "red" ? "A" : "B"}
          </p>
          <p className="mt-1 truncate text-lg font-black text-white">
            {fighter.name}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-600">
            {fighter.weight_class} · {fighter.wins}-{fighter.losses}-{fighter.draws}
          </p>
          <div className="mt-2 flex gap-1" aria-label="Güncel form">
            {recentFights.slice(0, 5).map((fight) => (
              <span
                key={fight.id}
                className={`grid size-4 place-items-center border text-[8px] font-black ${
                  fight.result === "W"
                    ? "border-emerald-500/25 text-emerald-400"
                    : fight.result === "L"
                      ? "border-red-500/25 text-red-400"
                      : "border-zinc-500/25 text-zinc-500"
                }`}
              >
                {fight.result}
              </span>
            ))}
          </div>
        </div>
      </div>
      <select
        aria-label={`Dövüşçü ${color === "red" ? "A" : "B"}`}
        value={fighter.id}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`${selectClassName} mt-5`}
      >
        {fighters.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} · {item.weight_class}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function HeadToHeadPage() {
  const { fighters, fightHistory, loading, error, refresh } = useUfcData();
  const [fighterAId, setFighterAId] = useState<number | null>(null);
  const [fighterBId, setFighterBId] = useState<number | null>(null);

  if (loading || error) {
    return (
      <DataState loading={loading} error={error} onRetry={() => void refresh()} />
    );
  }

  const fighterA =
    fighters.find((fighter) => fighter.id === fighterAId) ??
    fighters.find((fighter) => fighter.name === "Islam Makhachev") ??
    fighters[0];
  const fighterB =
    fighters.find((fighter) => fighter.id === fighterBId) ??
    fighters.find((fighter) => fighter.name === "Ian Machado Garry") ??
    fighters.find((fighter) => fighter.id !== fighterA.id) ??
    fighters[0];
  const radarData = createRadarData(fighterA, fighterB);
  const recentA = fightHistory.filter((fight) => fight.fighter_id === fighterA.id);
  const recentB = fightHistory.filter((fight) => fight.fighter_id === fighterB.id);
  const matchup = calculateMatchup(fighterA, fighterB, recentA, recentB);
  const commonOpponents = recentA
    .filter((fightA) => recentB.some((fightB) => fightB.opponent_name === fightA.opponent_name))
    .map((fightA) => ({ first: fightA, second: recentB.find((fightB) => fightB.opponent_name === fightA.opponent_name)! }));

  return (
    <div className="space-y-6">
      <section>
        <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-red-500 uppercase">
          <Swords className="size-3" />
          H2H Analiz Laboratuvarı
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white">
          Stil çakışması motoru
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          İki dövüşçüyü seçin; fiziksel, teknik ve algoritmik avantajları karşılaştırın.
        </p>
      </section>

      <section className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <FighterSelector
          fighter={fighterA}
          fighters={fighters.filter((fighter) => fighter.id !== fighterB.id)}
          onChange={setFighterAId}
          color="red"
          recentFights={recentA}
        />
        <span className="grid size-11 place-items-center rounded-full border border-white/[0.08] bg-[#0d0f12] text-red-500">
          <Swords className="size-4" />
        </span>
        <FighterSelector
          fighter={fighterB}
          fighters={fighters.filter((fighter) => fighter.id !== fighterA.id)}
          onChange={setFighterBId}
          color="blue"
          recentFights={recentB}
        />
      </section>

      <section className="grid grid-cols-[1fr_1.15fr] gap-5">
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f12] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-zinc-100">Fiziksel kıyaslama</p>
              <p className="mt-1 text-[10px] text-zinc-600">
                Resmî ölçü değerleri · inç / libre
              </p>
            </div>
            <Ruler className="size-4 text-zinc-600" />
          </div>
          <div className="mt-7 space-y-6">
            <PhysicalRow
              label="Boy"
              first={fighterA.height}
              second={fighterB.height}
              suffix="in"
            />
            <PhysicalRow
              label="Kilo"
              first={fighterA.weight}
              second={fighterB.weight}
              suffix="lb"
            />
            <PhysicalRow
              label="Uzanma"
              first={fighterA.reach}
              second={fighterB.reach}
              suffix="in"
            />
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-5">
            {[fighterA, fighterB].map((fighter, index) => (
              <div
                key={fighter.id}
                className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3"
              >
                <p className="text-[9px] font-bold tracking-wider text-zinc-600 uppercase">
                  Duruş
                </p>
                <p
                  className={`mt-1.5 text-xs font-bold ${index === 0 ? "text-red-400" : "text-blue-400"}`}
                >
                  {fighter.stance}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f12] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-zinc-100">Beş eksenli profil</p>
              <p className="mt-1 text-[10px] text-zinc-600">
                UFC metriklerinden normalize edilmiş 0–100 skor
              </p>
            </div>
            <Activity className="size-4 text-red-500" />
          </div>
          <div className="mt-2 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: "#71717a", fontSize: 10, fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111317",
                    border: "1px solid rgba(255,255,255,.08)",
                    borderRadius: 10,
                    fontSize: 11,
                  }}
                />
                <Radar
                  name={fighterA.name}
                  dataKey="fighterA"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.2}
                />
                <Radar
                  name={fighterB.name}
                  dataKey="fighterB"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.16}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-[10px] font-semibold text-zinc-500">
            <span className="flex items-center gap-2">
              <i className="size-2 rounded-full bg-red-500" /> {fighterA.name}
            </span>
            <span className="flex items-center gap-2">
              <i className="size-2 rounded-full bg-blue-500" /> {fighterB.name}
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[0.8fr_1.4fr] gap-5">
        <div className="relative overflow-hidden rounded-2xl border border-red-500/15 bg-[radial-gradient(circle_at_50%_0%,rgba(210,10,10,0.14),transparent_55%),#0d0f12] p-6">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-red-500 uppercase">
            <BrainCircuit className="size-3.5" />
            Model avantaj skoru
          </div>
          <div className="mt-7 flex items-end justify-between">
            <div>
              <p className="font-display text-5xl leading-none font-bold tracking-tight text-white tabular-nums">
                %{matchup.probabilityA}
              </p>
              <p className="mt-1 max-w-32 text-[10px] leading-4 text-zinc-500">
                {fighterA.name} için göreli avantaj
              </p>
            </div>
            <Swords className="mb-5 size-5 text-zinc-700" />
            <div className="text-right">
              <p className="font-display text-5xl leading-none font-bold tracking-tight text-white tabular-nums">
                %{matchup.probabilityB}
              </p>
              <p className="mt-1 ml-auto max-w-32 text-[10px] leading-4 text-zinc-500">
                {fighterB.name} için göreli avantaj
              </p>
            </div>
          </div>
          <div className="mt-6 flex h-2 overflow-hidden rounded-full bg-blue-500">
            <span
              className="h-full bg-red-500"
              style={{ width: `${matchup.probabilityA}%` }}
            />
          </div>
          <p className="mt-4 text-[9px] leading-4 text-zinc-700">
            Bahis tavsiyesi değildir; yalnızca veri tabanlı göreli eşleşme skorudur.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f12] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-zinc-100">Analiz motoru çıkarımları</p>
              <p className="mt-1 text-[10px] text-zinc-600">
                Stil ve metrik çakışmalarından otomatik üretildi
              </p>
            </div>
            <Sparkles className="size-4 text-amber-400" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {matchup.insights.map((insight, index) => {
              const Icon = index % 2 === 0 ? Target : Shield;
              return (
                <div
                  key={insight}
                  className="flex gap-3 rounded-xl border border-white/[0.05] bg-white/[0.018] p-4"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-red-500/[0.07] text-red-500">
                    <Icon className="size-3.5" />
                  </span>
                  <p className="text-[11px] leading-5 text-zinc-400">{insight}</p>
                  <ChevronRight className="ml-auto mt-1 size-3 shrink-0 text-zinc-800" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-5">
        <article className="border border-white/[0.07] bg-[#0d0f12] p-6">
          <div className="flex items-center justify-between"><div><p className="text-sm font-bold text-white">Ortak hedefler</p><p className="mt-1 text-[10px] text-zinc-600">İki operasyon kaydındaki ortak rakipler</p></div><Target className="size-4 text-red-500" /></div>
          {commonOpponents.length ? <div className="mt-5 divide-y divide-white/[0.06]">{commonOpponents.map(({first, second}) => <div key={first.opponent_name} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-4 text-[10px]"><span className="text-right text-zinc-400">{first.result} · {first.method} · R{first.round}</span><span className="border border-white/[0.08] px-3 py-2 font-bold text-white">{first.opponent_name}</span><span className="text-zinc-400">{second.result} · {second.method} · R{second.round}</span></div>)}</div> : <p className="mt-5 border border-dashed border-white/[0.08] p-8 text-center text-[10px] text-zinc-600">Yerel son maç kayıtlarında ortak rakip bulunamadı.</p>}
        </article>
        <article className="border border-white/[0.07] bg-[#0d0f12] p-6">
          <div><p className="text-sm font-bold text-white">Hasar haritası</p><p className="mt-1 text-[10px] text-zinc-600">Alınan darbe verisi bulunmadığı için hücum hedef dağılımı gösterilir</p></div>
          <div className="mt-6 grid grid-cols-2 gap-8">
            {[fighterA, fighterB].map((fighter, index) => <div key={fighter.id}><p className={`mb-4 text-center text-[10px] font-bold ${index === 0 ? "text-red-400" : "text-blue-400"}`}>{fighter.name}</p><div className="mx-auto w-36 space-y-2"><div className="mx-auto grid size-12 place-items-center rounded-full border-4 border-red-500/30 bg-red-500/20 text-[9px] font-black text-white">%{Math.round(fighter.head_pct)}</div><div className="mx-auto grid h-20 w-20 place-items-center border-4 border-amber-500/30 bg-amber-500/15 text-[9px] font-black text-white">%{Math.round(fighter.body_pct)}</div><div className="mx-auto flex w-20 justify-between"><span className="h-16 w-7 bg-blue-500/20 border border-blue-500/30"/><span className="h-16 w-7 bg-blue-500/20 border border-blue-500/30"/></div><p className="text-center text-[8px] text-blue-400">Bacak %{Math.round(fighter.leg_pct)}</p></div></div>)}
          </div>
        </article>
      </section>
    </div>
  );
}
