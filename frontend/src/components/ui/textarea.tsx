import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full rounded-lg border border-ink-200 bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink-900 shadow-[inset_0_1px_1px_rgb(0_0_0_/_0.02)] transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-ink-400 hover:border-ink-200 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60",
        invalid && "border-risk-600/70 focus-visible:border-risk-600 focus-visible:ring-risk-600/15",
        className,
      )}
      aria-invalid={invalid}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
