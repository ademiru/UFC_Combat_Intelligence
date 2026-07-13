"use client";

import { Maximize2, Minus, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { OctagonMark } from "@/components/brand/octagon-mark";

async function runWindowAction(action: "minimize" | "maximize" | "close") {
  if (!("__TAURI_INTERNALS__" in window)) return;

  const appWindow = getCurrentWindow();
  if (action === "minimize") await appWindow.minimize();
  if (action === "maximize") await appWindow.toggleMaximize();
  if (action === "close") await appWindow.close();
}

export function WindowTitlebar() {
  return (
    <div
      data-tauri-drag-region
      onDoubleClick={() => void runWindowAction("maximize")}
      className="fixed inset-x-0 top-0 z-[100] flex h-9 select-none items-center overflow-hidden border-b border-white/[0.08] bg-[#07080a] text-zinc-500 shadow-[0_2px_18px_rgba(225,20,20,.1)]"
    >
      <div
        data-tauri-drag-region
        className="relative flex h-full w-96 shrink-0 items-center gap-2.5 border-r border-red-500/20 bg-[linear-gradient(90deg,rgba(225,20,20,.08),rgba(225,20,20,.015)_72%,transparent)] px-4 pr-20 [clip-path:polygon(0_0,100%_0,calc(100%-24px)_100%,0_100%)]"
      >
        <span className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-red-600 shadow-[2px_0_10px_rgba(239,68,68,.32)]" />
        <OctagonMark className="size-5" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/combat-wordmark-dark.png"
          alt="Combat Intelligence"
          className="pointer-events-none h-[22px] w-[174px] object-contain object-left"
        />
      </div>

      <div data-tauri-drag-region className="relative -ml-6 flex h-full flex-1 items-center pl-12 pr-4">
        <span className="h-px w-12 bg-gradient-to-r from-red-500/65 to-transparent" />
        <span className="ml-3 text-[8px] font-bold tracking-[0.27em] text-zinc-600 uppercase">
          Tactical Operations Console
        </span>
        <span className="ml-auto mr-4 text-[7px] font-semibold tracking-[0.18em] text-zinc-700 uppercase">
          Local-first intelligence
        </span>
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-red-500/35 via-transparent to-red-500/20" />
      </div>

      <div className="flex h-full border-l border-white/[0.07]">
        <WindowButton label="Küçült" onClick={() => void runWindowAction("minimize")}>
          <Minus className="size-3.5" strokeWidth={1.7} />
        </WindowButton>
        <WindowButton label="Büyüt / geri yükle" onClick={() => void runWindowAction("maximize")}>
          <Maximize2 className="size-3" strokeWidth={1.7} />
        </WindowButton>
        <WindowButton danger label="Kapat" onClick={() => void runWindowAction("close")}>
          <X className="size-3.5" strokeWidth={1.7} />
        </WindowButton>
      </div>
    </div>
  );
}

function WindowButton({
  children,
  danger = false,
  label,
  onClick,
}: {
  children: React.ReactNode;
  danger?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onDoubleClick={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`group relative grid h-full w-12 place-items-center border-l border-white/[0.06] transition-colors before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-transparent before:transition-colors ${
        danger
          ? "hover:bg-red-600 hover:text-white hover:before:bg-red-300"
          : "hover:bg-white/[0.065] hover:text-white hover:before:bg-red-500/70"
      }`}
    >
      {children}
    </button>
  );
}
