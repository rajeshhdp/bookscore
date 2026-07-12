"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CounterInput } from "@/components/counter-input";
import { submitEntry } from "@/lib/actions/submit-entry";
import { bookLabel, CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Book, Region } from "@/lib/types";

const NAME_KEY = "bookscore.name";
const REGION_KEY = "bookscore.region";

export function SubmitForm({
  books,
  regions,
  today,
  profileName,
  profileRegionId,
}: {
  books: Book[];
  regions: Region[];
  today: string;
  profileName: string | null;
  profileRegionId: string | null;
}) {
  const [name, setName] = useState(profileName ?? "");
  const [regionId, setRegionId] = useState(profileRegionId ?? "");
  const [locationNote, setLocationNote] = useState("");
  const [date, setDate] = useState(today);
  const [donation, setDonation] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedBooks, setSubmittedBooks] = useState<number | null>(null);

  // Remember guest name/region on this device so repeat reporting is instant.
  useEffect(() => {
    if (!profileName) {
      const saved = localStorage.getItem(NAME_KEY);
      if (saved) setName(saved);
    }
    if (!profileRegionId) {
      const saved = localStorage.getItem(REGION_KEY);
      if (saved) setRegionId(saved);
    }
  }, [profileName, profileRegionId]);

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      books: books.filter((b) => b.category === category),
    })).filter((g) => g.books.length > 0);
  }, [books]);

  const totalBooks = useMemo(
    () => Object.values(quantities).reduce((sum, q) => sum + q, 0),
    [quantities]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (totalBooks === 0) {
      toast.error("Please add at least one book");
      return;
    }
    setSubmitting(true);
    const result = await submitEntry({
      devoteeName: name.trim(),
      regionId: regionId || null,
      locationNote,
      date,
      donationAmount: donation ? Math.max(0, parseFloat(donation) || 0) : 0,
      items: Object.entries(quantities)
        .filter(([, q]) => q > 0)
        .map(([bookId, quantity]) => ({ bookId, quantity })),
    });
    setSubmitting(false);

    if (result.success) {
      localStorage.setItem(NAME_KEY, name.trim());
      if (regionId) localStorage.setItem(REGION_KEY, regionId);
      setSubmittedBooks(result.totalBooks ?? totalBooks);
    } else {
      toast.error(result.error ?? "Something went wrong. Please try again.");
    }
  }

  if (submittedBooks !== null) {
    return (
      <Card className="text-center">
        <CardContent className="space-y-4 p-8">
          <div className="text-5xl" aria-hidden="true">
            🙏
          </div>
          <h2 className="text-xl font-semibold">
            Thank you for your seva, {name.trim()}!
          </h2>
          <p className="text-muted-foreground">
            {submittedBooks} {submittedBooks === 1 ? "book" : "books"} offered —
            every one is a spiritual seed planted.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button
              onClick={() => {
                setQuantities({});
                setDonation("");
                setLocationNote("");
                setSubmittedBooks(null);
              }}
            >
              Submit Another
            </Button>
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              View Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hari Prabhu"
              autoComplete="name"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="region">Region</Label>
              <Select
                id="region"
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
              >
                <option value="">Select region…</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">
              Location{" "}
              <span className="font-normal text-muted-foreground">
                (optional — e.g. India Bazaar)
              </span>
            </Label>
            <Input
              id="location"
              value={locationNote}
              onChange={(e) => setLocationNote(e.target.value)}
              placeholder="Where did you distribute?"
            />
          </div>
        </CardContent>
      </Card>

      {grouped.map(({ category, books: categoryBooks }) => (
        <Card key={category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {CATEGORY_LABELS[category]}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {categoryBooks.map((book) => (
              <CounterInput
                key={book.id}
                label={bookLabel(book)}
                hint={book.description}
                value={quantities[book.id] ?? 0}
                onChange={(v) =>
                  setQuantities((prev) => ({ ...prev, [book.id]: v }))
                }
              />
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Donation{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={donation}
              onChange={(e) => setDonation(e.target.value)}
              placeholder="0.00"
              className="pl-7"
              aria-label="Donation amount in dollars"
            />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-20 z-30 md:bottom-4">
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full shadow-lg"
        >
          {submitting
            ? "Submitting…"
            : totalBooks > 0
              ? `Submit ${totalBooks} ${totalBooks === 1 ? "Book" : "Books"} 🙏`
              : "Submit Score"}
        </Button>
      </div>
    </form>
  );
}
