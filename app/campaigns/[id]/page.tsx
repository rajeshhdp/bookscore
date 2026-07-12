import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { ProgressBar } from "@/components/progress-bar";
import { campaignStatus, daysRemaining } from "@/components/campaign-card";
import {
  getCampaign,
  getCampaignRegionBreakdown,
  getCampaignStats,
} from "@/lib/queries";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Campaign" };

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const [stats, regions] = await Promise.all([
    getCampaignStats(id),
    getCampaignRegionBreakdown(id),
  ]);
  const status = campaignStatus(campaign);
  const maxRegionBooks = Math.max(1, ...regions.map((r) => r.books));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status === "active"
              ? "Active"
              : status === "upcoming"
                ? "Upcoming"
                : "Completed"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {CAMPAIGN_TYPE_LABELS[campaign.type]} ·{" "}
          {formatDate(campaign.start_date)} – {formatDate(campaign.end_date)}
        </p>
        {campaign.description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {campaign.description}
          </p>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressBar value={stats.books} goal={campaign.goal} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          emoji="📚"
          label="Books"
          value={formatNumber(stats.books)}
        />
        <StatCard
          emoji="🙏"
          label="Participants"
          value={formatNumber(stats.participants)}
        />
        <StatCard
          emoji="⏳"
          label="Days Remaining"
          value={
            status === "ended" ? "Done" : formatNumber(daysRemaining(campaign))
          }
        />
        <StatCard
          emoji="💰"
          label="Donations"
          value={formatCurrency(stats.donations)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regional Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          {regions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No contributions recorded yet — be the first!
            </p>
          ) : (
            <ul className="space-y-3">
              {regions.map((r) => (
                <li key={r.region_name}>
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="font-medium">{r.region_name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatNumber(r.books)} books
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{
                        width: `${Math.round((r.books / maxRegionBooks) * 100)}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
