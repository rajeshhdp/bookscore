import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/progress-bar";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/constants";
import { formatDate, todayCentral } from "@/lib/utils";
import type { Campaign, CampaignStats } from "@/lib/types";

export function daysRemaining(campaign: Campaign): number {
  const today = new Date(todayCentral() + "T00:00:00");
  const end = new Date(campaign.end_date + "T00:00:00");
  return Math.max(0, Math.round((end.getTime() - today.getTime()) / 86400000));
}

export function campaignStatus(campaign: Campaign): "upcoming" | "active" | "ended" {
  const today = todayCentral();
  if (campaign.start_date > today) return "upcoming";
  if (campaign.end_date < today) return "ended";
  return "active";
}

export function CampaignCard({
  campaign,
  stats,
}: {
  campaign: Campaign;
  stats: CampaignStats;
}) {
  const status = campaignStatus(campaign);
  return (
    <Link href={`/campaigns/${campaign.id}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{campaign.name}</CardTitle>
            <Badge variant={status === "active" ? "default" : "secondary"}>
              {status === "active"
                ? `${daysRemaining(campaign)} days left`
                : status === "upcoming"
                  ? "Upcoming"
                  : "Completed"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {CAMPAIGN_TYPE_LABELS[campaign.type]} · {formatDate(campaign.start_date)}{" "}
            – {formatDate(campaign.end_date)}
          </p>
        </CardHeader>
        <CardContent>
          <ProgressBar value={stats.books} goal={campaign.goal} />
        </CardContent>
      </Card>
    </Link>
  );
}
