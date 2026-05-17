import type { Metadata } from "next";

import LivesPageClient from "./LivesPageClient";

/** Widget Streamlabs : URL lue au runtime via /api/lives/streamlabs-charity-widget (voir .env.example). */
const TITLE = "Lives en direct — TENF";
const DESCRIPTION =
  "Toutes les streameuses et streamers TENF actuellement en live sur Twitch. Découvre la communauté francophone, soutiens les créateurs, et suis les lives caritatifs (UPA × Ligue contre le cancer). Tirage au sort inclus pour sortir de ta zone de confort.";
const URL = "https://tenf-community.com/lives";

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
    "lives TENF",
    "streamers Twitch en direct",
    "communauté Twitch francophone",
    "TENF Twitch",
  ],
};

export default function LivesPage() {
  return <LivesPageClient />;
}
