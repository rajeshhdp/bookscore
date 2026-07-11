"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateProfile } from "@/lib/actions/auth";
import type { Region } from "@/lib/types";

export function ProfileForm({
  regions,
  initialName,
  initialPhone,
  initialRegionId,
  initialHide,
}: {
  regions: Region[];
  initialName: string;
  initialPhone: string;
  initialRegionId: string;
  initialHide: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [regionId, setRegionId] = useState(initialRegionId);
  const [hide, setHide] = useState(initialHide);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await updateProfile({
      name,
      phone,
      regionId: regionId || null,
      hideFromLeaderboard: hide,
    });
    setSaving(false);
    if (result.success) {
      toast.success("Profile saved 🙏");
    } else {
      toast.error(result.error ?? "Could not save.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Name</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="profile-phone">Phone (optional)</Label>
          <Input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-region">Region</Label>
          <Select
            id="profile-region"
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
      </div>
      <label className="flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={hide}
          onChange={(e) => setHide(e.target.checked)}
          className="size-4 accent-[var(--primary)]"
        />
        Show me as &ldquo;A Devotee&rdquo; on public leaderboards
      </label>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save Profile"}
      </Button>
    </form>
  );
}
