"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin", label: "Analytics" },
  { href: "/admin/entries", label: "Entries" },
  { href: "/admin/campaigns", label: "Campaigns" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/books", label: "Books" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="mt-3 flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
      {tabs.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            pathname === href
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
