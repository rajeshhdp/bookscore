import type { BookCategory, CampaignType } from "./types";

export const CATEGORY_LABELS: Record<BookCategory, string> = {
  book: "Books",
  set: "Sets",
  magazine: "Magazines",
};

export const CATEGORY_ORDER: BookCategory[] = ["book", "set", "magazine"];

/** Display label for a book, e.g. "Small Book (H1)". */
export function bookLabel(book: { title: string; code: string | null }): string {
  return book.code ? `${book.title} (${book.code})` : book.title;
}

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  bhagavad_gita: "Bhagavad-gita Marathon",
  srimad_bhagavatam: "Srimad Bhagavatam Marathon",
  general: "General Campaign",
};

/** Fallback community goal for the monthly progress bar when no campaign is active. */
export const DEFAULT_MONTHLY_GOAL = 5000;

export const PRABHUPADA_QUOTE =
  "There is no doubt about it — to distribute books is our most important activity. Every book distributed is a spiritual seed planted.";
