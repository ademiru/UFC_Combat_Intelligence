"use client";

import {
  Activity,
  CalendarDays,
  Crosshair,
  Gauge,
  HeartPulse,
  Medal,
  Ruler,
  Sparkles,
  ShieldCheck,
  Swords,
  Target,
  Trophy,
} from "lucide-react";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useUfcData } from "@/components/providers/data-provider";
import { FighterVideoLibrary } from "@/components/features/fighter-video-library";
import { DataState } from "@/components/shared/data-state";
import { FighterAvatar } from "@/components/shared/fighter-avatar";

const chartTooltipStyle = {
  background: "#111317",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 10,
  fontSize: 11,
};

function formatFightDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="border border-white/[0.08] bg-[#0d0f12] p-6 text-xs text-zinc-500">Dövüşçü profili hazırlanıyor...</div>}>
      <AnalyticsContent />
    </Suspense>
  );
}

function AnalyticsContent() {
  const { fighters, fightHistory, loading, error, refresh } = useUfcData();
  const searchParams = useSearchParams();
  const fighterIdFromUrl = Number(searchParams.get("fighter")) || null;
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (loading || error) {
    return (
      <DataState loading={loading} error={error} onRetry={() => void refresh()} />
    );
  }

  const fighter =
    fighters.find((item) => item.id === (selectedId ?? fighterIdFromUrl)) ??
    fighters.find((item) => item.name === "Islam Makhachev") ??
    fighters[0];

  const targetData = [
    { name: "Kafa", value: fighter.head_pct, color: "#ef4444" },
    { name: "Gövde", value: fighter.body_pct, color: "#f59e0b" },
    { name: "Bacak", value: fighter.leg_pct, color: "#3b82f6" },
  ];
  const finishData = [
    { name: "KO/TKO", value: fighter.ko_wins, color: "#ef4444" },
    { name: "Submission", value: fighter.submission_wins, color: "#8b5cf6" },
    { name: "Karar", value: fighter.decision_wins, color: "#52525b" },
  ];
  const baseRound = fighter.slpm * 5;
  const cardioData = [
    { round: "R1", strikes: Number(baseRound.toFixed(1)) },
    { round: "R2", strikes: Number((baseRound * 0.94).toFixed(1)) },
    { round: "R3", strikes: Number((baseRound * 0.88).toFixed(1)) },
    { round: "R4", strikes: Number((baseRound * 0.83).toFixed(1)) },
    { round: "R5", strikes: Number((baseRound * 0.79).toFixed(1)) },
  ];
  const recentFights = fightHistory
    .filter((fight) => fight.fighter_id === fighter.id)
    .slice(0, 5);
  const totalFights = fighter.wins + fighter.losses + fighter.draws;
  const winRate = Math.round((fighter.wins / Math.max(1, totalFights)) * 100);
  const finishes = fighter.ko_wins + fighter.submission_wins;
  const finishRate = Math.round((finishes / Math.max(1, fighter.wins)) * 100);
  const arsenalData = [
    { skill: "Vuruş", score: Math.min(100, Math.round((fighter.slpm / 7) * 55 + fighter.str_acc * 45)) },
    { skill: "Güç", score: Math.min(100, Math.round((fighter.ko_wins / Math.max(1, fighter.wins)) * 100)) },
    { skill: "Savunma", score: Math.round(fighter.str_def * 100) },
    { skill: "TD Hücum", score: Math.min(100, Math.round((fighter.td_avg / 5) * 60 + fighter.td_acc * 40)) },
    { skill: "TD Savunma", score: Math.round(fighter.td_def * 100) },
    { skill: "Submission", score: Math.min(100, Math.round((fighter.sub_avg / 2) * 65 + (fighter.submission_wins / Math.max(1, fighter.wins)) * 35)) },
  ];
  const strengths = [
    fighter.slpm >= 4 ? `Yüksek tempo: dakikada ${fighter.slpm.toFixed(1)} isabetli vuruş` : `Kontrollü tempo: dakikada ${fighter.slpm.toFixed(1)} isabetli vuruş`,
    finishRate >= 60 ? `Tehlikeli bitirici: galibiyetlerin %${finishRate} kadarı hakem kararına kalmadı` : `Sabırlı maç yönetimi: galibiyetlerin %${100 - finishRate} kadarı kararla geldi`,
    fighter.td_def >= 0.75 ? `Güçlü güreş savunması: %${Math.round(fighter.td_def * 100)}` : `Takedown savunması geliştirilebilir: %${Math.round(fighter.td_def * 100)}`,
  ];

  return (
    <div className="space-y-5">
      <section className="flex items-end justify-between gap-6">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-red-500 uppercase">
            <Activity className="size-3" />
            Fighter Intel · Dövüşçü Karnesi
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white">
            Operasyonel performans profili
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Vuruş seçimi, bitiricilik ve tempo dayanıklılığını birlikte inceleyin.
          </p>
        </div>
        <select
          aria-label="Analiz edilecek dövüşçü"
          value={fighter.id}
          onChange={(event) => setSelectedId(Number(event.target.value))}
          className="h-11 min-w-72 rounded-lg border border-white/[0.08] bg-[#111317] px-4 text-xs font-semibold text-zinc-200 outline-none focus:border-red-500/40"
        >
          {fighters.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.weight_class}
            </option>
          ))}
        </select>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[linear-gradient(135deg,rgba(210,10,10,.05)_0_16%,transparent_16%),#0d0f12] p-5">
        <div className="flex items-center gap-5">
          <FighterAvatar
            name={fighter.name}
            champion={Boolean(fighter.is_champion)}
            imageUrl={fighter.image_url}
            imagePath={fighter.image_path}
            className="size-20 rounded-2xl text-lg"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold tracking-[0.16em] text-red-500 uppercase">
                {fighter.weight_class}
              </p>
              {fighter.is_champion ? (
                <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[8px] font-black tracking-wider text-amber-400 uppercase">
                  Champion
                </span>
              ) : null}
            </div>
            <h3 className="mt-1 text-3xl font-black tracking-[-0.045em] text-white">
              {fighter.name}
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              {fighter.nickname ? `“${fighter.nickname}” · ` : ""}
              {fighter.country} · {fighter.stance}
            </p>
          </div>
          <div className="ml-auto grid grid-cols-4 gap-4 border-l border-white/[0.07] pl-5">
            {[
              ["Rekor", `${fighter.wins}-${fighter.losses}-${fighter.draws}`],
              ["Vuruş / dk", fighter.slpm.toFixed(2)],
              ["Vuruş isabet", `%${Math.round(fighter.str_acc * 100)}`],
              ["TD savunma", `%${Math.round(fighter.td_def * 100)}`],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[9px] font-bold tracking-wider text-zinc-600 uppercase">
                  {label}
                </p>
                <p className="mt-2 text-xl font-black text-zinc-100">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FighterVideoLibrary
        key={fighter.id}
        fighterId={fighter.id}
        fighterName={fighter.name}
        sourceUrl={fighter.source_url}
      />

      <section className="grid grid-cols-[1.25fr_0.75fr] gap-4">
        <article className="rounded-2xl border border-white/[0.08] bg-[#0d0f12] p-5">
          <div className="flex items-center justify-between"><div><p className="text-sm font-bold text-white">30 saniyede {fighter.name}</p><p className="mt-1 text-[10px] text-zinc-600">En çok merak edilen kariyer özeti</p></div><Sparkles className="size-4 text-amber-400" /></div>
          <div className="mt-5 grid grid-cols-4 gap-3">
            {[
              ["Profesyonel Rekor", `${fighter.wins}-${fighter.losses}-${fighter.draws}`],
              ["Galibiyet Oranı", `%${winRate}`],
              ["Bitiriş Oranı", `%${finishRate}`],
              ["Aktif Seri", `${fighter.win_streak} maç`],
            ].map(([label, value]) => <div key={label} className="border border-white/[0.06] bg-black/20 p-4"><p className="text-[8px] font-bold tracking-wider text-zinc-600 uppercase">{label}</p><p className="mt-2 text-xl font-black text-white">{value}</p></div>)}
          </div>
          <div className="mt-5 space-y-2">{strengths.map((strength, index) => <div key={strength} className="flex items-center gap-3 border-l-2 border-red-500 bg-white/[0.018] px-4 py-3"><span className="text-[9px] font-black text-red-500">0{index + 1}</span><p className="text-[11px] leading-5 text-zinc-300">{strength}</p></div>)}</div>
        </article>
        <article className="rounded-2xl border border-white/[0.08] bg-[#0d0f12] p-5">
          <div className="flex items-center gap-2"><Ruler className="size-4 text-red-500" /><p className="text-sm font-bold text-white">Fiziksel profil</p></div>
          <div className="mt-5 divide-y divide-white/[0.06]">{[
            ["Boy", fighter.height > 0 ? `${fighter.height.toFixed(1)} in · ${Math.round(fighter.height * 2.54)} cm` : "—"],
            ["Uzanma", fighter.reach > 0 ? `${fighter.reach.toFixed(1)} in · ${Math.round(fighter.reach * 2.54)} cm` : "—"],
            ["Kilo", fighter.weight > 0 ? `${fighter.weight} lb · ${Math.round(fighter.weight * 0.453592)} kg` : "—"],
            ["Duruş", fighter.stance || "—"],
            ["Sıklet", fighter.weight_class],
          ].map(([label, value]) => <div key={label} className="flex items-center justify-between py-3"><span className="text-[9px] font-bold tracking-wider text-zinc-600 uppercase">{label}</span><span className="text-[11px] font-bold text-zinc-200">{value}</span></div>)}</div>
        </article>
      </section>

      <section className="grid grid-cols-[0.9fr_1.1fr] gap-4">
        <article className="rounded-2xl border border-red-500/15 bg-[#0d0f12] p-5">
          <div><p className="text-sm font-bold text-white">Cephanelik</p><p className="mt-1 text-[10px] text-zinc-600">Altı temel becerinin 100 üzerinden karşılaştırması</p></div>
          <div className="mt-1 h-[220px] min-h-[220px] min-w-0"><ResponsiveContainer width="100%" height="100%"><RadarChart data={arsenalData} outerRadius="72%"><defs><linearGradient id="arsenalFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fb7185" stopOpacity={0.55}/><stop offset="100%" stopColor="#991b1b" stopOpacity={0.12}/></linearGradient></defs><PolarGrid stroke="rgba(255,255,255,.13)" radialLines={false}/><PolarAngleAxis dataKey="skill" tick={{fill:"#d4d4d8",fontSize:9,fontWeight:700}}/><Radar dataKey="score" stroke="#fb7185" strokeWidth={2.5} fill="url(#arsenalFill)" fillOpacity={1} dot={{r:3,fill:"#09090b",stroke:"#fb7185",strokeWidth:2}}/><Tooltip contentStyle={chartTooltipStyle}/></RadarChart></ResponsiveContainer></div>
        </article>
        <article className="rounded-2xl border border-white/[0.08] bg-[#0d0f12] p-5">
          <div><p className="text-sm font-bold text-white">Galibiyet nasıl geliyor?</p><p className="mt-1 text-[10px] text-zinc-600">Kariyer galibiyetlerinin sade dağılımı</p></div>
          <div className="mt-6 grid grid-cols-3 gap-3">{finishData.map((item) => <div key={item.name} className="border border-white/[0.06] p-5 text-center"><span className="mx-auto block size-2" style={{backgroundColor:item.color}}/><p className="mt-3 text-2xl font-black text-white">{item.value}</p><p className="mt-1 text-[9px] font-bold text-zinc-600 uppercase">{item.name}</p></div>)}</div>
          <p className="mt-5 border-t border-white/[0.06] pt-4 text-[10px] leading-5 text-zinc-500">{fighter.ko_wins >= fighter.submission_wins ? `${fighter.name} galibiyet ararken daha çok vuruş gücüne dayanıyor.` : `${fighter.name} yerde submission tehdidiyle öne çıkıyor.`} Bu dağılım kariyer toplamını gösterir.</p>
        </article>
      </section>

      <section className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Toplam bitiriş",
            value: fighter.ko_wins + fighter.submission_wins,
            detail: `${fighter.ko_wins} KO · ${fighter.submission_wins} SUB`,
            icon: Trophy,
          },
          {
            label: "Takedown ort.",
            value: fighter.td_avg.toFixed(2),
            detail: `%${Math.round(fighter.td_acc * 100)} isabet`,
            icon: Target,
          },
          {
            label: "Vuruş savunma",
            value: `%${Math.round(fighter.str_def * 100)}`,
            detail: `${fighter.sapm.toFixed(2)} SApM`,
            icon: ShieldCheck,
          },
          {
            label: "Submission ort.",
            value: fighter.sub_avg.toFixed(2),
            detail: "15 dakika başına",
            icon: Medal,
          },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-2xl border border-white/[0.07] bg-[#0d0f12] p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-zinc-500">
                  {metric.label}
                </p>
                <Icon className="size-4 text-red-500" />
              </div>
              <p className="mt-3 text-2xl font-black tracking-tight text-white">
                {metric.value}
              </p>
              <p className="mt-1 text-[9px] text-zinc-700">{metric.detail}</p>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-2 gap-5">
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f12] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-zinc-100">Vuruş bölgesi analizi</p>
              <p className="mt-1 text-[10px] text-zinc-600">İsabetli anlamlı vuruş dağılımı</p>
            </div>
            <Crosshair className="size-4 text-red-500" />
          </div>
          <div className="mt-2 h-[205px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={targetData} layout="vertical" margin={{ left: 4, right: 18 }}>
                <defs><linearGradient id="targetBar" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#7f1d1d"/><stop offset="55%" stopColor="#dc2626"/><stop offset="100%" stopColor="#fb7185"/></linearGradient></defs>
                <CartesianGrid
                  stroke="rgba(255,255,255,.05)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: "#52525b", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#a1a1aa", fontSize: 10, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip contentStyle={chartTooltipStyle} cursor={false} />
                <Bar dataKey="value" fill="url(#targetBar)" radius={0} barSize={15}>
                  {targetData.map((entry) => (
                    <Cell key={entry.name} fill={entry.name === "Kafa" ? "url(#targetBar)" : entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f12] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-zinc-100">Bitiricilik oranları</p>
              <p className="mt-1 text-[10px] text-zinc-600">Kariyer galibiyet yöntemleri</p>
            </div>
            <Gauge className="size-4 text-violet-400" />
          </div>
          <div className="mt-3 grid grid-cols-[1.2fr_0.8fr] items-center">
            <div className="h-[205px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={finishData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={76}
                    paddingAngle={5}
                    cornerRadius={0}
                    stroke="#0d0f12"
                    strokeWidth={3}
                  >
                    {finishData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {finishData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div>
                    <p className="text-[10px] text-zinc-500">{entry.name}</p>
                    <p className="mt-0.5 text-sm font-black text-zinc-200">
                      {entry.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border border-white/[0.07] bg-[#0d0f12] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-zinc-100">Son maçlar ve güncel form</p>
            <p className="mt-1 text-[10px] text-zinc-600">
              Resmî UFC sporcu kaydından son beş karşılaşma
            </p>
          </div>
          <Swords className="size-4 text-red-500" />
        </div>
        {recentFights.length > 0 ? (
          <div className="mt-5 grid grid-cols-5 gap-3">
            {recentFights.map((fight, index) => (
              <article
                key={fight.id}
                className={`border border-white/[0.07] border-l-2 p-3 ${
                  fight.result === "W"
                    ? "border-l-emerald-500"
                    : fight.result === "L"
                      ? "border-l-red-500"
                      : "border-l-zinc-500"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <FighterAvatar
                    name={fight.opponent_name}
                    imageUrl={fight.opponent_image_url}
                    imagePath={fight.opponent_image_path}
                    className="size-10"
                  />
                  <span
                    className={`grid size-7 place-items-center border text-xs font-black ${
                      fight.result === "W"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : fight.result === "L"
                          ? "border-red-500/30 bg-red-500/10 text-red-400"
                          : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400"
                    }`}
                  >
                    {fight.result}
                  </span>
                </div>
                <p className="mt-3 truncate text-xs font-bold text-zinc-100">
                  {fight.opponent_name}
                </p>
                <p className="mt-1 truncate text-[9px] text-zinc-600">
                  {fight.event_name}
                </p>
                <p className="mt-3 text-[10px] font-semibold text-zinc-400">
                  {fight.method}
                </p>
                <p className="mt-1 text-[9px] text-zinc-600">
                  R{fight.round} · {fight.fight_time || "—"}
                </p>
                <p className="mt-3 flex items-center gap-1.5 border-t border-white/[0.05] pt-3 text-[9px] text-zinc-700">
                  <CalendarDays className="size-3" />
                  {formatFightDate(fight.fight_date)}
                  {index === 0 ? " · Son maç" : ""}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 border border-dashed border-white/[0.08] p-6 text-center text-xs text-zinc-600">
            Bu dövüşçü için resmî maç geçmişi henüz önbelleğe alınmadı.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#0d0f12] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-zinc-100">Kardiyo tempo projeksiyonu</p>
            <p className="mt-1 text-[10px] text-zinc-600">
              SLpM baz alınarak beş rauntluk tahmini isabetli vuruş temposu
            </p>
          </div>
          <HeartPulse className="size-4 text-red-500" />
        </div>
        <div className="mt-2 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cardioData} margin={{ left: -20, right: 15, top: 10 }}>
              <defs><linearGradient id="cardioLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fb7185"/><stop offset="100%" stopColor="#dc2626"/></linearGradient><linearGradient id="cardioArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="100%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
              <XAxis
                dataKey="round"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 10, fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#52525b", fontSize: 9 }}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="strikes" stroke="none" fill="url(#cardioArea)" />
              <Line
                type="monotone"
                dataKey="strikes"
                name="İsabetli vuruş"
                stroke="url(#cardioLine)"
                strokeWidth={3}
                dot={{ r: 4, fill: "#ef4444", stroke: "#0d0f12", strokeWidth: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
