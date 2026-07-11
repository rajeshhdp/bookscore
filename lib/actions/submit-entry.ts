"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const entrySchema = z.object({
  devoteeName: z.string().trim().min(1, "Please enter your name").max(120),
  regionId: z.string().uuid().nullable(),
  locationNote: z.string().trim().max(200).optional().default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  donationAmount: z.number().min(0).max(1_000_000),
  items: z
    .array(
      z.object({
        bookId: z.string().uuid(),
        quantity: z.number().int().min(1).max(9999),
      })
    )
    .min(1, "Please add at least one book"),
});

export type SubmitEntryInput = z.input<typeof entrySchema>;

export interface SubmitEntryResult {
  success: boolean;
  error?: string;
  totalBooks?: number;
}

export async function submitEntry(
  input: SubmitEntryInput
): Promise<SubmitEntryResult> {
  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid submission",
    };
  }
  const data = parsed.data;

  const supabase = await createClient();
  if (!supabase) {
    return {
      success: false,
      error: "The database is not configured yet. Please contact your coordinator.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Link the entry to an active campaign covering its date, if any.
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id")
    .eq("active", true)
    .lte("start_date", data.date)
    .gte("end_date", data.date)
    .order("created_at", { ascending: false })
    .limit(1);

  const { data: entry, error: entryError } = await supabase
    .from("distribution_entries")
    .insert({
      user_id: user?.id ?? null,
      devotee_name: data.devoteeName,
      region_id: data.regionId,
      location_note: data.locationNote || null,
      date: data.date,
      donation_amount: data.donationAmount,
      campaign_id: campaigns?.[0]?.id ?? null,
    })
    .select("id")
    .single();

  if (entryError || !entry) {
    return { success: false, error: "Could not save your entry. Please try again." };
  }

  const { error: itemsError } = await supabase.from("entry_items").insert(
    data.items.map((item) => ({
      entry_id: entry.id,
      book_id: item.bookId,
      quantity: item.quantity,
    }))
  );

  if (itemsError) {
    // Best-effort cleanup so a half-saved entry doesn't linger.
    await supabase.from("distribution_entries").delete().eq("id", entry.id);
    return { success: false, error: "Could not save your books. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");

  const totalBooks = data.items.reduce((sum, item) => sum + item.quantity, 0);
  return { success: true, totalBooks };
}
