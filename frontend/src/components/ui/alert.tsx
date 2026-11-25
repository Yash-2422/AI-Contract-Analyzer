import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertTone = "error" | "success" | "warning" | "info";

const TONES: Record<
  AlertTone,
  { wrap: string; icon: string; Icon: typeof AlertCircle }
> = {
  error: {
    wrap: "border-risk-600/20 bg-risk-50/80",
    icon: "text-risk-600",
    Icon: AlertCircle,
  },
  success: {
    wrap: "border-primary/20 bg-primary-soft/70",
    icon: "text-primary",
    Icon: CheckCircle2,
  },
  warning: {
    wrap: "border-gold/25 bg-gold/[0.08]",
    icon: "text-gold",
    Icon: TriangleAlert,
  },
  info: {
    wrap: "border-ink-100 bg-ink-50/80",
    icon: "text-ink-400",
    Icon: Info,
  },
};

export function Alert({
  tone = "info",
  children,
  className,
  role,
  action,
}: {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
  role?: "alert" | "status";
  action?: ReactNode;
}) {
  const { wrap, icon, Icon } = TONES[tone];
  return (
    <div
      role={role ?? (tone === "error" ? "alert" : "status")}
      className={cn("flex items-start gap-3 rounded-lg border px-4 py-3", wrap, className)}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm leading-relaxed text-ink-600">{children}</div>
      {action}
    </div>
  );
}
