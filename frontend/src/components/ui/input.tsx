import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <input
        className={cn(
          "flex h-10 w-full rounded-lg border border-ink-200 bg-surface px-3 py-2 text-sm text-ink-900 shadow-[inset_0_1px_1px_rgb(0_0_0_/_0.02)] transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-ink-400 hover:border-ink-200 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:opacity-60",
          invalid &&
            "border-risk-600/70 focus-visible:border-risk-600 focus-visible:ring-risk-600/15",
          className,
        )}
        aria-invalid={invalid}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
