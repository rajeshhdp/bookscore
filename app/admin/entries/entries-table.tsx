"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteEntry, exportEntriesCsv, updateEntry } from "@/lib/actions/admin";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export interface AdminEntry {
  id: string;
  devotee_name: string;
  date: string;
  donation_amount: number;
  location_note: string | null;
  created_at: string;
  regions: { name: string } | null;
  entry_items: { quantity: number }[];
}

export function EntriesTable({ entries }: { entries: AdminEntry[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    const result = await exportEntriesCsv();
    setBusy(false);
    if (!result.success || !result.csv) {
      toast.error(result.error ?? "Export failed.");
      return;
    }
    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename ?? "entries.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(entry: AdminEntry) {
    const books = entry.entry_items.reduce((s, i) => s + i.quantity, 0);
    if (
      !window.confirm(
        `Delete ${entry.devotee_name}'s entry of ${books} books on ${formatDate(entry.date)}? This cannot be undone.`
      )
    ) {
      return;
    }
    setBusy(true);
    const result = await deleteEntry(entry.id);
    setBusy(false);
    if (result.success) {
      toast.success("Entry deleted.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Could not delete.");
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">
          Entries{" "}
          <span className="font-normal text-muted-foreground">
            (latest {entries.length})
          </span>
        </CardTitle>
        <Button size="sm" variant="outline" onClick={handleExport} disabled={busy}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No entries yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Devotee</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Books</TableHead>
                <TableHead className="text-right">Donation</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) =>
                editingId === entry.id ? (
                  <EditRow
                    key={entry.id}
                    entry={entry}
                    onDone={() => {
                      setEditingId(null);
                      router.refresh();
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(entry.date)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.devotee_name}
                    </TableCell>
                    <TableCell>{entry.regions?.name ?? "—"}</TableCell>
                    <TableCell className="max-w-[160px] truncate">
                      {entry.location_note ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(
                        entry.entry_items.reduce((s, i) => s + i.quantity, 0)
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(entry.donation_amount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Edit entry"
                        className="size-8"
                        onClick={() => setEditingId(entry.id)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Delete entry"
                        className="size-8 text-destructive"
                        disabled={busy}
                        onClick={() => handleDelete(entry)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function EditRow({
  entry,
  onDone,
  onCancel,
}: {
  entry: AdminEntry;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(entry.devotee_name);
  const [date, setDate] = useState(entry.date);
  const [location, setLocation] = useState(entry.location_note ?? "");
  const [donation, setDonation] = useState(String(entry.donation_amount));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateEntry(entry.id, {
      devoteeName: name,
      date,
      donationAmount: parseFloat(donation) || 0,
      locationNote: location,
    });
    setSaving(false);
    if (result.success) {
      toast.success("Entry updated.");
      onDone();
    } else {
      toast.error(result.error ?? "Could not save.");
    }
  }

  return (
    <TableRow>
      <TableCell>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 w-36"
        />
      </TableCell>
      <TableCell>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 w-32"
        />
      </TableCell>
      <TableCell className="text-muted-foreground">
        {entry.regions?.name ?? "—"}
      </TableCell>
      <TableCell>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="h-9 w-32"
        />
      </TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">
        {formatNumber(entry.entry_items.reduce((s, i) => s + i.quantity, 0))}
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={donation}
          onChange={(e) => setDonation(e.target.value)}
          className="h-9 w-24 text-right"
        />
      </TableCell>
      <TableCell className="whitespace-nowrap text-right">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Cancel"
          className="ml-1 size-8"
          onClick={onCancel}
        >
          <X className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
