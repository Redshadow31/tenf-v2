import { NextResponse } from "next/server";
import { requirePermission, requireSectionAccess } from "@/lib/requireAdmin";
import { staffMonthlyMeetingRepository } from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_SECTION = "/admin/gestion-acces/reunions-staff-mensuelles";

export async function GET() {
  try {
    const admin = await requireSectionAccess(ADMIN_SECTION);
    if (!admin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const meetings = await staffMonthlyMeetingRepository.listAll();
    return NextResponse.json({ success: true, meetings });
  } catch (error) {
    console.error("[API admin/staff/monthly-meetings GET] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sectionAdmin = await requireSectionAccess(ADMIN_SECTION);
    if (!sectionAdmin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const writeAdmin = await requirePermission("write");
    if (!writeAdmin) {
      return NextResponse.json({ error: "Permission ecriture requise" }, { status: 403 });
    }

    const body = (await request.json()) as {
      meetingDate?: string;
      title?: string;
      discours?: unknown;
      compteRendu?: string;
    };

    const meeting = await staffMonthlyMeetingRepository.create(
      {
        meetingDate: String(body?.meetingDate || ""),
        title: typeof body?.title === "string" ? body.title : "",
        discours: Array.isArray(body?.discours) ? body.discours : [],
        compteRendu: typeof body?.compteRendu === "string" ? body.compteRendu : "",
      },
      writeAdmin.discordId || "admin"
    );

    return NextResponse.json({ success: true, meeting });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "INVALID_DATE") {
      return NextResponse.json({ error: "Date invalide (format AAAA-MM-JJ)" }, { status: 400 });
    }
    console.error("[API admin/staff/monthly-meetings POST] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
