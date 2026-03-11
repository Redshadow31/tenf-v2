import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TENF New Family",
    short_name: "TENF",
    description: "Plateforme TENF New Family - sombre, moderne, professionnelle",
    start_url: "/",
    display: "standalone",
    background_color: "#0e0e10",
    theme_color: "#9146ff",
    icons: [
      {
        src: "/Tenf.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/Tenf.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
