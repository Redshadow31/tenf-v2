import { NextRequest, NextResponse } from "next/server";
import { requireAdvancedAdminAccess } from "@/lib/requireAdmin";
import { supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

const BUCKET = "events-images";
const MAX_SIZE = 5 * 1024 * 1024;

/**
 * Upload bannière 16:9 recommandée — réservé aux admins avancés (blob + fondateurs).
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdvancedAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Accès réservé aux administrateurs avancés." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucune image fournie." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Le fichier doit être une image." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Image trop lourde (max 5 Mo)." }, { status: 400 });
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(extension) ? extension : "jpg";
    const objectName = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;
    const storagePath = `announcements/${objectName}`;

    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });

    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(storagePath, blob, {
      contentType: file.type,
      upsert: false,
      cacheControl: "31536000",
    });

    if (error) {
      console.error("[staff-announcements/upload-image]", error);
      return NextResponse.json({ error: "Upload impossible." }, { status: 500 });
    }

    const imageUrl = `/api/members/announcement-images/announcements/${objectName}`;

    return NextResponse.json({ success: true, imageUrl, storagePath });
  } catch (e) {
    console.error("[staff-announcements/upload-image] POST:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
