import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import {
  CategoryBreakdownChart,
  DailyTrendChart,
  DonationTrendChart,
  MonthlyGrowthChart,
  RegionComparisonChart,
} from "@/components/charts";
import {
  currentMonthRange,
  getCategoryBreakdown,
  getDailyTrend,
  getMonthlySummary,
  getMonthlyTrend,
  getRegionSummary,
} from "@/lib/queries";
import { todayCentral, formatCurrency, formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin Analytics" };

function daysAgo(n: number): string {
  const d = new Date(todayCentral() + "T00:00:00");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default async function AdminAnalyticsPage() {
  const { start, end } = currentMonthRange();
  const trendStart = daysAgo(29);
  const today = todayCentral();

  const [summary, daily, monthly, regions, categories] = await Promise.all([
    getMonthlySummary(start, end),
    getDailyTrend(trendStart, today),
    getMonthlyTrend(6),
    getRegionSummary(start, end),
    getCategoryBreakdown(start, end),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard emoji="📚" label="Books This Month" value={formatNumber(summary.books)} />
        <StatCard emoji="🙏" label="Devotees" value={formatNumber(summary.devotees)} />
        <StatCard emoji="📍" label="Locations" value={formatNumber(summary.locations)} />
        <StatCard emoji="💰" label="Donations" value={formatCurrency(summary.donations)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Daily Books — Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {daily.length === 0 ? (
              <EmptyChart />
            ) : (
              <DailyTrendChart data={daily} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Daily Donations — Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {daily.length === 0 ? (
              <EmptyChart />
            ) : (
              <DonationTrendChart data={daily} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Monthly Books — Last 6 Months
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthly.length === 0 ? (
              <EmptyChart />
            ) : (
              <MonthlyGrowthChart data={monthly} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Book Categories — This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <EmptyChart />
            ) : (
              <CategoryBreakdownChart data={categories} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Region Comparison — This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {regions.every((r) => r.books === 0) ? (
              <EmptyChart />
            ) : (
              <RegionComparisonChart data={regions} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">
      No data yet — charts will appear once entries come in.
    </p>
  );
}
