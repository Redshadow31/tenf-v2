import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/auth", "/academy/access", "/membres/me"],
      },
    ],
    sitemap: "https://tenf-community.com/sitemap.xml",
    host: "https://tenf-community.com",
  };
}
