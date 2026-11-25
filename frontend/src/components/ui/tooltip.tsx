import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
}) {
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-40 w-max max-w-[16rem] -translate-x-1/2 rounded-md border border-white/10 bg-ink-900 px-2 py-1 text-[0.6875rem] font-medium leading-snug text-paper opacity-0 shadow-lift transition-all duration-150 group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100 group-focus-within/tooltip:translate-y-0 group-focus-within/tooltip:opacity-100",
          side === "top" ? "bottom-full mb-2 translate-y-1" : "top-full mt-2 -translate-y-1",
        )}
      >
        {content}
      </span>
    </span>
  );
}
