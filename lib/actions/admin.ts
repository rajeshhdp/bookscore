"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AdminResult {
  success: boolean;
  error?: string;
}

async function requireCoordinator(): Promise<
  { supabase: SupabaseClient } | { error: string }
> {
  const supabase = await createClient();
  if (!supabase) return { error: "The database is not configured yet." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "coordinator") {
    return { error: "Coordinator access required." };
  }
  return { supabase };
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/campaigns");
  revalidatePath("/admin");
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------
const campaignSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200),
    description: z.string().trim().max(2000).optional().default(""),
    type: z.enum(["bhagavad_gita", "srimad_bhagavatam", "general"]),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date"),
    goal: z.number().int().min(0).max(10_000_000),
    active: z.boolean(),
  })
  .refine((c) => c.endDate >= c.startDate, {
    message: "End date must be on or after the start date",
  });

export type CampaignInput = z.input<typeof campaignSchema>;

export async function saveCampaign(
  input: CampaignInput,
  id?: string
): Promise<AdminResult> {
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }
  const auth = await requireCoordinator();
  if ("error" in auth) return { success: false, error: auth.error };

  const row = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    type: parsed.data.type,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate,
    goal: parsed.data.goal,
    active: parsed.data.active,
  };

  const { error } = id
    ? await auth.supabase.from("campaigns").update(row).eq("id", id)
    : await auth.supabase.from("campaigns").insert(row);

  if (error) return { success: false, error: "Could not save the campaign." };
  revalidateAll();
  return { success: true };
}

export async function deleteCampaign(id: string): Promise<AdminResult> {
  const auth = await requireCoordinator();
  if ("error" in auth) return { success: false, error: auth.error };
  const { error } = await auth.supabase.from("campaigns").delete().eq("id", id);
  if (error) return { success: false, error: "Could not delete the campaign." };
  revalidateAll();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------
const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().trim().max(4000).optional().default(""),
  active: z.boolean(),
});

export type AnnouncementInput = z.input<typeof announcementSchema>;

export async function saveAnnouncement(
  input: AnnouncementInput,
  id?: string
): Promise<AdminResult> {
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }
  const auth = await requireCoordinator();
  if ("error" in auth) return { success: false, error: auth.error };

  const { error } = id
    ? await auth.supabase.from("announcements").update(parsed.data).eq("id", id)
    : await auth.supabase.from("announcements").insert(parsed.data);

  if (error) return { success: false, error: "Could not save the announcement." };
  revalidateAll();
  return { success: true };
}

export async function deleteAnnouncement(id: string): Promise<AdminResult> {
  const auth = await requireCoordinator();
  if ("error" in auth) return { success: false, error: auth.error };
  const { error } = await auth.supabase
    .from("announcements")
    .delete()
    .eq("id", id);
  if (error) return { success: false, error: "Could not delete the announcement." };
  revalidateAll();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Book catalog
// ---------------------------------------------------------------------------
const bookSchema = z.object({
  category: z.enum(["book", "set", "magazine"]),
  title: z.string().trim().min(1, "Title is required").max(200),
  code: z.string().trim().max(10).optional().default(""),
  description: z.string().trim().max(200).optional().default(""),
  sortOrder: z.number().int().min(0).max(1000),
  active: z.boolean(),
});

export type BookInput = z.input<typeof bookSchema>;

export async function saveBook(
  input: BookInput,
  id?: string
): Promise<AdminResult> {
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }
  const auth = await requireCoordinator();
  if ("error" in auth) return { success: false, error: auth.error };

  const row = {
    category: parsed.data.category,
    title: parsed.data.title,
    code: parsed.data.code || null,
    description: parsed.data.description || null,
    sort_order: parsed.data.sortOrder,
    active: parsed.data.active,
  };

  const { error } = id
    ? await auth.supabase.from("books").update(row).eq("id", id)
    : await auth.supabase.from("books").insert(row);

  if (error) return { success: false, error: "Could not save the book." };
  revalidateAll();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Entries (corrections + CSV export)
// ---------------------------------------------------------------------------
export async function deleteEntry(id: string): Promise<AdminResult> {
  const auth = await requireCoordinator();
  if ("error" in auth) return { success: false, error: auth.error };
  const { error } = await auth.supabase
    .from("distribution_entries")
    .delete()
    .eq("id", id);
  if (error) return { success: false, error: "Could not delete the entry." };
  revalidateAll();
  return { success: true };
}

const entryUpdateSchema = z.object({
  devoteeName: z.string().trim().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  donationAmount: z.number().min(0).max(1_000_000),
  locationNote: z.string().trim().max(200).optional().default(""),
});

export async function updateEntry(
  id: string,
  input: z.input<typeof entryUpdateSchema>
): Promise<AdminResult> {
  const parsed = entryUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }
  const auth = await requireCoordinator();
  if ("error" in auth) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from("distribution_entries")
    .update({
      devotee_name: parsed.data.devoteeName,
      date: parsed.data.date,
      donation_amount: parsed.data.donationAmount,
      location_note: parsed.data.locationNote || null,
    })
    .eq("id", id);

  if (error) return { success: false, error: "Could not update the entry." };
  revalidateAll();
  return { success: true };
}

export interface CsvExportResult {
  success: boolean;
  error?: string;
  csv?: string;
  filename?: string;
}

function csvEscape(value: string | number | null): string {
  const s = value === null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportEntriesCsv(): Promise<CsvExportResult> {
  const auth = await requireCoordinator();
  if ("error" in auth) return { success: false, error: auth.error };

  const { data: entries, error } = await auth.supabase
    .from("distribution_entries")
    .select(
      "id, devotee_name, date, donation_amount, location_note, created_at, regions(name), entry_items(quantity, books(title, code, category))"
    )
    .order("date", { ascending: false })
    .limit(5000);

  if (error || !entries) {
    return { success: false, error: "Could not load entries." };
  }

  const header = [
    "Date",
    "Devotee",
    "Region",
    "Location",
    "Book",
    "Code",
    "Category",
    "Quantity",
    "Donation",
  ];
  const lines: string[] = [header.join(",")];

  type ExportRow = {
    date: string;
    devotee_name: string;
    donation_amount: number;
    location_note: string | null;
    regions: { name: string } | null;
    entry_items: {
      quantity: number;
      books: { title: string; code: string | null; category: string } | null;
    }[];
  };

  for (const entry of entries as unknown as ExportRow[]) {
    const base = [
      entry.date,
      entry.devotee_name,
      entry.regions?.name ?? "",
      entry.location_note ?? "",
    ];
    if (entry.entry_items.length === 0) {
      lines.push(
        [...base, "", "", "", "0", entry.donation_amount]
          .map(csvEscape)
          .join(",")
      );
      continue;
    }
    entry.entry_items.forEach((item, i) => {
      lines.push(
        [
          ...base,
          item.books?.title ?? "",
          item.books?.code ?? "",
          item.books?.category ?? "",
          item.quantity,
          // Donation only on the first row of the entry so sums stay correct.
          i === 0 ? entry.donation_amount : "",
        ]
          .map(csvEscape)
          .join(",")
      );
    });
  }

  return {
    success: true,
    csv: lines.join("\n"),
    filename: `book-distribution-${new Date().toISOString().slice(0, 10)}.csv`,
  };
}
