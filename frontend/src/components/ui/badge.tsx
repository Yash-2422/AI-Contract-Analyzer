import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-[0.625rem] font-medium uppercase tracking-[0.08em]",
  {
    variants: {
      variant: {
        neutral: "border-ink-100 bg-ink-50 text-ink-600",
        emerald: "border-emerald-600/15 bg-emerald-50 text-emerald-700",
        gold: "border-gold/25 bg-gold/10 text-gold",
        brass: "border-brass/30 bg-brass/10 text-brass",
        risk: "border-risk-600/20 bg-risk-50 text-risk-600",
        riskSolid: "border-risk-600 bg-risk-600 text-white",
        accent: "border-accent/25 bg-accent-soft text-accent",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props}>
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            "h-1.5 w-1.5 rounded-full bg-current",
            variant === "gold" && "animate-soft-pulse",
          )}
        />
      )}
      {children}
    </span>
  );
}
