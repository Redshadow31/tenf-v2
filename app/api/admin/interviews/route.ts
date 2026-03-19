import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import {
  createInterview,
  deleteInterview,
  listInterviews,
  updateInterview,
  type InterviewGroupType,
} from "@/lib/interviewsStorage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function sortForAdmin(items: ReturnType<typeof listInterviews>) {
  return [...items].sort((a, b) => {
    if (a.groupType !== b.groupType) return a.groupType.localeCompare(b.groupType);
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const interviews = sortForAdmin(listInterviews());
  return NextResponse.json({ interviews, total: interviews.length });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const youtubeUrl = typeof body?.youtubeUrl === "string" ? body.youtubeUrl.trim() : "";
    const groupType = body?.groupType === "staff" ? "staff" : "member";
    const memberTwitchLogin =
      typeof body?.memberTwitchLogin === "string" ? body.memberTwitchLogin.trim().toLowerCase() : "";
    const memberDisplayName =
      typeof body?.memberDisplayName === "string" ? body.memberDisplayName.trim() : "";

    if (!title || title.length < 2) {
      return NextResponse.json({ error: "Titre invalide (2 caractères minimum)." }, { status: 400 });
    }
    if (!youtubeUrl) {
      return NextResponse.json({ error: "URL YouTube requise." }, { status: 400 });
    }
    if (!memberTwitchLogin || !memberDisplayName) {
      return NextResponse.json(
        { error: "Un membre/interviewé doit être sélectionné via la recherche." },
        { status: 400 }
      );
    }

    const created = createInterview({
      title,
      youtubeUrl,
      groupType: groupType as InterviewGroupType,
      memberTwitchLogin,
      memberDisplayName,
      memberRole: typeof body?.memberRole === "string" ? body.memberRole : undefined,
      isPublished: body?.isPublished === true,
      sortOrder: Number.parseInt(String(body?.sortOrder ?? "100"), 10),
      featured: body?.featured === true,
      thumbnailOverride: typeof body?.thumbnailOverride === "string" ? body.thumbnailOverride : undefined,
      interviewDate: typeof body?.interviewDate === "string" ? body.interviewDate : undefined,
      durationText: typeof body?.durationText === "string" ? body.durationText : undefined,
      updatedBy: admin.discordId,
    });

    return NextResponse.json({ interview: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_YOUTUBE_URL") {
      return NextResponse.json(
        { error: "Lien YouTube invalide. Exemples acceptés: youtu.be/... ou youtube.com/watch?v=..." },
        { status: 400 }
      );
    }
    console.error("[Admin Interviews] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "ID requis." }, { status: 400 });
    }

    const updated = updateInterview(id, {
      title: typeof body?.title === "string" ? body.title : undefined,
      youtubeUrl: typeof body?.youtubeUrl === "string" ? body.youtubeUrl : undefined,
      groupType:
        body?.groupType === "staff" || body?.groupType === "member" ? (body.groupType as InterviewGroupType) : undefined,
      memberTwitchLogin: typeof body?.memberTwitchLogin === "string" ? body.memberTwitchLogin : undefined,
      memberDisplayName: typeof body?.memberDisplayName === "string" ? body.memberDisplayName : undefined,
      memberRole: typeof body?.memberRole === "string" ? body.memberRole : undefined,
      isPublished: typeof body?.isPublished === "boolean" ? body.isPublished : undefined,
      sortOrder:
        body?.sortOrder !== undefined ? Number.parseInt(String(body.sortOrder), 10) : undefined,
      featured: typeof body?.featured === "boolean" ? body.featured : undefined,
      thumbnailOverride: typeof body?.thumbnailOverride === "string" ? body.thumbnailOverride : undefined,
      interviewDate: typeof body?.interviewDate === "string" ? body.interviewDate : undefined,
      durationText: typeof body?.durationText === "string" ? body.durationText : undefined,
      updatedBy: admin.discordId,
    });

    if (!updated) {
      return NextResponse.json({ error: "Interview introuvable." }, { status: 404 });
    }

    return NextResponse.json({ interview: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_YOUTUBE_URL") {
      return NextResponse.json(
        { error: "Lien YouTube invalide. Exemples acceptés: youtu.be/... ou youtube.com/watch?v=..." },
        { status: 400 }
      );
    }
    console.error("[Admin Interviews] PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id") || "";
  if (!id) {
    return NextResponse.json({ error: "ID requis." }, { status: 400 });
  }

  const deleted = deleteInterview(id);
  if (!deleted) {
    return NextResponse.json({ error: "Interview introuvable." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
