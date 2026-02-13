import { NextRequest, NextResponse } from 'next/server';
import {
  addRaidFait,
  updateRaidFait,
  removeRaidFait,
  recalculateAlerts,
  getMonthKey,
  getCurrentMonthKey,
} from '@/lib/raidStorage';
import { memberRepository } from '@/lib/repositories';

/**
 * POST - Ajoute un raid manuellement
 * Body: { month: string, raider: string, target: string, date: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, raider, target, date } = body;

    if (!month || !raider || !target || !date) {
      return NextResponse.json(
        { error: "month, raider, target et date sont requis" },
        { status: 400 }
      );
    }

    // Déterminer le monthKey
    let monthKey: string;
    if (month) {
      const monthMatch = month.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1]);
        const monthNum = parseInt(monthMatch[2]);
        if (monthNum >= 1 && monthNum <= 12) {
          monthKey = getMonthKey(year, monthNum);
        } else {
          return NextResponse.json({ error: "Mois invalide" }, { status: 400 });
        }
      } else {
        monthKey = getCurrentMonthKey();
      }
    } else {
      monthKey = getCurrentMonthKey();
    }

    const allMembers = await memberRepository.findAll(1000, 0);
    let raiderId = raider;
    let targetId = target;
    const raiderMember = allMembers.find(m => m.twitchLogin?.toLowerCase() === raider.toLowerCase() || m.discordId === raider);
    const targetMember = allMembers.find(m => m.twitchLogin?.toLowerCase() === target.toLowerCase() || m.discordId === target);
    if (raiderMember?.discordId) raiderId = raiderMember.discordId;
    if (targetMember?.discordId) targetId = targetMember.discordId;

    // Ajouter le raid (manual = true)
    await addRaidFait(monthKey, raiderId, targetId, date, true, undefined, "manual");

    return NextResponse.json({
      success: true,
      message: "Raid ajouté manuellement",
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout manuel:", error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

/**
 * PUT - Modifie un raid (réassignation)
 * Body: { month: string, oldRaider: string, oldTarget: string, oldDate: string, newRaider: string, newTarget: string, newDate?: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, oldRaider, oldTarget, oldDate, newRaider, newTarget, newDate } = body;

    if (!month || !oldRaider || !oldTarget || !oldDate || !newRaider || !newTarget) {
      return NextResponse.json(
        { error: "month, oldRaider, oldTarget, oldDate, newRaider et newTarget sont requis" },
        { status: 400 }
      );
    }

    // Déterminer le monthKey
    let monthKey: string;
    if (month) {
      const monthMatch = month.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1]);
        const monthNum = parseInt(monthMatch[2]);
        if (monthNum >= 1 && monthNum <= 12) {
          monthKey = getMonthKey(year, monthNum);
        } else {
          return NextResponse.json({ error: "Mois invalide" }, { status: 400 });
        }
      } else {
        monthKey = getCurrentMonthKey();
      }
    } else {
      monthKey = getCurrentMonthKey();
    }

    const allMembers = await memberRepository.findAll(1000, 0);
    let oldRaiderId = oldRaider;
    let oldTargetId = oldTarget;
    let newRaiderId = newRaider;
    let newTargetId = newTarget;
    
    const oldRaiderMember = allMembers.find(m => 
      m.twitchLogin?.toLowerCase() === oldRaider.toLowerCase() || 
      m.discordId === oldRaider
    );
    const oldTargetMember = allMembers.find(m => 
      m.twitchLogin?.toLowerCase() === oldTarget.toLowerCase() || 
      m.discordId === oldTarget
    );
    const newRaiderMember = allMembers.find(m => 
      m.twitchLogin?.toLowerCase() === newRaider.toLowerCase() || 
      m.discordId === newRaider
    );
    const newTargetMember = allMembers.find(m => 
      m.twitchLogin?.toLowerCase() === newTarget.toLowerCase() || 
      m.discordId === newTarget
    );

    if (oldRaiderMember?.discordId) oldRaiderId = oldRaiderMember.discordId;
    if (oldTargetMember?.discordId) oldTargetId = oldTargetMember.discordId;
    if (newRaiderMember?.discordId) newRaiderId = newRaiderMember.discordId;
    if (newTargetMember?.discordId) newTargetId = newTargetMember.discordId;

    // Modifier le raid
    const success = await updateRaidFait(
      monthKey,
      oldRaiderId,
      oldTargetId,
      oldDate,
      newRaiderId,
      newTargetId,
      newDate
    );

    if (!success) {
      return NextResponse.json(
        { error: "Raid non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Raid modifié",
    });
  } catch (error) {
    console.error("Erreur lors de la modification:", error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Supprime un raid
 * Query params: ?month=YYYY-MM&raider=xxx&target=xxx&date=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const raider = searchParams.get('raider');
    const target = searchParams.get('target');
    const date = searchParams.get('date');

    if (!month || !raider || !target) {
      return NextResponse.json(
        { error: "month, raider et target sont requis" },
        { status: 400 }
      );
    }

    // Déterminer le monthKey
    let monthKey: string;
    if (month) {
      const monthMatch = month.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1]);
        const monthNum = parseInt(monthMatch[2]);
        if (monthNum >= 1 && monthNum <= 12) {
          monthKey = getMonthKey(year, monthNum);
        } else {
          return NextResponse.json({ error: "Mois invalide" }, { status: 400 });
        }
      } else {
        monthKey = getCurrentMonthKey();
      }
    } else {
      monthKey = getCurrentMonthKey();
    }

    const allMembers = await memberRepository.findAll(1000, 0);
    let raiderId = raider;
    let targetId = target;
    const raiderMember = allMembers.find(m => m.twitchLogin?.toLowerCase() === raider.toLowerCase() || m.discordId === raider);
    const targetMember = allMembers.find(m => m.twitchLogin?.toLowerCase() === target.toLowerCase() || m.discordId === target);
    if (raiderMember?.discordId) raiderId = raiderMember.discordId;
    if (targetMember?.discordId) targetId = targetMember.discordId;

    // Supprimer le raid
    const success = await removeRaidFait(monthKey, raiderId, targetId, date || undefined);

    if (!success) {
      return NextResponse.json(
        { error: "Raid non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Raid supprimé",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

