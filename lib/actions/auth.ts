"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface AuthResult {
  success: boolean;
  error?: string;
}

export async function signInWithMagicLink(
  email: string,
  redirectOrigin: string
): Promise<AuthResult> {
  const parsed = z.string().email().safeParse(email.trim());
  if (!parsed.success) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "The database is not configured yet." };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      emailRedirectTo: `${redirectOrigin}/auth/callback?next=/me`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/");
}

const profileSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(120),
  phone: z.string().trim().max(30).optional().default(""),
  regionId: z.string().uuid().nullable(),
  hideFromLeaderboard: z.boolean(),
});

export async function updateProfile(
  input: z.input<typeof profileSchema>
): Promise<AuthResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid profile",
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "The database is not configured yet." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Please sign in first." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      region_id: parsed.data.regionId,
      hide_from_leaderboard: parsed.data.hideFromLeaderboard,
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: "Could not save your profile." };
  }

  revalidatePath("/me");
  return { success: true };
}
