import { cn } from "@/lib/utils";

/**
 * Product mark: a serif "A" inside a forest seal, with a small brass
 * counterpoint. Rendered as inline SVG-ish markup so it stays crisp and
 * adapts to the active theme.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.65rem] bg-primary text-primary-foreground shadow-[0_6px_18px_-10px_rgba(0,0,0,0.65)]",
        className,
      )}
    >
      <span className="font-display text-[1.15rem] font-semibold leading-none">A</span>
      <span className="absolute right-[5px] top-[5px] h-1 w-1 rounded-full bg-champagne" />
      <span className="absolute inset-0 rounded-[0.65rem] border border-white/10" />
    </span>
  );
}

export function Wordmark({
  className,
  subtitle = true,
}: {
  className?: string;
  subtitle?: boolean;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <LogoMark />
      <span className="min-w-0">
        <span className="block truncate font-display text-[1.02rem] font-medium leading-tight tracking-[-0.01em] text-ink-900">
          AI Contract Analyzer
        </span>
        {subtitle && (
          <span className="mt-0.5 block font-mono text-[0.55rem] uppercase tracking-[0.2em] text-ink-400">
            Contract intelligence
          </span>
        )}
      </span>
    </span>
  );
}
