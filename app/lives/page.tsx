import type { Metadata } from "next";

import LivesPageClient from "./LivesPageClient";

/** Widget Streamlabs : URL lue au runtime via /api/lives/streamlabs-charity-widget (voir .env.example). */
export const metadata: Metadata = {
  title: "Lives & cagnotte UPA — Ligue contre le cancer",
  description:
    "Lives de la communaute TENF et suivi de la cagnotte caritative UPA au profit de la Ligue contre le cancer.",
};

export default function LivesPage() {
  return <LivesPageClient />;
}
