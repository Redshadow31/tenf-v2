/**
 * API Route pour migrer les évaluations depuis Netlify Blobs vers Supabase
 * 
 * GET /api/admin/migration/migrate-evaluations?months=2024-01,2024-02
 * Si aucun paramètre months, migre tous les mois manquants
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getBlobStore } from '@/lib/memberData';
import { evaluationRepository } from '@/lib/repositories/EvaluationRepository';
import { loadSectionAData, loadSectionCData, loadSectionDData } from '@/lib/evaluationStorage';
import { loadEvaluationBonusData } from '@/lib/evaluationBonusStorage';
import { loadRaidEvaluationData } from '@/lib/raidEvaluationStorage';
import { loadSpotlightEvaluationData } from '@/lib/spotlightEvaluationStorage';

export const dynamic = 'force-dynamic';

const EVALUATION_STORE_NAME = 'tenf-evaluations';

async function listMonthsInBlobs(): Promise<string[]> {
  const months = new Set<string>();
  
  try {
    const store = getBlobStore(EVALUATION_STORE_NAME);
    const list = await store.list();
    
    for (const item of list.blobs) {
      const match = item.key.match(/^(\d{4}-\d{2})\//);
      if (match) {
        months.add(match[1]);
      }
    }
  } catch (error) {
    console.error('Erreur listage mois depuis Blobs:', error);
  }
  
  return Array.from(months).sort();
}

async function migrateMonth(monthKey: string): Promise<{
  month: string;
  evaluationsMigrated: number;
  evaluationsSkipped: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let evaluationsMigrated = 0;
  let evaluationsSkipped = 0;

  try {
    // 1. Charger toutes les données depuis Blobs
    const sectionA = await loadSectionAData(monthKey);
    const sectionC = await loadSectionCData(monthKey);
    const sectionD = await loadSectionDData(monthKey);
    const bonusData = await loadEvaluationBonusData(monthKey);
    const raidEvalData = await loadRaidEvaluationData(monthKey);
    const spotlightEvalData = await loadSpotlightEvaluationData(monthKey);

    // 2. Collecter tous les membres uniques qui ont des données
    const membersSet = new Set<string>();

    // Section A - spotlights
    if (sectionA?.spotlights) {
      sectionA.spotlights.forEach((s: any) => {
        if (s.members) {
          s.members.forEach((m: any) => membersSet.add(m.twitchLogin.toLowerCase()));
        }
      });
    }

    // Section A - events
    if (sectionA?.events) {
      sectionA.events.forEach((e: any) => {
        if (e.members) {
          e.members.forEach((m: any) => membersSet.add(m.twitchLogin.toLowerCase()));
        }
      });
    }

    // Section A - raidPoints
    if (sectionA?.raidPoints) {
      Object.keys(sectionA.raidPoints).forEach(login => membersSet.add(login.toLowerCase()));
    }

    // Section C - follow validations
    if (sectionC?.validations) {
      sectionC.validations.forEach((v: any) => {
        if (v.follows) {
          Object.keys(v.follows).forEach(login => membersSet.add(login.toLowerCase()));
        }
      });
    }

    // Section D - bonuses
    if (sectionD?.bonuses) {
      sectionD.bonuses.forEach((b: any) => membersSet.add(b.twitchLogin.toLowerCase()));
    }

    // Bonus store
    if (bonusData?.bonuses) {
      Object.keys(bonusData.bonuses).forEach(login => membersSet.add(login.toLowerCase()));
    }

    // Raid evaluations
    if (raidEvalData?.notes) {
      Object.keys(raidEvalData.notes).forEach(login => membersSet.add(login.toLowerCase()));
    }

    // Spotlight evaluations
    if (spotlightEvalData?.notes) {
      Object.keys(spotlightEvalData.notes).forEach(login => membersSet.add(login.toLowerCase()));
    }

    // 3. Migrer chaque membre
    for (const twitchLogin of membersSet) {
      try {
        // Vérifier si l'évaluation existe déjà
        const existing = await evaluationRepository.findByMemberAndMonth(twitchLogin, monthKey);

        // Préparer les données d'évaluation
        const monthDate = `${monthKey}-01`;

        // Section A - Spotlight evaluations
        const spotlightEvals = sectionA?.spotlights?.filter((s: any) => 
          s.members?.some((m: any) => m.twitchLogin.toLowerCase() === twitchLogin)
        ) || [];

        // Section A - Event evaluations
        const eventEvals = sectionA?.events?.filter((e: any) =>
          e.members?.some((m: any) => m.twitchLogin.toLowerCase() === twitchLogin)
        ) || [];

        // Section A - Raid points
        const raidPoints = sectionA?.raidPoints?.[twitchLogin] || 0;
        const raidNotes = raidEvalData?.notes?.[twitchLogin] ? [{
          twitchLogin: twitchLogin.toLowerCase(),
          note: raidEvalData.notes[twitchLogin].note,
          manualPoints: raidEvalData.notes[twitchLogin].manualPoints,
          lastUpdated: raidEvalData.notes[twitchLogin].lastUpdated,
          updatedBy: raidEvalData.notes[twitchLogin].updatedBy,
        }] : undefined;

        // Section A - Spotlight bonus
        const spotlightBonus = sectionA?.spotlightBonus?.[twitchLogin] || 0;

        // Section C - Follow validations
        const followValidations = sectionC?.validations?.filter((v: any) =>
          v.follows && v.follows[twitchLogin] !== undefined
        ) || [];

        // Section D - Bonuses
        const bonuses: any[] = [];
        
        // Bonuses depuis sectionD
        if (sectionD?.bonuses) {
          sectionD.bonuses
            .filter((b: any) => b.twitchLogin.toLowerCase() === twitchLogin)
            .forEach((b: any) => bonuses.push({
              id: b.id,
              points: b.points,
              reason: b.reason,
              type: b.type,
              createdBy: b.createdBy,
              createdAt: b.createdAt,
            }));
        }

        // Bonus depuis evaluation-bonus store (timezone + moderation)
        if (bonusData?.bonuses?.[twitchLogin]) {
          const memberBonus = bonusData.bonuses[twitchLogin];
          if (memberBonus.timezoneBonusEnabled) {
            bonuses.push({
              id: `timezone-${twitchLogin}-${monthKey}`,
              points: 2, // TIMEZONE_BONUS_POINTS
              reason: 'Bonus décalage horaire',
              type: 'decalage-horaire',
              createdBy: memberBonus.updatedBy || 'system',
              createdAt: memberBonus.updatedAt || new Date().toISOString(),
            });
          }
          if (memberBonus.moderationBonus > 0) {
            bonuses.push({
              id: `moderation-${twitchLogin}-${monthKey}`,
              points: memberBonus.moderationBonus,
              reason: 'Bonus modération',
              type: 'implication-qualitative',
              createdBy: memberBonus.updatedBy || 'system',
              createdAt: memberBonus.updatedAt || new Date().toISOString(),
            });
          }
        }

        // Spotlight evaluation notes
        if (spotlightEvalData?.notes?.[twitchLogin]) {
          // Les notes sont stockées dans spotlightEvaluations.members[].comment
          // On les mettra à jour lors de la migration des spotlightEvaluations
        }

        // Calculer les points (simplifié - les calculs réels sont faits dans les routes)
        const sectionAPoints = 0; // Sera calculé par les routes
        const sectionBPoints = 0; // Discord engagement - sera calculé par les routes
        const sectionCPoints = 0; // Follow - sera calculé par les routes
        const sectionDBonuses = bonuses.reduce((sum, b) => sum + b.points, 0);
        const totalPoints = sectionAPoints + sectionBPoints + sectionCPoints + sectionDBonuses;

        // Créer ou mettre à jour l'évaluation
        const evaluationData: any = {
          month: new Date(monthDate),
          twitchLogin,
          sectionAPoints: existing?.sectionAPoints || sectionAPoints,
          sectionBPoints: existing?.sectionBPoints || sectionBPoints,
          sectionCPoints: existing?.sectionCPoints || sectionCPoints,
          sectionDBonuses: existing?.sectionDBonuses || sectionDBonuses,
          totalPoints: existing?.totalPoints || totalPoints,
          spotlightEvaluations: spotlightEvals.length > 0 ? spotlightEvals : (existing?.spotlightEvaluations || []),
          eventEvaluations: eventEvals.length > 0 ? eventEvals : (existing?.eventEvaluations || []),
          raidPoints: raidPoints > 0 ? raidPoints : (existing?.raidPoints || 0),
          raidNotes: raidNotes || existing?.raidNotes,
          spotlightBonus: spotlightBonus > 0 ? spotlightBonus : (existing?.spotlightBonus || 0),
          followValidations: followValidations.length > 0 ? followValidations : (existing?.followValidations || []),
          bonuses: bonuses.length > 0 ? bonuses : (existing?.bonuses || []),
          calculatedAt: existing?.calculatedAt || new Date(),
          calculatedBy: existing?.calculatedBy || 'migration',
        };

        // Préserver les données existantes si elles sont plus récentes
        if (existing) {
          // Ne pas écraser les points calculés si l'évaluation existe déjà
          if (existing.sectionAPoints > 0) evaluationData.sectionAPoints = existing.sectionAPoints;
          if (existing.sectionBPoints > 0) evaluationData.sectionBPoints = existing.sectionBPoints;
          if (existing.sectionCPoints > 0) evaluationData.sectionCPoints = existing.sectionCPoints;
          if (existing.totalPoints > 0) evaluationData.totalPoints = existing.totalPoints;
          if (existing.finalNote) evaluationData.finalNote = existing.finalNote;
          if (existing.finalNoteSavedAt) evaluationData.finalNoteSavedAt = existing.finalNoteSavedAt;
          if (existing.finalNoteSavedBy) evaluationData.finalNoteSavedBy = existing.finalNoteSavedBy;
          
          evaluationsSkipped++;
        } else {
          await evaluationRepository.upsert(evaluationData);
          evaluationsMigrated++;
        }
      } catch (memberError) {
        const errorMsg = `Erreur migration ${twitchLogin} pour ${monthKey}: ${memberError instanceof Error ? memberError.message : 'Erreur inconnue'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
  } catch (error) {
    const errorMsg = `Erreur migration mois ${monthKey}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
    errors.push(errorMsg);
    console.error(errorMsg);
  }

  return {
    month: monthKey,
    evaluationsMigrated,
    evaluationsSkipped,
    errors,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const monthsParam = searchParams.get('months');

    let monthsToMigrate: string[];

    if (monthsParam) {
      monthsToMigrate = monthsParam.split(',').map(m => m.trim()).filter(Boolean);
    } else {
      // Si aucun paramètre, lister tous les mois dans Blobs
      monthsToMigrate = await listMonthsInBlobs();
    }

    if (monthsToMigrate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun mois à migrer',
        summary: {
          monthsProcessed: 0,
          evaluationsMigrated: 0,
          evaluationsSkipped: 0,
        },
      });
    }

    // Migrer chaque mois
    const results = [];
    const allErrors: string[] = [];
    let totalEvaluationsMigrated = 0;
    let totalEvaluationsSkipped = 0;

    for (const month of monthsToMigrate) {
      const result = await migrateMonth(month);
      results.push(result);
      allErrors.push(...result.errors);
      totalEvaluationsMigrated += result.evaluationsMigrated;
      totalEvaluationsSkipped += result.evaluationsSkipped;
    }

    // Vérification finale - compter toutes les évaluations pour les mois migrés
    let totalInSupabase = 0;
    for (const month of monthsToMigrate) {
      const { data: monthEvals } = await evaluationRepository.findByMonth(month, 10000, 0);
      totalInSupabase += monthEvals?.length || 0;
    }

    return NextResponse.json({
      success: true,
      message: `Migration terminée pour ${monthsToMigrate.length} mois`,
      summary: {
        monthsProcessed: monthsToMigrate.length,
        evaluationsMigrated: totalEvaluationsMigrated,
        evaluationsSkipped: totalEvaluationsSkipped,
        totalInSupabase,
      },
      monthResults: results,
      errors: allErrors.slice(0, 50), // Limiter à 50 erreurs
    });
  } catch (error) {
    console.error('[Migrate Evaluations] Erreur:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
