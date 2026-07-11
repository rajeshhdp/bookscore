import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EntriesTable, type AdminEntry } from "./entries-table";

export const metadata: Metadata = { title: "Manage Entries" };

export default async function AdminEntriesPage() {
  const supabase = await createClient();
  let entries: AdminEntry[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("distribution_entries")
      .select(
        "id, devotee_name, date, donation_amount, location_note, created_at, regions(name), entry_items(quantity)"
      )
      .order("created_at", { ascending: false })
      .limit(200);
    entries = (data as unknown as AdminEntry[]) ?? [];
  }

  return <EntriesTable entries={entries} />;
}
