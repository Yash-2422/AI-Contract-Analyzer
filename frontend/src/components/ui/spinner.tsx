import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  label?: string;
}

/**
 * Extracted from risk-tab's inline loading indicator so every page uses
 * the same animated spinner instead of plain "Loading..." text. risk-tab
 * itself is left untouched and still has its own copy of this markup.
 */
export function Spinner({ className, label }: SpinnerProps) {
  return (
    <div className={cn("flex items-center gap-3 text-sm text-ink-400", className)}>
      <svg className="h-4 w-4 shrink-0 animate-spin text-emerald-600" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      {label && <span>{label}</span>}
    </div>
  );
}