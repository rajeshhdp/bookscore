"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { saveBook } from "@/lib/actions/admin";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/constants";
import type { Book, BookCategory } from "@/lib/types";

export function BooksManager({ books }: { books: Book[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Book | "new" | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Books shown on the submission form. Deactivate a title instead of
        deleting it so past entries keep their history.
      </p>
      {editing ? (
        <BookForm
          book={editing === "new" ? null : editing}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <Button onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          Add Book
        </Button>
      )}

      {CATEGORY_ORDER.map((category) => {
        const group = books.filter((b) => b.category === category);
        if (group.length === 0) return null;
        return (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {CATEGORY_LABELS[category]}
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {group.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    {book.title}
                    {!book.active ? (
                      <Badge variant="outline">Inactive</Badge>
                    ) : null}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Edit ${book.title}`}
                    className="size-8"
                    onClick={() => setEditing(book)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function BookForm({
  book,
  onDone,
  onCancel,
}: {
  book: Book | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState<BookCategory>(
    book?.category ?? "other"
  );
  const [title, setTitle] = useState(book?.title ?? "");
  const [sortOrder, setSortOrder] = useState(String(book?.sort_order ?? 0));
  const [active, setActive] = useState(book?.active ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await saveBook(
      {
        category,
        title,
        sortOrder: parseInt(sortOrder, 10) || 0,
        active,
      },
      book?.id
    );
    setSaving(false);
    if (result.success) {
      toast.success(book ? "Book updated." : "Book added.");
      onDone();
    } else {
      toast.error(result.error ?? "Could not save.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {book ? "Edit Book" : "Add Book"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label htmlFor="b-category">Category</Label>
              <Select
                id="b-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as BookCategory)}
              >
                {CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-title">Title</Label>
              <Input
                id="b-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-sort">Sort order</Label>
              <Input
                id="b-sort"
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
          </div>
          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            Shown on the submission form
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
