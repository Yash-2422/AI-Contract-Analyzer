import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-ink-200 bg-surface/50 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-100 bg-surface text-ink-400 shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-display text-base text-ink-900">{title}</p>
        {description && (
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-400">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
