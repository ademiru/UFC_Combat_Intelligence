"use client";

import { convertFileSrc } from "@tauri-apps/api/core";
import { Crown } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

interface FighterAvatarProps {
  name: string;
  champion?: boolean;
  className?: string;
  imageUrl?: string | null;
  imagePath?: string | null;
}

const colors = [
  "from-red-700/80 to-red-950",
  "from-zinc-600 to-zinc-950",
  "from-amber-700/70 to-stone-950",
  "from-slate-600 to-slate-950",
];

export function FighterAvatar({
  name,
  champion = false,
  className,
  imageUrl,
  imagePath,
}: FighterAvatarProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const imageSource = useMemo(() => {
    if (imagePath && typeof window !== "undefined") {
      try {
        return convertFileSrc(imagePath);
      } catch {
        return imageUrl ?? null;
      }
    }
    return imageUrl ?? null;
  }, [imagePath, imageUrl]);

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  const colorIndex = Array.from(name).reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );

  return (
    <span
      className={cn(
        "relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br text-xs font-black tracking-wider text-white shadow-lg",
        colors[colorIndex % colors.length],
        className,
      )}
    >
      {imageSource && failedSource !== imageSource ? (
        // Local Tauri asset URLs are dynamic and intentionally bypass Next image optimization.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSource}
          alt={`${name} profil fotoğrafı`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedSource(imageSource)}
          className="absolute inset-0 size-full object-cover object-top"
        />
      ) : (
        initials
      )}
      {champion && (
        <span className="absolute -right-1.5 -top-1.5 z-10 grid size-5 place-items-center rounded-full border-2 border-[#0d0f12] bg-amber-400 text-black">
          <Crown className="size-2.5 fill-current" />
        </span>
      )}
    </span>
  );
}
