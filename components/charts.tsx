"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/constants";
import type {
  CategoryBreakdownRow,
  DailyTrendRow,
  MonthlyTrendRow,
  RegionSummaryRow,
} from "@/lib/types";

const BOOKS = "var(--chart-books)";
const DONATIONS = "var(--chart-donations)";
const GRID = "var(--chart-grid)";
const AXIS = "var(--chart-axis)";

const axisProps = {
  tick: { fill: AXIS, fontSize: 12 },
  tickLine: false,
  axisLine: { stroke: GRID },
} as const;

const tooltipStyle = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--card-foreground)",
    fontSize: 12,
  },
  labelStyle: { color: "var(--muted-foreground)" },
  itemStyle: { color: "var(--card-foreground)" },
  cursor: { stroke: GRID },
} as const;

function shortDay(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function shortMonth(m: string) {
  return new Date(m + "-01T00:00:00").toLocaleDateString("en-US", {
    month: "short",
  });
}

export function DailyTrendChart({ data }: { data: DailyTrendRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="day" {...axisProps} tickFormatter={shortDay} minTickGap={24} />
        <YAxis {...axisProps} width={40} allowDecimals={false} />
        <Tooltip
          {...tooltipStyle}
          labelFormatter={(d) => shortDay(String(d))}
          formatter={(value) => [formatNumber(Number(value)), "Books"]}
        />
        <Line
          type="monotone"
          dataKey="books"
          name="Books"
          stroke={BOOKS}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DonationTrendChart({ data }: { data: DailyTrendRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="day" {...axisProps} tickFormatter={shortDay} minTickGap={24} />
        <YAxis {...axisProps} width={48} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          {...tooltipStyle}
          labelFormatter={(d) => shortDay(String(d))}
          formatter={(value) => [formatCurrency(Number(value)), "Donations"]}
        />
        <Line
          type="monotone"
          dataKey="donations"
          name="Donations"
          stroke={DONATIONS}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MonthlyGrowthChart({ data }: { data: MonthlyTrendRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="month" {...axisProps} tickFormatter={shortMonth} />
        <YAxis {...axisProps} width={40} allowDecimals={false} />
        <Tooltip
          {...tooltipStyle}
          cursor={{ fill: "var(--muted)" }}
          formatter={(value) => [formatNumber(Number(value)), "Books"]}
        />
        <Bar
          dataKey="books"
          name="Books"
          fill={BOOKS}
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RegionComparisonChart({ data }: { data: RegionSummaryRow[] }) {
  const rows = data.filter((r) => r.books > 0);
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 36 + 40)}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 4, right: 40, left: 8, bottom: 0 }}
      >
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" {...axisProps} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="region_name"
          {...axisProps}
          width={88}
        />
        <Tooltip
          {...tooltipStyle}
          cursor={{ fill: "var(--muted)" }}
          formatter={(value) => [formatNumber(Number(value)), "Books"]}
        />
        <Bar
          dataKey="books"
          name="Books"
          fill={BOOKS}
          radius={[0, 4, 4, 0]}
          maxBarSize={20}
          label={{ position: "right", fill: AXIS, fontSize: 12 }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryBreakdownChart({
  data,
}: {
  data: CategoryBreakdownRow[];
}) {
  const rows = data.map((r) => ({
    ...r,
    label: CATEGORY_LABELS[r.category],
  }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 40 + 40)}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 4, right: 40, left: 8, bottom: 0 }}
      >
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" {...axisProps} allowDecimals={false} />
        <YAxis type="category" dataKey="label" {...axisProps} width={130} />
        <Tooltip
          {...tooltipStyle}
          cursor={{ fill: "var(--muted)" }}
          formatter={(value) => [formatNumber(Number(value)), "Books"]}
        />
        <Bar
          dataKey="books"
          name="Books"
          fill={BOOKS}
          radius={[0, 4, 4, 0]}
          maxBarSize={20}
          label={{ position: "right", fill: AXIS, fontSize: 12 }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
