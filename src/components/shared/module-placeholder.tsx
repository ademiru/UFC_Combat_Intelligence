import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ModulePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  phase: string;
}

export function ModulePlaceholder({
  eyebrow,
  title,
  description,
  icon: Icon,
  features,
  phase,
}: ModulePlaceholderProps) {
  return (
    <section className="relative min-h-[calc(100vh-10rem)] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0f12]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(210,10,10,0.12),transparent_34%)]" />
      <div className="pointer-events-none absolute -right-28 -top-28 size-[420px] rounded-full border border-red-500/10" />
      <div className="pointer-events-none absolute -right-12 -top-12 size-[260px] rounded-full border border-white/[0.04]" />

      <div className="relative flex min-h-[calc(100vh-10rem)] flex-col justify-between p-10 2xl:p-12">
        <div className="flex items-start justify-between">
          <div className="grid size-14 place-items-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 shadow-[0_14px_50px_rgba(185,28,28,0.12)]">
            <Icon className="size-6" />
          </div>
          <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-zinc-500 uppercase">
            {phase}
          </span>
        </div>

        <div className="max-w-3xl py-16">
          <p className="mb-4 text-xs font-bold tracking-[0.2em] text-red-500 uppercase">
            {eyebrow}
          </p>
          <h2 className="max-w-2xl text-5xl leading-[1.05] font-black tracking-[-0.055em] text-white 2xl:text-6xl">
            {title}
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-500">
            {description}
          </p>

          <div className="mt-9 grid max-w-2xl grid-cols-2 gap-3">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3.5 py-3 text-xs font-medium text-zinc-400"
              >
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-red-500/10 text-red-500">
                  <Check className="size-3" />
                </span>
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-white/[0.06] pt-7">
          <div>
            <p className="text-xs font-semibold text-zinc-300">Modül iskeleti hazır</p>
            <p className="mt-1 text-[11px] text-zinc-600">
              Veri katmanı bir sonraki geliştirme adımında bağlanacak.
            </p>
          </div>
          <Button variant="outline" disabled>
            Modülü yapılandır
            <ArrowUpRight />
          </Button>
        </div>
      </div>
    </section>
  );
}

