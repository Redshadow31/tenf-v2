import { NextResponse } from "next/server";
import { upaEventRepository } from "@/lib/repositories/UpaEventRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug")?.trim() || "upa-event";
    const content = await upaEventRepository.getContent(slug);
    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("[API upa-event/content GET] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
