import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-editorial disabled:pointer-events-none disabled:opacity-45 active:translate-y-px [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_8px_20px_-14px_rgba(36,72,62,0.8)] hover:bg-primary-hover hover:shadow-[0_10px_24px_-14px_rgba(36,72,62,0.85)]",
        accent:
          "bg-accent text-white shadow-[0_8px_20px_-14px_rgba(182,109,80,0.8)] hover:bg-accent-hover",
        outline:
          "border border-ink-200 bg-surface/70 text-ink-900 hover:border-ink-200 hover:bg-ink-50",
        subtle:
          "border border-primary/15 bg-primary-soft/70 text-primary hover:border-primary/25 hover:bg-primary-soft",
        ghost: "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
        destructive: "bg-risk-600 text-white hover:bg-risk-600/90",
        link: "h-auto px-0 text-accent underline-offset-4 hover:text-accent-hover hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        xs: "h-8 rounded-md px-2.5 text-xs",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-lg px-6 text-[0.9375rem]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
