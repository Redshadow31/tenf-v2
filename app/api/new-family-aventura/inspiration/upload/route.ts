import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabase";

const BUCKET = "events-images";
const MAX_SIZE = 6 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier envoyé." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Le fichier doit être une image." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Image trop lourde (max 6MB)." }, { status: 400 });
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `nfa-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`;
    const storagePath = `new-family-aventura/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });

    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(storagePath, blob, {
      contentType: file.type,
      upsert: true,
      cacheControl: "31536000",
    });

    if (error) {
      console.error("[api/new-family-aventura/inspiration/upload] upload error:", error);
      return NextResponse.json({ error: "Upload impossible pour le moment." }, { status: 500 });
    }

    return NextResponse.json({
      imageUrl: `/api/new-family-aventura/inspiration/images/${fileName}`,
      fileName,
      storagePath,
    });
  } catch (error) {
    console.error("[api/new-family-aventura/inspiration/upload] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur pendant l'upload." }, { status: 500 });
  }
}
