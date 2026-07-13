import { cn } from "@/lib/utils";

interface OctagonMarkProps {
  className?: string;
}

export function OctagonMark({ className }: OctagonMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      aria-hidden="true"
      src="/brand/combat-mark.png"
      alt=""
      className={cn("size-10 object-contain", className)}
    />
  );
}

