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
          "flex h-10 w-full rounded-md border bg-paper px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 disabled:cursor-not-allowed disabled:opacity-50",
          invalid ? "border-risk-600" : "border-ink-200",
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