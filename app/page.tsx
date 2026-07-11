import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { ProgressBar } from "@/components/progress-bar";
import { CampaignCard } from "@/components/campaign-card";
import { SetupNotice } from "@/components/setup-notice";
import { Lotus } from "@/components/lotus";
import {
  currentMonthRange,
  getActiveCampaigns,
  getAnnouncements,
  getCampaignStats,
  getMonthlySummary,
} from "@/lib/queries";
import { DEFAULT_MONTHLY_GOAL, PRABHUPADA_QUOTE } from "@/lib/constants";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { start, end } = currentMonthRange();
  const [summary, campaigns, announcements] = await Promise.all([
    getMonthlySummary(start, end),
    getActiveCampaigns(),
    getAnnouncements(),
  ]);
  const featured = campaigns[0];
  const featuredStats = featured ? await getCampaignStats(featured.id) : null;

  const monthGoal =
    featured && featured.goal > 0 ? featured.goal : DEFAULT_MONTHLY_GOAL;
  const monthProgress =
    featured && featuredStats ? featuredStats.books : summary.books;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-accent to-secondary/40 px-6 py-10 text-center sm:py-14">
        <Lotus className="mx-auto h-12 w-20 text-primary" />
        <h1 className="mx-auto mt-3 max-w-xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Sharing Krishna Consciousness Across DFW
        </h1>
        <p className="mx-auto mt-3 max-w-md text-balance text-sm italic text-muted-foreground sm:text-base">
          “{PRABHUPADA_QUOTE}”
        </p>
        <p className="mt-1 text-xs text-muted-foreground">— Srila Prabhupada</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/submit" className={cn(buttonVariants({ size: "lg" }))}>
            <PlusCircle className="size-5" />
            Submit Score
          </Link>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            View Dashboard
          </Link>
        </div>
      </section>

      <SetupNotice />

      {/* This month */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">This Month</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            emoji="📚"
            label="Books Distributed"
            value={formatNumber(summary.books)}
          />
          <StatCard
            emoji="🙏"
            label="Devotees Participating"
            value={formatNumber(summary.devotees)}
          />
          <StatCard
            emoji="📍"
            label="Distribution Locations"
            value={formatNumber(summary.locations)}
          />
          <StatCard
            emoji="💰"
            label="Donations"
            value={formatCurrency(summary.donations)}
          />
        </div>
      </section>

      {/* Community progress */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Together We Are Sharing Krishna Consciousness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressBar
              value={monthProgress}
              goal={monthGoal}
              label={
                featured ? `${featured.name} Offering` : "This Month's Offering"
              }
            />
          </CardContent>
        </Card>
      </section>

      {/* Active campaign */}
      {featured && featuredStats ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Active Campaign</h2>
          <CampaignCard campaign={featured} stats={featuredStats} />
        </section>
      ) : null}

      {/* Announcements */}
      {announcements.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">📢 Announcements</h2>
          <div className="space-y-3">
            {announcements.map((a) => (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="font-medium">{a.title}</div>
                  {a.body ? (
                    <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                      {a.body}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
