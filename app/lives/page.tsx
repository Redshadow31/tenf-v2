import LivesPageClient from "./LivesPageClient";

/** Widget Streamlabs : URL lue au runtime via /api/lives/streamlabs-charity-widget (voir .env.example). */
export default function LivesPage() {
  return <LivesPageClient />;
}
