import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { SetupNotice } from "@/components/setup-notice";
import { getCurrentUser } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/me");

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Sign In</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll email you a magic link — no password needed. Signing in
          keeps your seva history together across devices.
        </p>
      </div>
      <SetupNotice />
      <LoginForm />
      <p className="text-center text-xs text-muted-foreground">
        You can also submit scores without an account from the{" "}
        <a href="/submit" className="underline">
          Submit page
        </a>
        .
      </p>
    </div>
  );
}
