"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Flag, Home, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Lotus } from "@/components/lotus";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/campaigns", label: "Campaigns", icon: Flag },
  { href: "/me", label: "My Seva", icon: User },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Top header */}
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Lotus className="h-6 w-9 text-primary" />
            <span className="text-lg tracking-tight">BookScore DFW</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname === href
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
          <Link
            href="/submit"
            className={cn(
              buttonVariants({ size: "sm" }),
              "hidden md:inline-flex"
            )}
          >
            <PlusCircle className="size-4" />
            Submit Score
          </Link>
        </div>
      </header>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {links.slice(0, 2).map(({ href, label, icon: Icon }) => (
            <MobileLink
              key={href}
              href={href}
              label={label}
              active={pathname === href}
            >
              <Icon className="size-5" />
            </MobileLink>
          ))}
          <Link
            href="/submit"
            aria-label="Submit Score"
            className="flex flex-col items-center justify-center py-2"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              <PlusCircle className="size-6" />
            </span>
          </Link>
          {links.slice(2).map(({ href, label, icon: Icon }) => (
            <MobileLink
              key={href}
              href={href}
              label={label}
              active={pathname === href}
            >
              <Icon className="size-5" />
            </MobileLink>
          ))}
        </div>
      </nav>
    </>
  );
}

function MobileLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      {children}
      {label}
    </Link>
  );
}
