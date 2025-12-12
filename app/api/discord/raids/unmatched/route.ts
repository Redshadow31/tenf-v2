import { NextRequest, NextResponse } from 'next/server';
import { loadUnmatchedRaids, removeUnmatchedRaid, recordRaidByDiscordId } from '@/lib/raids';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';
import { getMonthKey } from '@/lib/raids';

/**
 * GET - Récupère les messages non reconnus pour un mois donné
 * Query params: ?month=YYYY-MM
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    let monthKey: string | undefined;
    
    if (monthParam) {
      const monthMatch = monthParam.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1]);
        const month = parseInt(monthMatch[2]);
        if (month >= 1 && month <= 12) {
          monthKey = getMonthKey(year, month);
        }
      }
    }
    
    const unmatched = await loadUnmatchedRaids(monthKey);
    
    return NextResponse.json({
      unmatched,
      month: monthKey || getMonthKey(new Date().getFullYear(), new Date().getMonth() + 1),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des messages non reconnus:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST - Valide manuellement un raid non reconnu
 * Body: { messageId: string, raiderDiscordId: string, targetDiscordId: string, month?: string }
 */
export async function POST(request: NextRequest) {
  let messageId: string | undefined;
  let raiderDiscordId: string | undefined;
  let targetDiscordId: string | undefined;
  let month: string | undefined;
  let monthKey: string | undefined;
  
  try {
    const body = await request.json();
    messageId = body.messageId;
    raiderDiscordId = body.raiderDiscordId;
    targetDiscordId = body.targetDiscordId;
    month = body.month;
    
    if (!messageId || !raiderDiscordId || !targetDiscordId) {
      return NextResponse.json(
        { error: "messageId, raiderDiscordId et targetDiscordId sont requis" },
        { status: 400 }
      );
    }
    
    // Vérifier que les membres existent
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    
    const raider = allMembers.find(m => m.discordId === raiderDiscordId);
    const target = allMembers.find(m => m.discordId === targetDiscordId);
    
    if (!raider) {
      return NextResponse.json(
        { error: `Raider non trouvé: ${raiderDiscordId}` },
        { status: 404 }
      );
    }
    
    if (!target) {
      return NextResponse.json(
        { error: `Cible non trouvée: ${targetDiscordId}` },
        { status: 404 }
      );
    }
    
    // Déterminer le monthKey
    if (month) {
      const monthMatch = month.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1]);
        const monthNum = parseInt(monthMatch[2]);
        if (monthNum >= 1 && monthNum <= 12) {
          monthKey = getMonthKey(year, monthNum);
        }
      }
    }
    
    // Si monthKey n'est pas défini, utiliser le mois en cours
    if (!monthKey) {
      const { getCurrentMonthKey } = await import('@/lib/raids');
      monthKey = getCurrentMonthKey();
      console.warn(`[Unmatched Raids] MonthKey non défini, utilisation du mois en cours: ${monthKey}`);
    }
    
    console.log(`[Unmatched Raids] Validation manuelle: ${raiderDiscordId} → ${targetDiscordId} (${monthKey})`);
    
    // Enregistrer le raid validé manuellement dans le bon mois
    await recordRaidByDiscordId(raiderDiscordId, targetDiscordId, monthKey);
    
    // Retirer le message de la liste des non reconnus
    await removeUnmatchedRaid(messageId, monthKey);
    
    return NextResponse.json({
      success: true,
      raider: {
        discordId: raiderDiscordId,
        displayName: raider.displayName,
        twitchLogin: raider.twitchLogin,
      },
      target: {
        discordId: targetDiscordId,
        displayName: target.displayName,
        twitchLogin: target.twitchLogin,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la validation manuelle du raid:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Détails de l'erreur:", {
      messageId: messageId || "non défini",
      raiderDiscordId: raiderDiscordId || "non défini",
      targetDiscordId: targetDiscordId || "non défini",
      month: month || "non défini",
      monthKey: monthKey || "non défini",
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: `Erreur serveur: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Supprime un message non reconnu (sans validation)
 * Query params: ?messageId=xxx&month=YYYY-MM
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const month = searchParams.get('month');
    
    if (!messageId) {
      return NextResponse.json(
        { error: "messageId est requis" },
        { status: 400 }
      );
    }
    
    let monthKey: string | undefined;
    if (month) {
      const monthMatch = month.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1]);
        const monthNum = parseInt(monthMatch[2]);
        if (monthNum >= 1 && monthNum <= 12) {
          monthKey = getMonthKey(year, monthNum);
        }
      }
    }
    
    await removeUnmatchedRaid(messageId, monthKey);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression du message non reconnu:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

