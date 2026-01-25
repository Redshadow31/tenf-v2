/**
 * API Route pour migrer les validations de follow depuis Netlify Blobs vers Supabase
 * 
 * GET /api/admin/migration/migrate-follows?months=2024-01,2024-02&staffSlugs=red,nexou
 * POST /api/admin/migration/migrate-follows - Pour appliquer les changements sélectionnés
 * 
 * La route détecte les conflits et permet de choisir quels changements appliquer
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getBlobStore } from '@/lib/memberData';
import { evaluationRepository } from '@/lib/repositories/EvaluationRepository';
import { getAllFollowValidationsForMonth, getStaffFollowValidation } from '@/lib/followStorage';

export const dynamic = 'force-dynamic';

const FOLLOW_STORE_NAME = 'tenf-follow-validations';

interface Conflict {
  month: string;
  staffSlug: string;
  staffName: string;
  type: 'missing' | 'different' | 'extra_in_supabase';
  blobData: {
    membersCount: number;
    validatedAt: string;
    members: Array<{
      twitchLogin: string;
      jeSuis?: boolean;
      meSuit?: boolean | null;
    }>;
  };
  supabaseData?: {
    membersCount: number;
    validatedAt: string;
    members: Array<{
      twitchLogin: string;
      follows: boolean;
    }>;
  };
  differences?: Array<{
    twitchLogin: string;
    blobValue: { jeSuis?: boolean; meSuit?: boolean | null };
    supabaseValue: { follows: boolean };
  }>;
}

interface MigrationResult {
  month: string;
  validationsMigrated: number;
  validationsSkipped: number;
  conflicts: Conflict[];
  errors: string[];
}

async function listMonthsInBlobs(): Promise<string[]> {
  const months = new Set<string>();
  
  try {
    const store = getBlobStore(FOLLOW_STORE_NAME);
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

function convertBlobToSupabaseFormat(blobValidation: any, staffDiscordId?: string): any {
  // Convertir le format Blobs vers le format Supabase
  const follows: Record<string, boolean> = {};
  
  if (blobValidation.members && Array.isArray(blobValidation.members)) {
    blobValidation.members.forEach((m: any) => {
      // Utiliser jeSuis pour déterminer si le staff suit le membre
      // meSuit pour déterminer si le membre suit le staff
      // Pour la compatibilité, on utilise jeSuis comme indicateur principal
      const isFollowed = m.jeSuis === true || m.status === 'followed';
      follows[m.twitchLogin.toLowerCase()] = isFollowed;
    });
  }

  return {
    staffDiscordId: staffDiscordId || blobValidation.validatedBy || 'system',
    staffTwitchLogin: blobValidation.staffSlug || '',
    validatedAt: blobValidation.validatedAt || new Date().toISOString(),
    follows,
  };
}

function detectConflicts(
  blobValidation: any,
  supabaseValidation: any,
  month: string
): Conflict | null {
  if (!supabaseValidation) {
    // Pas de conflit, juste manquant
    return {
      month,
      staffSlug: blobValidation.staffSlug || '',
      staffName: blobValidation.staffName || blobValidation.staffSlug || '',
      type: 'missing',
      blobData: {
        membersCount: blobValidation.members?.length || 0,
        validatedAt: blobValidation.validatedAt || '',
        members: (blobValidation.members || []).map((m: any) => ({
          twitchLogin: m.twitchLogin,
          jeSuis: m.jeSuis,
          meSuit: m.meSuit,
        })),
      },
    };
  }

  // Comparer les données
  const blobFollows: Record<string, boolean> = {};
  (blobValidation.members || []).forEach((m: any) => {
    blobFollows[m.twitchLogin.toLowerCase()] = m.jeSuis === true || m.status === 'followed';
  });

  const supabaseFollows = supabaseValidation.follows || {};
  
  // Détecter les différences
  const differences: Array<{
    twitchLogin: string;
    blobValue: { jeSuis?: boolean; meSuit?: boolean | null };
    supabaseValue: { follows: boolean };
  }> = [];

  const allLogins = new Set([
    ...Object.keys(blobFollows),
    ...Object.keys(supabaseFollows),
  ]);

  allLogins.forEach(login => {
    const blobValue = blobFollows[login];
    const supabaseValue = supabaseFollows[login];
    
    if (blobValue !== supabaseValue) {
      const member = blobValidation.members?.find((m: any) => m.twitchLogin.toLowerCase() === login);
      differences.push({
        twitchLogin: login,
        blobValue: {
          jeSuis: member?.jeSuis,
          meSuit: member?.meSuit,
        },
        supabaseValue: {
          follows: supabaseValue || false,
        },
      });
    }
  });

  if (differences.length > 0) {
    return {
      month,
      staffSlug: blobValidation.staffSlug || '',
      staffName: blobValidation.staffName || blobValidation.staffSlug || '',
      type: 'different',
      blobData: {
        membersCount: blobValidation.members?.length || 0,
        validatedAt: blobValidation.validatedAt || '',
        members: (blobValidation.members || []).map((m: any) => ({
          twitchLogin: m.twitchLogin,
          jeSuis: m.jeSuis,
          meSuit: m.meSuit,
        })),
      },
      supabaseData: {
        membersCount: Object.keys(supabaseFollows).length,
        validatedAt: supabaseValidation.validatedAt || '',
        members: Object.entries(supabaseFollows).map(([login, follows]) => ({
          twitchLogin: login,
          follows: follows as boolean,
        })),
      },
      differences,
    };
  }

  return null;
}

async function migrateMonth(
  monthKey: string,
  selectedStaffSlugs?: string[],
  applyConflicts: boolean = false
): Promise<MigrationResult> {
  const errors: string[] = [];
  let validationsMigrated = 0;
  let validationsSkipped = 0;
  const conflicts: Conflict[] = [];

  try {
    // 1. Charger toutes les validations depuis Blobs
    const blobValidations = await getAllFollowValidationsForMonth(monthKey);
    
    // Filtrer par staffSlugs si spécifié
    const validationsToMigrate = selectedStaffSlugs
      ? blobValidations.filter(v => selectedStaffSlugs.includes(v.staffSlug?.toLowerCase() || ''))
      : blobValidations;

    // 2. Charger les évaluations depuis Supabase pour ce mois
    const monthDate = `${monthKey}-01`;
    const supabaseEvaluations = await evaluationRepository.findByMonth(monthKey, 10000, 0);

    // Créer un map des validations Supabase par staffSlug
    const supabaseValidationsByStaff = new Map<string, any>();
    supabaseEvaluations.forEach(eval => {
      if (eval.followValidations && Array.isArray(eval.followValidations)) {
        eval.followValidations.forEach((fv: any) => {
          const staffSlug = (fv.staffTwitchLogin || '').toLowerCase();
          if (staffSlug) {
            supabaseValidationsByStaff.set(staffSlug, fv);
          }
        });
      }
    });

    // 3. Migrer chaque validation
    for (const blobValidation of validationsToMigrate) {
      try {
        const staffSlug = (blobValidation.staffSlug || '').toLowerCase();
        if (!staffSlug) {
          errors.push(`Validation sans staffSlug pour ${monthKey}`);
          continue;
        }

        const supabaseValidation = supabaseValidationsByStaff.get(staffSlug);

        // Détecter les conflits
        const conflict = detectConflicts(blobValidation, supabaseValidation, monthKey);
        
        if (conflict && conflict.type === 'different') {
          conflicts.push(conflict);
          if (!applyConflicts) {
            validationsSkipped++;
            continue;
          }
        }

        // Si pas de conflit ou si on applique les conflits, migrer
        if (!conflict || applyConflicts) {
          // Convertir au format Supabase
          const supabaseFormat = convertBlobToSupabaseFormat(blobValidation);

          // Trouver ou créer les évaluations pour tous les membres concernés
          const memberLogins = Object.keys(supabaseFormat.follows);
          
          for (const login of memberLogins) {
            let evaluation = await evaluationRepository.findByMemberAndMonth(login, monthKey);
            
            const followValidations = evaluation?.followValidations || [];
            
            // Chercher si une validation pour ce staff existe déjà
            const existingIndex = followValidations.findIndex(
              (fv: any) => (fv.staffTwitchLogin || '').toLowerCase() === staffSlug
            );

            if (existingIndex >= 0) {
              // Mettre à jour la validation existante
              followValidations[existingIndex] = supabaseFormat;
            } else {
              // Ajouter une nouvelle validation
              followValidations.push(supabaseFormat);
            }

            // Mettre à jour l'évaluation
            await evaluationRepository.upsert({
              month: new Date(monthDate),
              twitchLogin: login.toLowerCase(),
              followValidations,
              updatedAt: new Date(),
            });
          }

          validationsMigrated++;
        } else {
          validationsSkipped++;
        }
      } catch (memberError) {
        const errorMsg = `Erreur migration ${blobValidation.staffSlug} pour ${monthKey}: ${memberError instanceof Error ? memberError.message : 'Erreur inconnue'}`;
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
    validationsMigrated,
    validationsSkipped,
    conflicts,
    errors,
  };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const monthsParam = searchParams.get('months');
    const staffSlugsParam = searchParams.get('staffSlugs');
    const applyConflictsParam = searchParams.get('applyConflicts') === 'true';

    let monthsToMigrate: string[];
    const selectedStaffSlugs = staffSlugsParam
      ? staffSlugsParam.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      : undefined;

    if (monthsParam) {
      monthsToMigrate = monthsParam.split(',').map(m => m.trim()).filter(Boolean);
    } else {
      monthsToMigrate = await listMonthsInBlobs();
    }

    if (monthsToMigrate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun mois à migrer',
        summary: {
          monthsProcessed: 0,
          validationsMigrated: 0,
          validationsSkipped: 0,
          conflictsCount: 0,
        },
      });
    }

    // Migrer chaque mois
    const results: MigrationResult[] = [];
    const allErrors: string[] = [];
    const allConflicts: Conflict[] = [];
    let totalValidationsMigrated = 0;
    let totalValidationsSkipped = 0;

    for (const month of monthsToMigrate) {
      const result = await migrateMonth(month, selectedStaffSlugs, applyConflictsParam);
      results.push(result);
      allErrors.push(...result.errors);
      allConflicts.push(...result.conflicts);
      totalValidationsMigrated += result.validationsMigrated;
      totalValidationsSkipped += result.validationsSkipped;
    }

    // Vérification finale
    let totalInSupabase = 0;
    for (const month of monthsToMigrate) {
      const monthEvals = await evaluationRepository.findByMonth(month, 10000, 0);
      monthEvals.forEach(eval => {
        if (eval.followValidations && Array.isArray(eval.followValidations)) {
          totalInSupabase += eval.followValidations.length;
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Migration terminée pour ${monthsToMigrate.length} mois`,
      summary: {
        monthsProcessed: monthsToMigrate.length,
        validationsMigrated: totalValidationsMigrated,
        validationsSkipped: totalValidationsSkipped,
        conflictsCount: allConflicts.length,
        totalInSupabase,
      },
      monthResults: results,
      conflicts: allConflicts,
      errors: allErrors.slice(0, 50),
    });
  } catch (error) {
    console.error('[Migrate Follows] Erreur:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { months, staffSlugs, applyConflicts } = body;

    if (!months || !Array.isArray(months) || months.length === 0) {
      return NextResponse.json({ error: 'Mois requis' }, { status: 400 });
    }

    // Appeler la même logique que GET mais avec applyConflicts=true
    const results: MigrationResult[] = [];
    const allErrors: string[] = [];
    const allConflicts: Conflict[] = [];
    let totalValidationsMigrated = 0;
    let totalValidationsSkipped = 0;

    for (const month of months) {
      const result = await migrateMonth(month, staffSlugs, applyConflicts === true);
      results.push(result);
      allErrors.push(...result.errors);
      allConflicts.push(...result.conflicts);
      totalValidationsMigrated += result.validationsMigrated;
      totalValidationsSkipped += result.validationsSkipped;
    }

    return NextResponse.json({
      success: true,
      message: `Migration terminée pour ${months.length} mois`,
      summary: {
        monthsProcessed: months.length,
        validationsMigrated: totalValidationsMigrated,
        validationsSkipped: totalValidationsSkipped,
        conflictsCount: allConflicts.length,
      },
      monthResults: results,
      conflicts: allConflicts,
      errors: allErrors.slice(0, 50),
    });
  } catch (error) {
    console.error('[Migrate Follows POST] Erreur:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
