import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { SetupNotice } from "@/components/setup-notice";
import { ProfileForm } from "./profile-form";
import { SignOutButton } from "./sign-out-button";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUser,
  getPersonalStats,
  getProfile,
  getRegions,
} from "@/lib/queries";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Seva" };

interface OwnEntry {
  id: string;
  date: string;
  donation_amount: number;
  location_note: string | null;
  campaign_id: string | null;
  regions: { name: string } | null;
  entry_items: { quantity: number }[];
}

export default async function MePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">My Seva</h1>
        <SetupNotice />
        <p className="text-sm text-muted-foreground">
          Sign in to see your personal contributions and keep your seva history
          together across devices.
        </p>
        <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
          Sign In
        </Link>
      </div>
    );
  }

  const [profile, stats, regions] = await Promise.all([
    getProfile(user.id),
    getPersonalStats(user.id),
    getRegions(),
  ]);

  const supabase = await createClient();
  let entries: OwnEntry[] = [];
  let campaignEntries = 0;
  if (supabase) {
    const { data } = await supabase
      .from("distribution_entries")
      .select(
        "id, date, donation_amount, location_note, campaign_id, regions(name), entry_items(quantity)"
      )
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(10);
    entries = (data as unknown as OwnEntry[]) ?? [];
    const { count } = await supabase
      .from("distribution_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("campaign_id", "is", null);
    campaignEntries = count ?? 0;
  }

  const achievements = [
    {
      earned: stats.total_books >= 1,
      emoji: "🌱",
      label: "First Book Distributed",
    },
    { earned: stats.total_books >= 100, emoji: "📚", label: "100 Books Served" },
    { earned: stats.total_books >= 500, emoji: "🙏", label: "500 Books Served" },
    {
      earned: campaignEntries > 0,
      emoji: "🌟",
      label: "Marathon Participant",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Seva</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile?.name ? `Hare Krishna, ${profile.name}!` : user.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {profile?.role === "coordinator" ? (
            <Link
              href="/admin"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Admin
            </Link>
          ) : null}
          <SignOutButton />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          emoji="📚"
          label="Total Books"
          value={formatNumber(stats.total_books)}
        />
        <StatCard
          emoji="📝"
          label="Entries"
          value={formatNumber(stats.total_entries)}
        />
        <StatCard
          emoji="💰"
          label="Donations Collected"
          value={formatCurrency(stats.total_donations)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Achievements</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {achievements.map((a) => (
            <Badge
              key={a.label}
              variant={a.earned ? "accent" : "outline"}
              className={cn("px-3 py-1 text-sm", !a.earned && "opacity-50")}
            >
              {a.emoji} {a.label}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No entries yet —{" "}
              <Link href="/submit" className="underline">
                submit your first score
              </Link>
              ! Entries you submitted while signed out are counted in community
              totals but aren&apos;t linked to your account.
            </p>
          ) : (
            <ul className="divide-y">
              {entries.map((e) => {
                const books = e.entry_items.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                );
                return (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-medium">
                        {formatNumber(books)} {books === 1 ? "book" : "books"}
                        {e.donation_amount > 0
                          ? ` · ${formatCurrency(e.donation_amount)}`
                          : ""}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {formatDate(e.date)}
                        {e.regions?.name ? ` · ${e.regions.name}` : ""}
                        {e.location_note ? ` · ${e.location_note}` : ""}
                      </div>
                    </div>
                    {e.campaign_id ? <Badge variant="secondary">🌟</Badge> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            regions={regions}
            initialName={profile?.name ?? ""}
            initialPhone={profile?.phone ?? ""}
            initialRegionId={profile?.region_id ?? ""}
            initialHide={profile?.hide_from_leaderboard ?? false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
