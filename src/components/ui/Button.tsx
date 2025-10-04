"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "subtle" | "warning";

const styles: Record<Variant, string> = {
  primary:
    "bg-fh-blue text-white hover:bg-[#022d56] focus-visible:outline-fh-blue",
  secondary:
    "bg-fh-lightblue/20 text-fh-blue hover:bg-fh-lightblue/30 focus-visible:outline-fh-lightblue",
  subtle:
    "bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:outline-slate-400",
  warning:
    "bg-fh-orange/20 text-fh-orange hover:bg-fh-orange/30 focus-visible:outline-fh-orange",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-inset ring-black/0",
            "transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
            styles[variant]
          ),
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";