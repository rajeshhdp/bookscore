"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteAnnouncement, saveAnnouncement } from "@/lib/actions/admin";
import type { Announcement } from "@/lib/types";

export function AnnouncementsManager({
  announcements,
}: {
  announcements: Announcement[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Announcement | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleDelete(a: Announcement) {
    if (!window.confirm(`Delete announcement "${a.title}"?`)) return;
    setBusy(true);
    const result = await deleteAnnouncement(a.id);
    setBusy(false);
    if (result.success) {
      toast.success("Announcement deleted.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Could not delete.");
    }
  }

  return (
    <div className="space-y-4">
      {editing ? (
        <AnnouncementForm
          announcement={editing === "new" ? null : editing}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <Button onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          New Announcement
        </Button>
      )}

      <div className="space-y-3">
        {announcements.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium">
                  {a.title}
                  {!a.active ? <Badge variant="outline">Hidden</Badge> : null}
                </div>
                {a.body ? (
                  <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-muted-foreground">
                    {a.body}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Edit ${a.title}`}
                  className="size-9"
                  onClick={() => setEditing(a)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${a.title}`}
                  className="size-9 text-destructive"
                  disabled={busy}
                  onClick={() => handleDelete(a)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        ) : null}
      </div>
    </div>
  );
}

function AnnouncementForm({
  announcement,
  onDone,
  onCancel,
}: {
  announcement: Announcement | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [body, setBody] = useState(announcement?.body ?? "");
  const [active, setActive] = useState(announcement?.active ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await saveAnnouncement(
      { title, body, active },
      announcement?.id
    );
    setSaving(false);
    if (result.success) {
      toast.success(announcement ? "Announcement updated." : "Announcement posted.");
      onDone();
    } else {
      toast.error(result.error ?? "Could not save.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {announcement ? "Edit Announcement" : "New Announcement"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="a-title">Title</Label>
            <Input
              id="a-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bhagavad-gita Marathon starts Dec 1"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-body">Details</Label>
            <Textarea
              id="a-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
            />
          </div>
          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            Visible on home page
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
