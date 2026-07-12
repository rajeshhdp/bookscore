import { formatNumber } from "@/lib/utils";

export function ProgressBar({
  value,
  goal,
  label,
  unit = "Books",
}: {
  value: number;
  goal: number;
  label?: string;
  unit?: string;
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div>
      {label ? (
        <div className="mb-1.5 text-sm font-medium text-muted-foreground">
          {label}
        </div>
      ) : null}
      <div
        className="h-4 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={goal}
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-baseline justify-between text-sm">
        <span className="font-semibold tabular-nums">
          {formatNumber(value)} / {formatNumber(goal)} {unit}
        </span>
        <span className="tabular-nums text-muted-foreground">{pct}%</span>
      </div>
    </div>
  );
}
