import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SetupNotice } from "@/components/setup-notice";
import { AdminNav } from "./admin-nav";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentUser, getProfile } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <SetupNotice />
      </div>
    );
  }

  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;

  if (!user || profile?.role !== "coordinator") {
    return (
      <div className="mx-auto max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          This area is for coordinators.{" "}
          {user
            ? "Your account doesn't have coordinator access — ask an existing coordinator to grant it."
            : "Please sign in with a coordinator account."}
        </p>
        {!user ? (
          <Link href="/login" className={cn(buttonVariants())}>
            Sign In
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Coordinator Admin</h1>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
