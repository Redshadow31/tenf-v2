import { NextResponse } from "next/server";
import { listAventuraInspirationGallery } from "@/lib/newFamilyAventuraStorage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const fallbackItems = [
  {
    id: "fallback-1",
    title: "Ambiance PortAventura",
    category: "parc",
    description: "Inspiration pour une journée forte en sensations et souvenirs.",
    image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600&auto=format&fit=crop",
    is_published: true,
    is_archived: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    title: "Esprit détente",
    category: "detente",
    description: "Moments de repos et échanges entre membres de la communauté.",
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop",
    is_published: true,
    is_archived: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    title: "Vie communautaire",
    category: "communaute",
    description: "Partager des moments réels au-delà des lives.",
    image_url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1600&auto=format&fit=crop",
    is_published: true,
    is_archived: false,
    created_at: new Date().toISOString(),
  },
];

export async function GET() {
  try {
    const items = await listAventuraInspirationGallery();
    const published = items.filter((item) => item.is_published && !item.is_archived);
    return NextResponse.json({
      items: published.length > 0 ? published : fallbackItems,
      usingFallback: published.length === 0,
    });
  } catch (error) {
    console.error("[api/new-family-aventura/inspiration] GET error:", error);
    return NextResponse.json({ items: fallbackItems, usingFallback: true });
  }
}

