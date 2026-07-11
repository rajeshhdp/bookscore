import type { BookCategory, CampaignType } from "./types";

export const CATEGORY_LABELS: Record<BookCategory, string> = {
  bhagavad_gita: "Bhagavad-gita",
  srimad_bhagavatam: "Srimad Bhagavatam",
  krishna_books: "Krishna Books",
  other: "Other Books",
};

export const CATEGORY_ORDER: BookCategory[] = [
  "bhagavad_gita",
  "srimad_bhagavatam",
  "krishna_books",
  "other",
];

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  bhagavad_gita: "Bhagavad-gita Marathon",
  srimad_bhagavatam: "Srimad Bhagavatam Marathon",
  general: "General Campaign",
};

/** Fallback community goal for the monthly progress bar when no campaign is active. */
export const DEFAULT_MONTHLY_GOAL = 5000;

export const PRABHUPADA_QUOTE =
  "There is no doubt about it — to distribute books is our most important activity. Every book distributed is a spiritual seed planted.";
