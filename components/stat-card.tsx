import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  emoji,
  label,
  value,
  sub,
}: {
  emoji: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span aria-hidden="true">{emoji}</span>
          {label}
        </div>
        <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
          {value}
        </div>
        {sub ? (
          <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
