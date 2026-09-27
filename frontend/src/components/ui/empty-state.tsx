import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2 py-6 text-center", className)}>
      <Icon className="h-6 w-6 text-ink-400" />
      <p className="text-sm text-ink-400">{title}</p>
      {action}
    </div>
  );
}