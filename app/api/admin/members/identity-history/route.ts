import { NextRequest, NextResponse } from "next/server";
import { getAllAuditLogs } from "@/lib/adminAudit";
import {
  auditLogMatchesMemberIdentity,
  buildIdentityHistoryFromAuditLogs,
  buildMemberIdentityMatchContext,
  mergeIdentityHistory,
  normalizeIdentityHistory,
} from "@/lib/admin/members-gestion/identityHistory";
import { memberRepository } from "@/lib/repositories";
import { requirePermission } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET — Historique des changements de pseudos / IDs pour un membre.
 * Query: twitchLogin, discordId, twitchId (au moins un identifiant).
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non authentifié ou permissions insuffisantes" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const twitchLogin = searchParams.get("twitchLogin")?.trim().toLowerCase() || undefined;
    const discordId = searchParams.get("discordId")?.trim() || undefined;
    const twitchId = searchParams.get("twitchId")?.trim() || undefined;

    if (!twitchLogin && !discordId && !twitchId) {
      return NextResponse.json(
        { error: "Indiquez au moins twitchLogin, discordId ou twitchId." },
        { status: 400 }
      );
    }

    let storedHistory: ReturnType<typeof normalizeIdentityHistory> = [];
    if (twitchLogin) {
      const member = await memberRepository.findByTwitchLogin(twitchLogin);
      if (member?.identityHistory) {
        storedHistory = normalizeIdentityHistory(member.identityHistory);
      }
    }

    const matchCtx = buildMemberIdentityMatchContext({
      twitchLogin,
      discordId,
      twitchId,
      storedHistory,
    });

    const auditLogs = await getAllAuditLogs({
      resourceType: "member",
      limit: 2500,
    });

    const relevantLogs = auditLogs.filter((log) => auditLogMatchesMemberIdentity(log, matchCtx));
    const fromAudit = buildIdentityHistoryFromAuditLogs(relevantLogs);
    const history = mergeIdentityHistory(storedHistory, fromAudit);

    return NextResponse.json({
      history,
      counts: {
        stored: storedHistory.length,
        fromAudit: fromAudit.length,
        merged: history.length,
      },
    });
  } catch (error) {
    console.error("[identity-history] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
