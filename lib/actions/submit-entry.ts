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

  // The submit_entry RPC inserts the entry and its items atomically (for
  // guests and signed-in devotees alike), links the active campaign, and
  // re-validates every input server-side. It returns the total book count.
  const { data: totalBooks, error } = await supabase.rpc("submit_entry", {
    p_devotee_name: data.devoteeName,
    p_region_id: data.regionId,
    p_location_note: data.locationNote || null,
    p_date: data.date,
    p_donation_amount: data.donationAmount,
    p_items: data.items.map((item) => ({
      book_id: item.bookId,
      quantity: item.quantity,
    })),
  });

  if (error) {
    return { success: false, error: "Could not save your entry. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");

  return { success: true, totalBooks: Number(totalBooks) };
}
