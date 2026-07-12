"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Big-touch-target [-] n [+] stepper. No typing required.
 */
export function CounterInput({
  value,
  onChange,
  label,
  hint,
  max = 9999,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  hint?: string | null;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-snug">{label}</span>
        {hint ? (
          <span className="block text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value === 0}
          onClick={() => onChange(Math.max(0, value - 1))}
          className={cn(
            "flex size-11 items-center justify-center rounded-lg border bg-card text-foreground transition-colors",
            value === 0
              ? "opacity-40"
              : "hover:bg-accent active:bg-accent"
          )}
        >
          <Minus className="size-5" />
        </button>
        <span
          className={cn(
            "w-11 text-center text-lg font-semibold tabular-nums",
            value > 0 ? "text-primary" : "text-muted-foreground"
          )}
          aria-live="polite"
        >
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex size-11 items-center justify-center rounded-lg border bg-card text-foreground transition-colors hover:bg-accent active:bg-accent"
        >
          <Plus className="size-5" />
        </button>
      </div>
    </div>
  );
}
