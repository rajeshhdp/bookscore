export type BookCategory =
  | "bhagavad_gita"
  | "srimad_bhagavatam"
  | "krishna_books"
  | "other";

export type CampaignType = "bhagavad_gita" | "srimad_bhagavatam" | "general";

export type UserRole = "devotee" | "coordinator";

export interface Region {
  id: string;
  name: string;
  coordinator_name: string | null;
  sort_order: number;
}

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  region_id: string | null;
  role: UserRole;
  hide_from_leaderboard: boolean;
}

export interface Book {
  id: string;
  category: BookCategory;
  title: string;
  sort_order: number;
  active: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: CampaignType;
  start_date: string;
  end_date: string;
  goal: number;
  active: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  active: boolean;
  created_at: string;
}

export interface DistributionEntry {
  id: string;
  user_id: string | null;
  devotee_name: string;
  region_id: string | null;
  location_note: string | null;
  date: string;
  donation_amount: number;
  campaign_id: string | null;
  created_at: string;
}

export interface EntryItem {
  id: string;
  entry_id: string;
  book_id: string;
  quantity: number;
}

// Aggregate RPC result shapes
export interface MonthlySummary {
  books: number;
  devotees: number;
  locations: number;
  donations: number;
}

export interface LeaderboardRow {
  display_name: string;
  books: number;
}

export interface DailyTrendRow {
  day: string;
  books: number;
  donations: number;
}

export interface MonthlyTrendRow {
  month: string;
  books: number;
  donations: number;
}

export interface RegionSummaryRow {
  region_id: string;
  region_name: string;
  books: number;
  devotees: number;
  donations: number;
}

export interface CategoryBreakdownRow {
  category: BookCategory;
  books: number;
}

export interface CampaignStats {
  books: number;
  participants: number;
  donations: number;
}

export interface CampaignRegionRow {
  region_name: string;
  books: number;
}

export interface TopLocationRow {
  location: string;
  books: number;
}

export interface RecentActivityRow {
  display_name: string;
  region_name: string | null;
  books: number;
  entry_date: string;
  created_at: string;
}

export interface PersonalStats {
  total_books: number;
  total_entries: number;
  total_donations: number;
  first_entry_date: string | null;
}
