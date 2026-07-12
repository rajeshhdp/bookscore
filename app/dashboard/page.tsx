import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { ProgressBar } from "@/components/progress-bar";
import { SetupNotice } from "@/components/setup-notice";
import {
  currentMonthRange,
  getActiveCampaigns,
  getCampaignStats,
  getLeaderboard,
  getMonthlySummary,
  getRecentActivity,
  getRegionSummary,
} from "@/lib/queries";
import { DEFAULT_MONTHLY_GOAL } from "@/lib/constants";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { start, end } = currentMonthRange();
  const [summary, leaderboard, recent, regions, campaigns] = await Promise.all([
    getMonthlySummary(start, end),
    getLeaderboard(start, end, 10),
    getRecentActivity(8),
    getRegionSummary(start, end),
    getActiveCampaigns(),
  ]);
  const featured = campaigns[0];
  const featuredStats = featured ? await getCampaignStats(featured.id) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Community Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Together we are sharing Krishna consciousness across DFW.
        </p>
      </div>

      <SetupNotice />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          emoji="📚"
          label="Books This Month"
          value={formatNumber(summary.books)}
        />
        <StatCard
          emoji="🙏"
          label="Devotees"
          value={formatNumber(summary.devotees)}
        />
        <StatCard
          emoji="📍"
          label="Locations"
          value={formatNumber(summary.locations)}
        />
        <StatCard
          emoji="💰"
          label="Donations"
          value={formatCurrency(summary.donations)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">This Month&apos;s Offering</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressBar
            value={
              featured && featuredStats ? featuredStats.books : summary.books
            }
            goal={
              featured && featured.goal > 0
                ? featured.goal
                : DEFAULT_MONTHLY_GOAL
            }
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Seva contributions (leaderboard) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              🌸 Seva Contributions This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No entries yet this month — be the first to offer!
              </p>
            ) : (
              <ol className="space-y-2">
                {leaderboard.map((row, i) => (
                  <li
                    key={`${row.display_name}-${i}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">
                        {i + 1}.
                      </span>
                      <span className="truncate font-medium">
                        {row.display_name}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatNumber(row.books)} books
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Seva</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {recent.map((r, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{r.display_name}</span>{" "}
                    <span className="text-muted-foreground">
                      offered {formatNumber(r.books)}{" "}
                      {r.books === 1 ? "book" : "books"}
                      {r.region_name ? ` in ${r.region_name}` : ""} ·{" "}
                      {formatDate(r.entry_date)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Regions */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Regions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {regions.map((r) => (
            <Link key={r.region_id} href={`/regions/${r.region_id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="text-sm font-medium">{r.region_name}</div>
                  <div className="mt-1 text-xl font-semibold tabular-nums">
                    {formatNumber(r.books)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    books · {formatNumber(r.devotees)}{" "}
                    {r.devotees === 1 ? "devotee" : "devotees"}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {regions.length === 0 ? (
            <p className="col-span-full text-sm text-muted-foreground">
              Regions will appear here once the database is set up.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
