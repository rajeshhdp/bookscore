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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteCampaign, saveCampaign } from "@/lib/actions/admin";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/utils";
import type { Campaign, CampaignType } from "@/lib/types";

export function CampaignsManager({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Campaign | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleDelete(campaign: Campaign) {
    if (
      !window.confirm(
        `Delete campaign "${campaign.name}"? Entries stay, but the campaign page and goal disappear.`
      )
    ) {
      return;
    }
    setBusy(true);
    const result = await deleteCampaign(campaign.id);
    setBusy(false);
    if (result.success) {
      toast.success("Campaign deleted.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Could not delete.");
    }
  }

  return (
    <div className="space-y-4">
      {editing ? (
        <CampaignForm
          campaign={editing === "new" ? null : editing}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <Button onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          New Campaign
        </Button>
      )}

      <div className="space-y-3">
        {campaigns.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2 font-medium">
                  {c.name}
                  {!c.active ? <Badge variant="outline">Inactive</Badge> : null}
                </div>
                <div className="text-xs text-muted-foreground">
                  {CAMPAIGN_TYPE_LABELS[c.type]} · {formatDate(c.start_date)} –{" "}
                  {formatDate(c.end_date)} · Goal {formatNumber(c.goal)}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Edit ${c.name}`}
                  className="size-9"
                  onClick={() => setEditing(c)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${c.name}`}
                  className="size-9 text-destructive"
                  disabled={busy}
                  onClick={() => handleDelete(c)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No campaigns yet. Create your first marathon!
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CampaignForm({
  campaign,
  onDone,
  onCancel,
}: {
  campaign: Campaign | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(campaign?.name ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [type, setType] = useState<CampaignType>(campaign?.type ?? "general");
  const [startDate, setStartDate] = useState(campaign?.start_date ?? "");
  const [endDate, setEndDate] = useState(campaign?.end_date ?? "");
  const [goal, setGoal] = useState(String(campaign?.goal ?? ""));
  const [active, setActive] = useState(campaign?.active ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await saveCampaign(
      {
        name,
        description,
        type,
        startDate,
        endDate,
        goal: parseInt(goal, 10) || 0,
        active,
      },
      campaign?.id
    );
    setSaving(false);
    if (result.success) {
      toast.success(campaign ? "Campaign updated." : "Campaign created.");
      onDone();
    } else {
      toast.error(result.error ?? "Could not save.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {campaign ? "Edit Campaign" : "New Campaign"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Name</Label>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bhagavad-gita Marathon 2026"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-desc">Description</Label>
            <Textarea
              id="c-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-type">Type</Label>
              <Select
                id="c-type"
                value={type}
                onChange={(e) => setType(e.target.value as CampaignType)}
              >
                <option value="general">General</option>
                <option value="bhagavad_gita">Bhagavad-gita</option>
                <option value="srimad_bhagavatam">Srimad Bhagavatam</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-start">Start</Label>
              <Input
                id="c-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-end">End</Label>
              <Input
                id="c-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-goal">Goal (books)</Label>
              <Input
                id="c-goal"
                type="number"
                min="0"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                required
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
            Active
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Campaign"}
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
