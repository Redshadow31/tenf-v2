import type { MetadataRoute } from "next";

const BASE_URL = "https://tenf-community.com";

const routes = [
  "",
  "/membres",
  "/lives",
  "/events2",
  "/integration",
  "/vip",
  "/boutique",
  "/avis-tenf",
  "/fonctionnement-tenf",
  "/upa-event",
  "/postuler",
  "/rejoindre",
  "/auth/login",
  "/unauthorized",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
