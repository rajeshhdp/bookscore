import type { Metadata } from "next";
import { SubmitForm } from "./submit-form";
import { SetupNotice } from "@/components/setup-notice";
import { getBooks, getCurrentUser, getProfile, getRegions } from "@/lib/queries";
import { todayCentral } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Submit Score" };

export default async function SubmitPage() {
  const [books, regions, user] = await Promise.all([
    getBooks(),
    getRegions(),
    getCurrentUser(),
  ]);
  const profile = user ? await getProfile(user.id) : null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submit Your Score</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every book counts. Thank you for your seva! 🙏
        </p>
      </div>
      <SetupNotice />
      <SubmitForm
        books={books}
        regions={regions}
        today={todayCentral()}
        profileName={profile?.name || null}
        profileRegionId={profile?.region_id || null}
      />
    </div>
  );
}
