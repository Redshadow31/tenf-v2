import { NextRequest, NextResponse } from "next/server";
import type { MemberData } from "@/lib/memberData";
import { requirePermission } from "@/lib/requireAdmin";
import {
  appendTimelineEntry,
  createManualTimelineEntry,
  deleteTimelineEntry,
  normalizeTimeline,
  updateTimelineEntry,
  type CreateManualTimelineInput,
} from "@/lib/admin/members-gestion/memberTimeline";
import { memberRepository } from "@/lib/repositories";
import { invalidateAdminDashboardCache } from "@/lib/admin/dashboardSummary";

export const dynamic = "force-dynamic";

type RouteParams = { params: { id: string } };

async function resolveMember(id: string) {
  const decoded = decodeURIComponent(id).trim();
  if (!decoded) return null;

  let member = await memberRepository.findByTwitchLogin(decoded);
  if (!member) member = await memberRepository.findByDiscordId(decoded);
  if (!member) member = await memberRepository.findById(decoded);
  if (!member && /^\d+$/.test(decoded)) {
    member = await memberRepository.findByTwitchId(decoded);
  }
  return member;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const member = await resolveMember(params.id);
    if (!member) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      roleHistory: normalizeTimeline(member.roleHistory as unknown[]),
    });
  } catch (error) {
    console.error("[role-history GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const member = await resolveMember(params.id);
    if (!member?.twitchLogin) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    const body = (await request.json()) as CreateManualTimelineInput;
    const entry = createManualTimelineEntry(body, admin.discordId || admin.username || "admin");
    const roleHistory = appendTimelineEntry(
      normalizeTimeline(member.roleHistory as unknown[]),
      entry,
    );

    const updated = await memberRepository.update(member.twitchLogin, {
      roleHistory: roleHistory as unknown as MemberData["roleHistory"],
      updatedBy: admin.discordId,
    });

    await invalidateAdminDashboardCache();

    return NextResponse.json({
      entry,
      roleHistory: normalizeTimeline(updated.roleHistory as unknown[]),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    const status = message.includes("obligatoire") || message.includes("invalide") ? 400 : 500;
    console.error("[role-history POST]", error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const member = await resolveMember(params.id);
    if (!member?.twitchLogin) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : null;
    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const { id: _omit, ...patch } = body as { id: string } & Partial<CreateManualTimelineInput>;
    const roleHistory = updateTimelineEntry(
      normalizeTimeline(member.roleHistory as unknown[]),
      id,
      patch,
    );

    const updated = await memberRepository.update(member.twitchLogin, {
      roleHistory: roleHistory as unknown as MemberData["roleHistory"],
      updatedBy: admin.discordId,
    });

    await invalidateAdminDashboardCache();

    return NextResponse.json({
      roleHistory: normalizeTimeline(updated.roleHistory as unknown[]),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    const status =
      message.includes("introuvable") || message.includes("manuels") || message.includes("obligatoire")
        ? 400
        : 500;
    console.error("[role-history PATCH]", error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const member = await resolveMember(params.id);
    if (!member?.twitchLogin) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    const id = request.nextUrl.searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const roleHistory = deleteTimelineEntry(
      normalizeTimeline(member.roleHistory as unknown[]),
      id,
    );

    const updated = await memberRepository.update(member.twitchLogin, {
      roleHistory: roleHistory as unknown as MemberData["roleHistory"],
      updatedBy: admin.discordId,
    });

    await invalidateAdminDashboardCache();

    return NextResponse.json({
      roleHistory: normalizeTimeline(updated.roleHistory as unknown[]),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    const status = message.includes("introuvable") || message.includes("manuels") ? 400 : 500;
    console.error("[role-history DELETE]", error);
    return NextResponse.json({ error: message }, { status });
  }
}
