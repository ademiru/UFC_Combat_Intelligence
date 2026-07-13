"use client";

import { getVersion } from "@tauri-apps/api/app";
import {
  Activity,
  Check,
  CloudDownload,
  Database,
  HardDrive,
  MonitorCog,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Wifi,
  WifiOff,
  ZapOff,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useUfcData } from "@/components/providers/data-provider";
import { Button } from "@/components/ui/button";
import { useAppPreferences } from "@/hooks/use-app-preferences";
import { resetDatabaseConnection } from "@/lib/database";
import { UPDATE_CHECK_REQUESTED } from "@/lib/preferences";
import { cn } from "@/lib/utils";

function formatDate(value?: string) {
  if (!value) return "Henüz tamamlanmadı";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function SettingToggle({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-8 w-[58px] shrink-0 border transition-colors disabled:cursor-wait disabled:opacity-45",
        checked
          ? "border-emerald-500/50 bg-emerald-500/[0.12]"
          : "border-white/[0.12] bg-black/35",
      )}
    >
      <span
        className={cn(
          "absolute top-[5px] grid size-5 place-items-center border transition-[left,background-color,border-color] duration-200",
          checked
            ? "left-[31px] border-emerald-400 bg-emerald-400 text-black"
            : "left-[5px] border-zinc-600 bg-zinc-800 text-zinc-500",
        )}
      >
        {checked ? <Check className="size-3.5 stroke-[3]" /> : null}
      </span>
    </button>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Wifi;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[82px] grid-cols-[42px_1fr_auto] items-center gap-4 border-b border-white/[0.06] px-5 last:border-b-0">
      <span className="grid size-10 place-items-center border border-white/[0.08] bg-white/[0.025] text-zinc-500">
        <Icon className="size-[17px]" />
      </span>
      <div className="min-w-0 py-4">
        <p className="text-xs font-black text-zinc-100">{title}</p>
        <p className="mt-1 text-[10px] leading-4 text-zinc-600">{description}</p>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const {
    fighters,
    events,
    metadata,
    onlineMode,
    syncing,
    error,
    refresh,
    setOnlineMode,
    syncNow,
  } = useUfcData();
  const { preferences, setPreference } = useAppPreferences();
  const [version, setVersion] = useState("0.2.2");
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    void getVersion().then(setVersion).catch(() => undefined);
  }, []);

  const reconnect = async () => {
    setReconnecting(true);
    resetDatabaseConnection();
    try {
      await refresh();
    } finally {
      setReconnecting(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex items-end justify-between border-b border-white/[0.07] pb-5">
        <div>
          <p className="flex items-center gap-2 text-[9px] font-black tracking-[0.2em] text-red-500 uppercase">
            <MonitorCog className="size-3.5" /> Sistem Kontrolü
          </p>
          <h2 className="font-display mt-2 text-3xl font-black tracking-[-0.025em] text-white uppercase">
            Ayarlar
          </h2>
          <p className="mt-2 text-xs text-zinc-600">
            Bağlantı, güncelleme ve yerel çalışma davranışını tek noktadan yönetin.
          </p>
        </div>
        <div className="flex items-center gap-3 border border-white/[0.08] bg-[#0b0d10] px-4 py-3">
          <ShieldCheck className="size-4 text-emerald-500" />
          <div>
            <p className="text-[8px] font-black tracking-[0.16em] text-zinc-600 uppercase">Kurulu sürüm</p>
            <p className="mt-1 font-mono text-xs font-bold text-zinc-200">v{version}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[1.12fr_.88fr] gap-4 max-xl:grid-cols-1">
        <section className="border border-white/[0.08] bg-[#0b0d10]">
          <header className="flex h-14 items-center justify-between border-b border-white/[0.07] px-5">
            <div>
              <p className="text-[9px] font-black tracking-[0.18em] text-red-500 uppercase">01 // Veri bağlantısı</p>
              <p className="mt-1 text-[9px] text-zinc-700">Resmî UFC kaynağı ve yerel önbellek</p>
            </div>
            <span className={cn("size-2", onlineMode ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,.7)]" : "bg-zinc-700")} />
          </header>

          <SettingRow
            icon={onlineMode ? Wifi : WifiOff}
            title="Online Mod"
            description="Resmî UFC verilerini alır; son çalışan kopyayı SQLite üzerinde korur."
          >
            <SettingToggle
              label="Online Mod"
              checked={onlineMode}
              disabled={syncing}
              onChange={(checked) => void setOnlineMode(checked)}
            />
          </SettingRow>
          <SettingRow
            icon={CloudDownload}
            title="Otomatik veri senkronu"
            description="Online Mod açıkken altı saatten eski veriyi uygulama açılışında yeniler."
          >
            <SettingToggle
              label="Otomatik veri senkronu"
              checked={preferences.automaticDataSync}
              onChange={(checked) => setPreference("automaticDataSync", checked)}
            />
          </SettingRow>
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-[9px] font-black tracking-wider text-zinc-500 uppercase">Son başarılı senkron</p>
              <p className="mt-1 text-[10px] text-zinc-300">{formatDate(metadata.last_online_sync)}</p>
            </div>
            <Button
              variant="outline"
              disabled={!onlineMode || syncing}
              onClick={() => void syncNow()}
            >
              <RefreshCw className={syncing ? "animate-spin" : ""} />
              {syncing ? "Güncelleniyor" : "Şimdi güncelle"}
            </Button>
          </div>
        </section>

        <section className="border border-white/[0.08] bg-[#0b0d10]">
          <header className="flex h-14 items-center justify-between border-b border-white/[0.07] px-5">
            <div>
              <p className="text-[9px] font-black tracking-[0.18em] text-red-500 uppercase">02 // Yerel kasa</p>
              <p className="mt-1 text-[9px] text-zinc-700">Cihazdaki doğrulanmış veri görünümü</p>
            </div>
            <Database className={cn("size-4", error ? "text-red-500" : "text-emerald-500")} />
          </header>
          <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.06]">
            {[
              ["Dövüşçü", fighters.length],
              ["Etkinlik", events.length],
              ["Fotoğraf", Number(metadata.fighter_images_cached ?? 0)],
            ].map(([label, value]) => (
              <div key={label} className="px-4 py-5 text-center">
                <p className="font-display text-2xl font-black text-white tabular-nums">{value}</p>
                <p className="mt-1 text-[8px] font-bold tracking-wider text-zinc-600 uppercase">{label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3 p-5">
            <div className="flex items-center gap-3 border border-emerald-500/15 bg-emerald-500/[0.035] px-4 py-3">
              <HardDrive className="size-4 text-emerald-500" />
              <div>
                <p className="text-[10px] font-bold text-zinc-200">{error ? "Bağlantı onarımı gerekli" : "Yerel veritabanı hazır"}</p>
                <p className="mt-0.5 text-[8px] text-zinc-600">Kayıtlar cihazınızda çalışır; yeniden bağlanma verileri silmez.</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              disabled={reconnecting}
              onClick={() => void reconnect()}
            >
              <RotateCcw className={reconnecting ? "animate-spin" : ""} />
              {reconnecting ? "Bağlantı sınanıyor" : "Veritabanını yeniden bağla"}
            </Button>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-4 max-xl:grid-cols-1">
        <section className="border border-white/[0.08] bg-[#0b0d10]">
          <header className="flex h-14 items-center gap-3 border-b border-white/[0.07] px-5">
            <PackageCheck className="size-4 text-red-500" />
            <div>
              <p className="text-[9px] font-black tracking-[0.18em] text-red-500 uppercase">03 // Uygulama güncellemeleri</p>
              <p className="mt-1 text-[9px] text-zinc-700">İmzalı yayın kanalını yönetin</p>
            </div>
          </header>
          <SettingRow
            icon={PackageCheck}
            title="Otomatik güncelleme kontrolü"
            description="Açılışta ve uygulama çalışırken belirli aralıklarla yeni sürüm arar."
          >
            <SettingToggle
              label="Otomatik güncelleme kontrolü"
              checked={preferences.automaticUpdateChecks}
              onChange={(checked) => setPreference("automaticUpdateChecks", checked)}
            />
          </SettingRow>
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-[9px] leading-4 text-zinc-600">Güncellemeler hiçbir zaman izniniz olmadan kurulmaz.</p>
            <Button
              variant="outline"
              onClick={() => {
                window.setTimeout(
                  () => window.dispatchEvent(new Event(UPDATE_CHECK_REQUESTED)),
                  0,
                );
              }}
            >
              <PackageCheck /> Sürüm denetle
            </Button>
          </div>
        </section>

        <section className="border border-white/[0.08] bg-[#0b0d10]">
          <header className="flex h-14 items-center gap-3 border-b border-white/[0.07] px-5">
            <Activity className="size-4 text-red-500" />
            <div>
              <p className="text-[9px] font-black tracking-[0.18em] text-red-500 uppercase">04 // Arayüz</p>
              <p className="mt-1 text-[9px] text-zinc-700">Hareket ve erişilebilirlik tercihleri</p>
            </div>
          </header>
          <SettingRow
            icon={ZapOff}
            title="Hareketleri azalt"
            description="Geçişleri, parlamaları ve tekrar eden animasyonları en aza indirir."
          >
            <SettingToggle
              label="Hareketleri azalt"
              checked={preferences.reduceMotion}
              onChange={(checked) => setPreference("reduceMotion", checked)}
            />
          </SettingRow>
          <div className="flex items-center gap-3 px-5 py-4 text-[9px] text-zinc-600">
            <ShieldCheck className="size-4 text-emerald-500" />
            Tercihler anında uygulanır ve bu cihazda saklanır.
          </div>
        </section>
      </div>
    </div>
  );
}
