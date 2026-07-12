import "server-only";
import { createClient } from "@/lib/supabase/server";
import { todayCentral } from "@/lib/utils";
import type {
  Announcement,
  Book,
  Campaign,
  CampaignRegionRow,
  CampaignStats,
  CategoryBreakdownRow,
  DailyTrendRow,
  LeaderboardRow,
  MonthlySummary,
  MonthlyTrendRow,
  PersonalStats,
  Profile,
  RecentActivityRow,
  Region,
  RegionSummaryRow,
  TopLocationRow,
} from "@/lib/types";

/** First and last day of the current month (DFW time), as YYYY-MM-DD. */
export function currentMonthRange(): { start: string; end: string } {
  const today = todayCentral(); // YYYY-MM-DD
  const [y, m] = today.split("-").map(Number);
  const start = `${today.slice(0, 8)}01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${today.slice(0, 8)}${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

const EMPTY_SUMMARY: MonthlySummary = {
  books: 0,
  devotees: 0,
  locations: 0,
  donations: 0,
};

export async function getMonthlySummary(
  start: string,
  end: string
): Promise<MonthlySummary> {
  const supabase = await createClient();
  if (!supabase) return EMPTY_SUMMARY;
  const { data, error } = await supabase.rpc("monthly_summary", {
    p_start: start,
    p_end: end,
  });
  if (error || !data?.[0]) return EMPTY_SUMMARY;
  const row = data[0];
  return {
    books: Number(row.books),
    devotees: Number(row.devotees),
    locations: Number(row.locations),
    donations: Number(row.donations),
  };
}

export async function getLeaderboard(
  start: string,
  end: string,
  limit = 10
): Promise<LeaderboardRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.rpc("leaderboard", {
    p_start: start,
    p_end: end,
    p_limit: limit,
  });
  return (data ?? []).map((r: LeaderboardRow) => ({
    display_name: r.display_name,
    books: Number(r.books),
  }));
}

export async function getRecentActivity(limit = 8): Promise<RecentActivityRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.rpc("recent_activity", { p_limit: limit });
  return data ?? [];
}

export async function getDailyTrend(
  start: string,
  end: string
): Promise<DailyTrendRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.rpc("daily_trend", {
    p_start: start,
    p_end: end,
  });
  return (data ?? []).map((r: DailyTrendRow) => ({
    day: r.day,
    books: Number(r.books),
    donations: Number(r.donations),
  }));
}

export async function getMonthlyTrend(months = 6): Promise<MonthlyTrendRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.rpc("monthly_trend", { p_months: months });
  return (data ?? []).map((r: MonthlyTrendRow) => ({
    month: r.month,
    books: Number(r.books),
    donations: Number(r.donations),
  }));
}

export async function getRegionSummary(
  start: string,
  end: string
): Promise<RegionSummaryRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.rpc("region_summary", {
    p_start: start,
    p_end: end,
  });
  return (data ?? []).map((r: RegionSummaryRow) => ({
    ...r,
    books: Number(r.books),
    devotees: Number(r.devotees),
    donations: Number(r.donations),
  }));
}

export async function getCategoryBreakdown(
  start: string,
  end: string
): Promise<CategoryBreakdownRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.rpc("category_breakdown", {
    p_start: start,
    p_end: end,
  });
  return (data ?? []).map((r: CategoryBreakdownRow) => ({
    category: r.category,
    books: Number(r.books),
  }));
}

export async function getRegions(): Promise<Region[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("regions")
    .select("id, name, coordinator_name, sort_order")
    .order("sort_order");
  return data ?? [];
}

export async function getRegion(id: string): Promise<Region | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("regions")
    .select("id, name, coordinator_name, sort_order")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function getRegionTopLocations(
  regionId: string,
  start: string,
  end: string,
  limit = 5
): Promise<TopLocationRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.rpc("region_top_locations", {
    p_region_id: regionId,
    p_start: start,
    p_end: end,
    p_limit: limit,
  });
  return (data ?? []).map((r: TopLocationRow) => ({
    location: r.location,
    books: Number(r.books),
  }));
}

export async function getBooks(includeInactive = false): Promise<Book[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  let query = supabase
    .from("books")
    .select("id, category, title, code, description, sort_order, active")
    .order("category")
    .order("sort_order");
  if (!includeInactive) query = query.eq("active", true);
  const { data } = await query;
  return data ?? [];
}

export async function getCampaigns(): Promise<Campaign[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .order("start_date", { ascending: false });
  return data ?? [];
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

/** Campaigns whose window covers today's date (and are marked active). */
export async function getActiveCampaigns(): Promise<Campaign[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const today = todayCentral();
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("active", true)
    .lte("start_date", today)
    .gte("end_date", today)
    .order("start_date", { ascending: false });
  return data ?? [];
}

export async function getCampaignStats(id: string): Promise<CampaignStats> {
  const supabase = await createClient();
  if (!supabase) return { books: 0, participants: 0, donations: 0 };
  const { data } = await supabase.rpc("campaign_stats", { p_campaign_id: id });
  const row = data?.[0];
  if (!row) return { books: 0, participants: 0, donations: 0 };
  return {
    books: Number(row.books),
    participants: Number(row.participants),
    donations: Number(row.donations),
  };
}

export async function getCampaignRegionBreakdown(
  id: string
): Promise<CampaignRegionRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.rpc("campaign_region_breakdown", {
    p_campaign_id: id,
  });
  return (data ?? []).map((r: CampaignRegionRow) => ({
    region_name: r.region_name,
    books: Number(r.books),
  }));
}

export async function getAnnouncements(activeOnly = true): Promise<Announcement[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  let query = supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (activeOnly) query = query.eq("active", true);
  const { data } = await query;
  return data ?? [];
}

export async function getCurrentUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, name, email, phone, region_id, role, hide_from_leaderboard")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function getPersonalStats(userId: string): Promise<PersonalStats> {
  const supabase = await createClient();
  const empty: PersonalStats = {
    total_books: 0,
    total_entries: 0,
    total_donations: 0,
    first_entry_date: null,
  };
  if (!supabase) return empty;
  const { data } = await supabase.rpc("personal_stats", { p_user_id: userId });
  const row = data?.[0];
  if (!row) return empty;
  return {
    total_books: Number(row.total_books),
    total_entries: Number(row.total_entries),
    total_donations: Number(row.total_donations),
    first_entry_date: row.first_entry_date,
  };
}
