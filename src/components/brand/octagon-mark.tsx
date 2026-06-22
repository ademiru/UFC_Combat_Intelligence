import { cn } from "@/lib/utils";

interface OctagonMarkProps {
  className?: string;
}

export function OctagonMark({ className }: OctagonMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("size-10", className)}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 3h18l12 12v18L33 45H15L3 33V15L15 3Z"
        fill="currentColor"
      />
      <path
        d="M17 14v12.4c0 5 2.7 7.6 7 7.6s7-2.6 7-7.6V14h-5v12.2c0 2.2-.7 3.2-2 3.2s-2-1-2-3.2V14h-5Z"
        fill="white"
      />
    </svg>
  );
}

