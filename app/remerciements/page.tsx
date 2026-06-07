import type { Metadata } from "next";
import RemerciementsClient from "@/components/remerciements/RemerciementsClient";
import { getFormerStaffEntries } from "@/lib/staff/getFormerStaffEntries";

export const dynamic = "force-dynamic";

const TITLE = "Remerciements TENF";
const DESCRIPTION =
  "Remerciements aux anciens membres du staff TENF : une page de gratitude pour visiteurs et membres, distincte de l'équipe active du jour.";
const URL = "https://tenf-community.com/remerciements";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    type: "website",
    siteName: "TENF — Twitch Entraide New Family",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  keywords: [
    "remerciements TENF",
    "ancien staff TENF",
    "Twitch Entraide New Family",
    "histoire TENF",
    "staff TENF",
  ],
};

export default async function RemerciementsPage() {
  const entries = await getFormerStaffEntries();
  return <RemerciementsClient entries={entries} />;
}
