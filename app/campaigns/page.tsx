import type { Metadata } from "next";
import { CampaignCard, campaignStatus } from "@/components/campaign-card";
import { SetupNotice } from "@/components/setup-notice";
import { getCampaigns, getCampaignStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Campaigns" };

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();
  const stats = await Promise.all(
    campaigns.map((c) => getCampaignStats(c.id))
  );
  const withStats = campaigns.map((campaign, i) => ({
    campaign,
    stats: stats[i],
  }));

  const active = withStats.filter(
    ({ campaign }) => campaign.active && campaignStatus(campaign) === "active"
  );
  const upcoming = withStats.filter(
    ({ campaign }) => campaign.active && campaignStatus(campaign) === "upcoming"
  );
  const past = withStats.filter(
    ({ campaign }) => !campaign.active || campaignStatus(campaign) === "ended"
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marathon Campaigns</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Special pushes like the Bhagavad-gita Marathon — join the wave!
        </p>
      </div>

      <SetupNotice />

      {active.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Active Now</h2>
          <div className="space-y-3">
            {active.map(({ campaign, stats }) => (
              <CampaignCard key={campaign.id} campaign={campaign} stats={stats} />
            ))}
          </div>
        </section>
      ) : null}

      {upcoming.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map(({ campaign, stats }) => (
              <CampaignCard key={campaign.id} campaign={campaign} stats={stats} />
            ))}
          </div>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Past Campaigns</h2>
          <div className="space-y-3">
            {past.map(({ campaign, stats }) => (
              <CampaignCard key={campaign.id} campaign={campaign} stats={stats} />
            ))}
          </div>
        </section>
      ) : null}

      {campaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No campaigns yet. Coordinators can create one from the admin area.
        </p>
      ) : null}
    </div>
  );
}
