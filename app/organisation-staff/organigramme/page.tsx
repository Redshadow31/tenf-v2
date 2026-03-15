import OrganigrammeClient from "./OrganigrammeClient";
import { getPublicOrgChartEntries } from "@/lib/staff/getPublicOrgChartEntries";

export const dynamic = "force-dynamic";

export default async function OrganigrammeInteractifPage() {
  const entries = await getPublicOrgChartEntries();
  return <OrganigrammeClient entries={entries} />;
}

