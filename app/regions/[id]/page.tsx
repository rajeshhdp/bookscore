import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import {
  currentMonthRange,
  getRegion,
  getRegionSummary,
  getRegionTopLocations,
} from "@/lib/queries";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Region" };

export default async function RegionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const region = await getRegion(id);
  if (!region) notFound();

  const { start, end } = currentMonthRange();
  const [summaries, topLocations] = await Promise.all([
    getRegionSummary(start, end),
    getRegionTopLocations(id, start, end),
  ]);
  const summary = summaries.find((r) => r.region_id === id);

  const monthName = new Date(start + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {region.name} Region
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {monthName} distribution
          {region.coordinator_name
            ? ` · Coordinator: ${region.coordinator_name}`
            : ""}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          emoji="📚"
          label="Books Distributed"
          value={formatNumber(summary?.books ?? 0)}
        />
        <StatCard
          emoji="🙏"
          label="Active Devotees"
          value={formatNumber(summary?.devotees ?? 0)}
        />
        <StatCard
          emoji="💰"
          label="Donations"
          value={formatCurrency(summary?.donations ?? 0)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Locations This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {topLocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No distribution recorded this month yet.
            </p>
          ) : (
            <ol className="space-y-2">
              {topLocations.map((loc, i) => (
                <li
                  key={loc.location}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 text-right tabular-nums text-muted-foreground">
                      {i + 1}.
                    </span>
                    <span className="font-medium">{loc.location}</span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatNumber(loc.books)} books
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
