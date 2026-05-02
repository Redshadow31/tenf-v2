import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

const BUCKET = "events-images";

/**
 * Proxy lecture images d’annonces serveur : tout membre connecté (Discord).
 * Clé stockage : segments joints (ex. announcements/xxx.webp).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.discordId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const segments = params.path || [];
    if (segments.length === 0) {
      return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
    }

    const storageKey = segments.map((s) => decodeURIComponent(s)).join("/");
    if (!storageKey || storageKey.includes("..")) {
      return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(storageKey);
    if (error || !data) {
      return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
    }

    const extension = storageKey.split(".").pop()?.toLowerCase();
    let contentType = "image/jpeg";
    if (extension === "png") contentType = "image/png";
    else if (extension === "gif") contentType = "image/gif";
    else if (extension === "webp") contentType = "image/webp";
    else if (extension === "svg") contentType = "image/svg+xml";

    const arrayBuffer = await data.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("[announcement-images] GET:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
