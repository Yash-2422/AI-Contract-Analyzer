import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs font-medium uppercase tracking-wide",
  {
    variants: {
      variant: {
        neutral: "bg-ink-100 text-ink-600",
        emerald: "bg-emerald-50 text-emerald-700",
        gold: "bg-gold/10 text-gold",
        risk: "bg-risk-50 text-risk-600",
        riskSolid: "bg-risk-600 text-paper",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}