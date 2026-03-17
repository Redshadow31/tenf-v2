import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabase";

const BUCKET = "events-images";

type RouteContext = {
  params: Promise<{ fileName: string }>;
};

function getContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "avif":
      return "image/avif";
    case "jpeg":
    case "jpg":
    default:
      return "image/jpeg";
  }
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { fileName } = await context.params;
    if (!fileName) return NextResponse.json({ error: "Nom de fichier manquant." }, { status: 400 });

    const storagePath = `new-family-aventura/${fileName}`;
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(storagePath);

    if (error || !data) {
      return NextResponse.json({ error: "Image introuvable." }, { status: 404 });
    }

    const arrayBuffer = await data.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": getContentType(fileName),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[api/new-family-aventura/inspiration/images/:fileName] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
