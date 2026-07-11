import { isSupabaseConfigured } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

/** Shown when Supabase env vars are missing, so a fresh deploy explains itself. */
export function SetupNotice() {
  if (isSupabaseConfigured()) return null;
  return (
    <Card className="border-dashed">
      <CardContent className="p-4 text-sm text-muted-foreground">
        ⚙️ Supabase is not configured yet. Set{" "}
        <code className="rounded bg-muted px-1 py-0.5">
          NEXT_PUBLIC_SUPABASE_URL
        </code>{" "}
        and{" "}
        <code className="rounded bg-muted px-1 py-0.5">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>{" "}
        — see <code className="rounded bg-muted px-1 py-0.5">docs/SETUP.md</code>{" "}
        in the repository.
      </CardContent>
    </Card>
  );
}
