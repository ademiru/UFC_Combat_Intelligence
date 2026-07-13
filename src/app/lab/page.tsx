"use client";

import { Activity, Award, Clock3, Crosshair, FlaskConical, Gavel, ShieldAlert, Trophy } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useUfcData } from "@/components/providers/data-provider";
import { DataState } from "@/components/shared/data-state";
import { FighterAvatar } from "@/components/shared/fighter-avatar";

export default function AnalyticsLabPage() {
  const { fighters, fightHistory, loading, error, refresh } = useUfcData();
  const leaders = useMemo(() => ({
    volume: [...fighters].sort((a, b) => b.slpm - a.slpm).slice(0, 5),
    submissions: [...fighters].sort((a, b) => b.submission_wins - a.submission_wins).slice(0, 5),
    defense: [...fighters].sort((a, b) => b.td_def - a.td_def).slice(0, 5),
  }), [fighters]);
  const roundData = useMemo(() => [1, 2, 3, 4, 5].map((round) => ({
    round: `R${round}`,
    finishes: fightHistory.filter((fight) => fight.round === round).length,
  })), [fightHistory]);

  if (loading || error) return <DataState loading={loading} error={error} onRetry={() => void refresh()} />;

  return (
    <div className="space-y-6">
      <section>
        <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-red-500 uppercase"><FlaskConical className="size-3" /> Analytics Lab</p>
        <h2 className="mt-3 text-3xl font-black text-white">Organizasyon istihbaratı</h2>
        <p className="mt-2 text-sm text-zinc-500">Kadronun tamamındaki performans liderleri ve sonuç trendleri.</p>
      </section>

      <section className="grid grid-cols-3 gap-4">
        {[
          { title: "Vuruş Hacmi", subtitle: "Dakikada isabetli vuruş", data: leaders.volume, value: (id: number) => fighters.find((f) => f.id === id)!.slpm.toFixed(2), icon: Crosshair },
          { title: "Submission Liderleri", subtitle: "Kariyer toplamı", data: leaders.submissions, value: (id: number) => String(fighters.find((f) => f.id === id)!.submission_wins), icon: Trophy },
          { title: "Takedown Savunması", subtitle: "En yüksek savunma oranı", data: leaders.defense, value: (id: number) => `%${Math.round(fighters.find((f) => f.id === id)!.td_def * 100)}`, icon: Award },
        ].map((board) => {
          const Icon = board.icon;
          return <article key={board.title} className="border border-white/[0.08] bg-[#0d0f12] p-5">
            <div className="flex items-start justify-between"><div><p className="text-sm font-bold text-white">{board.title}</p><p className="mt-1 text-[9px] text-zinc-600">{board.subtitle}</p></div><Icon className="size-4 text-red-500" /></div>
            <div className="mt-5 divide-y divide-white/[0.05]">{board.data.map((fighter, index) => <div key={fighter.id} className="flex items-center gap-3 py-3"><span className="w-4 text-[9px] font-black text-zinc-700">0{index + 1}</span><FighterAvatar name={fighter.name} imageUrl={fighter.image_url} imagePath={fighter.image_path} className="size-8" /><span className="min-w-0 flex-1 truncate text-[10px] font-bold text-zinc-300">{fighter.name}</span><span className="text-xs font-black text-white">{board.value(fighter.id)}</span></div>)}</div>
          </article>;
        })}
      </section>

      <section className="grid grid-cols-[1.4fr_0.8fr] gap-5">
        <article className="border border-white/[0.08] bg-[#0d0f12] p-6">
          <div className="flex items-center justify-between"><div><p className="text-sm font-bold text-white">Round bitiriş trendi</p><p className="mt-1 text-[9px] text-zinc-600">Yerel operasyon kayıtlarındaki bitiş raundu dağılımı</p></div><Activity className="size-4 text-red-500" /></div>
          <div className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={roundData}><CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false}/><XAxis dataKey="round" axisLine={false} tickLine={false} tick={{fill:"#71717a",fontSize:10}}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill:"#52525b",fontSize:9}}/><Tooltip contentStyle={{background:"#111317",border:"1px solid rgba(255,255,255,.08)",fontSize:11}}/><Bar dataKey="finishes" name="Bitiş" fill="#dc2626" /></BarChart></ResponsiveContainer></div>
        </article>
        <article className="border border-amber-500/15 bg-amber-500/[0.025] p-6">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-amber-400 uppercase"><Gavel className="size-4" /> Hakem Eğilimleri</div>
          <h3 className="mt-5 text-xl font-black text-white">Veri kapsamı bekleniyor</h3>
          <p className="mt-3 text-[11px] leading-5 text-zinc-500">Mevcut resmî senkron hakem ve puan kartı verisi toplamıyor. Erken durdurma veya grappling eğilimi güvenilir biçimde hesaplanmadan gösterilmeyecek.</p>
          <div className="mt-6 space-y-3 border-t border-white/[0.06] pt-5 text-[10px] text-zinc-600"><p className="flex items-center gap-2"><ShieldAlert className="size-3.5 text-amber-500" /> Kaynak şeması gerekli</p><p className="flex items-center gap-2"><Clock3 className="size-3.5" /> Sonraki veri fazına hazır</p></div>
        </article>
      </section>
    </div>
  );
}
