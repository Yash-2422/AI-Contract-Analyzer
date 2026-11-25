import * as React from "react";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "flex items-center justify-between gap-2 text-[0.8125rem] font-medium leading-none text-ink-600",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";
