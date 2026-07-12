import type { Metadata } from "next";
import { getAnnouncements } from "@/lib/queries";
import { AnnouncementsManager } from "./announcements-manager";

export const metadata: Metadata = { title: "Manage Announcements" };

export default async function AdminAnnouncementsPage() {
  const announcements = await getAnnouncements(false);
  return <AnnouncementsManager announcements={announcements} />;
}
