import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-6 w-6",
} as const;

export function Spinner({ className, label, size = "md" }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex items-center gap-3 text-sm text-ink-400", className)}
    >
      <span
        className={cn(
          "inline-block animate-spin rounded-full border-2 border-ink-200 border-t-primary",
          SIZES[size],
        )}
        aria-hidden="true"
      />
      {label && <span>{label}</span>}
      {!label && <span className="sr-only">Loading</span>}
    </div>
  );
}
