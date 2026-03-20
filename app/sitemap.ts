import type { MetadataRoute } from "next";

const BASE_URL = "https://tenf-community.com";

const routes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/a-propos", changeFrequency: "monthly", priority: 0.6 },
  { path: "/communaute-entraide-streamer-twitch", changeFrequency: "weekly", priority: 0.9 },
  { path: "/fonctionnement-tenf", changeFrequency: "weekly", priority: 0.9 },
  { path: "/lives", changeFrequency: "hourly", priority: 0.9 },
  { path: "/events", changeFrequency: "daily", priority: 0.8 },
  { path: "/events2", changeFrequency: "weekly", priority: 0.7 },
  { path: "/evenements-communautaires", changeFrequency: "weekly", priority: 0.8 },
  { path: "/new-family-aventura", changeFrequency: "weekly", priority: 0.8 },
  { path: "/new-family-aventura/infos-pratiques", changeFrequency: "weekly", priority: 0.7 },
  { path: "/new-family-aventura/faq", changeFrequency: "weekly", priority: 0.7 },
  { path: "/new-family-aventura/questions", changeFrequency: "weekly", priority: 0.6 },
  { path: "/vip", changeFrequency: "weekly", priority: 0.8 },
  { path: "/vip/historique", changeFrequency: "weekly", priority: 0.6 },
  { path: "/vip/interviews", changeFrequency: "weekly", priority: 0.6 },
  { path: "/membres", changeFrequency: "weekly", priority: 0.7 },
  { path: "/lives/calendrier", changeFrequency: "weekly", priority: 0.7 },
  { path: "/academy", changeFrequency: "weekly", priority: 0.7 },
  { path: "/boutique", changeFrequency: "weekly", priority: 0.8 },
  { path: "/avis-tenf", changeFrequency: "weekly", priority: 0.8 },
  { path: "/rejoindre", changeFrequency: "weekly", priority: 0.8 },
  { path: "/postuler", changeFrequency: "weekly", priority: 0.8 },
  { path: "/postuler/merci", changeFrequency: "monthly", priority: 0.3 },
  { path: "/upa-event", changeFrequency: "monthly", priority: 0.5 },
  { path: "/soutien-nexou", changeFrequency: "monthly", priority: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
