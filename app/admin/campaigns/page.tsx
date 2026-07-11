import type { Metadata } from "next";
import { getCampaigns } from "@/lib/queries";
import { CampaignsManager } from "./campaigns-manager";

export const metadata: Metadata = { title: "Manage Campaigns" };

export default async function AdminCampaignsPage() {
  const campaigns = await getCampaigns();
  return <CampaignsManager campaigns={campaigns} />;
}
