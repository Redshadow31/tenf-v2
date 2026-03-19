import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import {
  getModerationExerciseTemplateCount,
  getMonthlyExerciseCampaign,
  listMonthlyExerciseCampaigns,
  lockMonthlyExerciseCampaign,
  submitMonthlyExerciseAnswers,
  upsertDraftMonthlyExerciseCampaign,
  type Difficulty,
} from "@/lib/moderationMonthlyExercisesStorage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function sanitizeMonth(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function sanitizeCount(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return 5;
  return Math.max(5, parsed);
}

function sanitizeDifficulties(value: unknown): Difficulty[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item))
    .filter((item): item is Difficulty => item === "facile" || item === "moyen" || item === "difficile");
}

function sanitizeAssignees(value: unknown): Array<{ id: string; label: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const id = typeof item?.id === "string" ? item.id.trim() : "";
      const label = typeof item?.label === "string" ? item.label.trim() : "";
      if (!id || !label) return null;
      return { id, label };
    })
    .filter((item): item is { id: string; label: string } => item !== null);
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const month = sanitizeMonth(request.nextUrl.searchParams.get("month"));
  const campaign = month ? getMonthlyExerciseCampaign(month) : null;
  const campaigns = listMonthlyExerciseCampaigns().slice(0, 12).map((item) => ({
    month: item.month,
    status: item.status,
    updatedAt: item.updatedAt,
    exercises: item.exercises.length,
    assignments: item.assignments.length,
  }));

  return NextResponse.json({
    campaign,
    campaigns,
    templateCount: getModerationExerciseTemplateCount(),
    viewerDiscordId: admin.discordId,
  });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const month = sanitizeMonth(body?.month);
    const count = sanitizeCount(body?.count);
    const difficulties = sanitizeDifficulties(body?.difficulties);
    const assignees = sanitizeAssignees(body?.assignees);

    const campaign = upsertDraftMonthlyExerciseCampaign({
      month,
      count,
      difficulties,
      assignees,
      createdBy: admin.discordId,
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "INVALID_MONTH") {
      return NextResponse.json({ error: "Mois invalide (format attendu: YYYY-MM)." }, { status: 400 });
    }
    if (message === "NO_TEMPLATE_MATCH") {
      return NextResponse.json({ error: "Aucun scénario ne correspond à ces filtres." }, { status: 400 });
    }
    if (message === "CAMPAIGN_LOCKED") {
      return NextResponse.json({ error: "La campagne de ce mois est verrouillée." }, { status: 409 });
    }
    console.error("[Admin Moderation Monthly Exercises] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = typeof body?.action === "string" ? body.action : "";
    const month = sanitizeMonth(body?.month);

    if (action !== "lock") {
      return NextResponse.json({ error: "Action non supportée." }, { status: 400 });
    }

    const campaign = lockMonthlyExerciseCampaign(month, admin.discordId);
    return NextResponse.json({ campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "INVALID_MONTH") {
      return NextResponse.json({ error: "Mois invalide (format attendu: YYYY-MM)." }, { status: 400 });
    }
    if (message === "CAMPAIGN_NOT_FOUND") {
      return NextResponse.json({ error: "Aucune campagne trouvée pour ce mois." }, { status: 404 });
    }
    console.error("[Admin Moderation Monthly Exercises] PATCH error:", error);
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
    const month = sanitizeMonth(body?.month);
    const exerciseId = typeof body?.exerciseId === "string" ? body.exerciseId.trim() : "";
    const notes = typeof body?.notes === "string" ? body.notes : undefined;
    const answers = body?.answers;

    if (!month || !exerciseId) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    const campaign = submitMonthlyExerciseAnswers({
      month,
      assigneeId: admin.discordId,
      submittedBy: admin.discordId,
      exerciseId,
      answers,
      notes,
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "INVALID_MONTH") {
      return NextResponse.json({ error: "Mois invalide (format attendu: YYYY-MM)." }, { status: 400 });
    }
    if (message === "CAMPAIGN_NOT_FOUND") {
      return NextResponse.json({ error: "Aucune campagne trouvée pour ce mois." }, { status: 404 });
    }
    if (message === "ASSIGNMENT_NOT_FOUND") {
      return NextResponse.json({ error: "Aucun exercice assigné à votre profil pour ce mois." }, { status: 404 });
    }
    console.error("[Admin Moderation Monthly Exercises] PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
