"use client";

import {
  CornerDownLeft,
  Crown,
  Search,
  Swords,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useUfcData } from "@/components/providers/data-provider";
import { FighterAvatar } from "@/components/shared/fighter-avatar";
import { cn } from "@/lib/utils";

function highlight(text: string, query: string): ReactNode {
  const needle = query.trim();
  if (!needle) return text;
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-red-500/20 text-red-300">
        {text.slice(index, index + needle.length)}
      </mark>
      {text.slice(index + needle.length)}
    </>
  );
}

export function GlobalSearch() {
  const { fighters } = useUfcData();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setQuery("");
        setActiveIndex(0);
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("tr-TR");
    if (!needle) return fighters.slice(0, 7);
    return fighters
      .filter((fighter) =>
        [fighter.name, fighter.nickname ?? "", fighter.weight_class, fighter.country ?? ""]
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(needle),
      )
      .slice(0, 9);
  }, [fighters, query]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function selectFighter(id: number) {
    setOpen(false);
    router.push(`/analytics?fighter=${id}`);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const fighter = results[activeIndex];
      if (fighter) selectFighter(fighter.id);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setQuery("");
          setActiveIndex(0);
          setOpen(true);
        }}
        className="group relative flex h-10 w-[clamp(180px,18vw,260px)] items-center gap-2.5 overflow-hidden border border-white/[0.09] bg-[#090b0d] px-3 text-left text-[10px] text-zinc-500 outline-none transition-colors hover:border-red-500/35 hover:text-zinc-300 focus-visible:border-red-500/50"
      >
        <span className="absolute inset-y-0 left-0 w-px bg-red-500/0 transition-colors group-hover:bg-red-500/80" />
        <Search className="size-3.5 shrink-0 text-zinc-500 transition-colors group-hover:text-red-500" />
        <span className="min-w-0 flex-1 truncate tracking-[0.01em]">Dövüşçü veya takma ad ara…</span>
        <kbd className="font-tabular flex items-center gap-0.5 border border-white/[0.08] bg-black/30 px-1.5 py-1 text-[7px] font-bold text-zinc-600">
          CTRL K
        </kbd>
      </button>

      {open && typeof document !== "undefined" ? createPortal((
        <div
          className="animate-in fade-in-0 fixed top-[116px] right-0 bottom-0 left-72 z-[90] flex justify-center bg-[#050607]/48 px-7 pt-5 duration-150 2xl:px-10 2xl:pt-7"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            className="animate-in fade-in-0 slide-in-from-top-2 relative h-fit w-full max-w-[760px] overflow-hidden border border-white/[0.11] bg-[#090b0d] shadow-[0_8px_0_rgba(0,0,0,.34),0_0_28px_-22px_rgba(239,68,68,.55)] duration-150 ease-out"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[2px] bg-red-500/70" />
            <div className="flex h-9 items-center border-b border-white/[0.07] bg-[#07090a] px-4">
              <span className="h-px w-7 bg-red-500" />
              <span className="ml-2 text-[8px] font-black tracking-[0.2em] text-zinc-500 uppercase">
                Roster Arama İndeksi
              </span>
              <span className="ml-auto font-mono text-[7px] tracking-[0.12em] text-zinc-700 uppercase">
                {fighters.length} doğrulanmış profil
              </span>
            </div>

            {/* Search input */}
            <div className="relative flex h-16 items-center gap-3 border-b border-white/[0.09] px-5">
              <span className="absolute inset-y-0 left-0 w-[2px] bg-red-500" />
              <Search className="size-4 shrink-0 text-red-400" strokeWidth={1.8} />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="İsim, takma ad, sıklet veya ülke yazın…"
                className="h-full flex-1 bg-transparent font-display text-base font-semibold tracking-[0.01em] text-white outline-none placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-zinc-600"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Aramayı kapat"
                className="grid size-8 place-items-center border border-white/[0.09] bg-white/[0.018] text-zinc-500 transition-colors hover:border-red-500/40 hover:bg-red-500/[0.06] hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[56vh] overflow-y-auto px-3 py-2">
              <p className="flex items-center justify-between border-b border-white/[0.05] px-2 py-2.5 text-[8px] font-bold tracking-[0.18em] text-zinc-600 uppercase">
                <span className="flex items-center gap-1.5">
                  <span className="h-px w-3 bg-red-500/70" />
                  {query.trim() ? "Arama Sonuçları" : "Dövüşçü Dizini"}
                </span>
                <span className="font-tabular text-zinc-700">
                  {results.length} sonuç
                </span>
              </p>

              {results.map((fighter, index) => {
                const active = index === activeIndex;
                return (
                  <button
                    key={fighter.id}
                    type="button"
                    data-index={index}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => selectFighter(fighter.id)}
                    className={cn(
                      "relative flex w-full items-center gap-3 border-x border-b px-3 py-2.5 text-left transition-colors",
                      active
                        ? "border-red-500/25 bg-red-500/[0.065]"
                        : "border-white/[0.045] bg-transparent hover:bg-white/[0.015]",
                    )}
                  >
                    {active && (
                      <span className="absolute inset-y-0 left-0 w-[3px] bg-red-500" />
                    )}
                    <span className="w-5 shrink-0 font-mono text-[8px] text-zinc-700 tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <FighterAvatar
                      name={fighter.name}
                      champion={Boolean(fighter.is_champion)}
                      imageUrl={fighter.image_url}
                      imagePath={fighter.image_path}
                      className="size-10"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-xs font-bold text-zinc-100">
                          {highlight(fighter.name, query)}
                        </span>
                        {fighter.is_champion ? (
                          <Crown className="size-3 shrink-0 fill-amber-400 text-amber-400" />
                        ) : null}
                      </span>
                      <span className="mt-1 block truncate text-[10px] text-zinc-500">
                        {fighter.nickname ? `“${fighter.nickname}” · ` : ""}
                        {fighter.weight_class}
                        {fighter.country ? ` · ${fighter.country}` : ""}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "hidden shrink-0 border px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase sm:inline-block",
                        "border-white/[0.08] bg-white/[0.025] text-zinc-500",
                      )}
                    >
                      {fighter.style}
                    </span>
                    <span className="font-tabular hidden shrink-0 text-[11px] font-bold text-zinc-300 md:block">
                      {fighter.wins}-{fighter.losses}-{fighter.draws}
                    </span>
                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-1 text-[9px] font-bold tracking-wider uppercase transition-opacity",
                        active ? "text-red-400 opacity-100" : "opacity-0",
                      )}
                    >
                      Aç <CornerDownLeft className="size-3" />
                    </span>
                  </button>
                );
              })}

              {results.length === 0 ? (
                <div className="grid place-items-center px-4 py-14 text-center">
                  <Swords className="mb-3 size-7 text-zinc-800" />
                  <p className="text-sm font-bold text-zinc-400">
                    Eşleşen kayıt bulunamadı
                  </p>
                  <p className="mt-1.5 text-[11px] text-zinc-600">
                    Farklı bir isim, takma ad veya sıklet deneyin.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Keyboard legend */}
            <div className="flex items-center gap-4 border-t border-white/[0.08] bg-[#07090a] px-5 py-2.5 text-[8px] font-semibold tracking-[0.08em] text-zinc-600 uppercase">
              <span className="flex items-center gap-1.5">
                <kbd className="font-tabular border border-white/[0.1] bg-white/[0.03] px-1 py-0.5 text-zinc-400">
                  ↑↓
                </kbd>
                Gezin
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="font-tabular border border-white/[0.1] bg-white/[0.03] px-1 py-0.5 text-zinc-400">
                  ↵
                </kbd>
                Karneyi aç
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="font-tabular border border-white/[0.1] bg-white/[0.03] px-1 py-0.5 text-zinc-400">
                  ESC
                </kbd>
                Kapat
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-zinc-700">
                <Search className="size-3" />
                {fighters.length} kayıt
              </span>
            </div>
          </section>
        </div>
      ), document.body) : null}
    </>
  );
}
