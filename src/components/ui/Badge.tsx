import { HTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type Tone = "info" | "ok" | "open" | "warn";

const map: Record<Tone, string> = {
  info: "bg-fh-lightblue/30 text-fh-blue",
  ok: "bg-emerald-100 text-emerald-700",
  open: "bg-slate-100 text-slate-700",
  warn: "bg-fh-orange/20 text-fh-orange",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "info", ...props }: BadgeProps) {
  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
          map[tone]
        ),
        className
      )}
      {...props}
    />
  );
}