import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { logAction, prepareAuditValues } from '@/lib/admin/logger';
import { memberRepository, evaluationRepository } from '@/lib/repositories';
import type { MemberRole } from '@/lib/memberRoles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SynthesisSaveRequest {
  month: string; // YYYY-MM
  updates: Array<{
    twitchLogin: string;
    finalNote?: number; // Note finale manuelle (optionnelle)
    isActive?: boolean; // Statut actif/inactif
    role?: MemberRole; // Rôle forcé (optionnel, ex: 'Communauté')
    isVip?: boolean; // Statut VIP (optionnel)
  }>;
}

// Plus besoin de getEvaluationStore, on utilise directement Supabase

/**
 * POST - Sauvegarde les notes finales et statuts pour une évaluation mensuelle
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission('write');
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body: SynthesisSaveRequest = await request.json();
    const { month, updates } = body;

    if (!month || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'month et updates sont requis' },
        { status: 400 }
      );
    }

    // Valider le format du mois
    if (!month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json(
        { error: "Format de mois invalide (attendu: YYYY-MM)" },
        { status: 400 }
      );
    }

    // Mettre à jour les notes finales et statuts
    const results = {
      notesUpdated: 0,
      statusUpdated: 0,
      errors: [] as string[],
    };

    for (const update of updates) {
      const { twitchLogin, finalNote, isActive, role, isVip } = update;

      // Mettre à jour la note finale si fournie
      if (finalNote !== undefined && finalNote !== null) {
        try {
          // Récupérer ou créer l'évaluation pour ce membre et ce mois
          let evaluation = await evaluationRepository.findByMemberAndMonth(twitchLogin, month);
          
          if (!evaluation) {
            // Créer une nouvelle évaluation si elle n'existe pas
            const monthDate = new Date(`${month}-01`);
            evaluation = await evaluationRepository.upsert({
              month: monthDate,
              twitchLogin,
              finalNote: Number(finalNote),
              finalNoteSavedAt: new Date(),
              finalNoteSavedBy: admin.discordId,
            });
          } else {
            // Mettre à jour l'évaluation existante
            evaluation = await evaluationRepository.update(evaluation.id, {
              finalNote: Number(finalNote),
              finalNoteSavedAt: new Date(),
              finalNoteSavedBy: admin.discordId,
            });
          }
          
          results.notesUpdated++;
        } catch (error) {
          console.error(`Erreur lors de la mise à jour de la note finale pour ${twitchLogin}:`, error);
          results.errors.push(`Erreur note finale pour ${twitchLogin}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      }

      // Mettre à jour le statut (isActive), le rôle et/ou le statut VIP si fourni
      if (isActive !== undefined || role !== undefined || isVip !== undefined) {
        try {
          const member = await memberRepository.findByTwitchLogin(twitchLogin);
          if (!member) {
            results.errors.push(`Membre ${twitchLogin} non trouvé`);
            continue;
          }

          const currentRole = member.role;
          let newRole: MemberRole = role !== undefined ? role : currentRole;
          let newIsActive = isActive !== undefined ? Boolean(isActive) : member.isActive;
          let newIsVip = isVip !== undefined ? Boolean(isVip) : member.isVip;

          // Si on désactive le membre (isActive = false), changer le rôle en "Communauté" si pas déjà défini
          if (!newIsActive && newRole === currentRole && currentRole !== 'Communauté') {
            newRole = 'Communauté';
          }
          
          // Si un rôle est forcé explicitement, l'utiliser
          if (role !== undefined && role !== currentRole) {
            newRole = role;
          }

          const updateData: any = {
            isActive: newIsActive,
            role: newRole,
            roleManuallySet: true, // Marquer comme défini manuellement
          };
          
          // Ajouter isVip si défini
          if (isVip !== undefined) {
            updateData.isVip = newIsVip;
          }

          const updatedMember = await memberRepository.update(twitchLogin, updateData);

          await logAction({
            action: 'update_member_status',
            resourceType: 'member',
            resourceId: twitchLogin,
            previousValue: prepareAuditValues(member, undefined).previousValue,
            newValue: prepareAuditValues(undefined, updatedMember).newValue,
            metadata: { month, reason: 'Évaluation mensuelle' },
          });

          results.statusUpdated++;
        } catch (error) {
          console.error(`Erreur lors de la mise à jour du statut pour ${twitchLogin}:`, error);
          results.errors.push(`Erreur pour ${twitchLogin}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Modifications enregistrées avec succès',
      results: {
        notesUpdated: results.notesUpdated,
        statusUpdated: results.statusUpdated,
        errors: results.errors.length > 0 ? results.errors : undefined,
      },
    });
  } catch (error) {
    console.error('[API Evaluations Synthesis Save] Erreur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET - Récupère les notes finales pour un mois donné
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission('read');
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month) {
      return NextResponse.json(
        { error: 'Le paramètre "month" est requis' },
        { status: 400 }
      );
    }

    // Valider le format du mois
    if (!month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json(
        { error: "Format de mois invalide (attendu: YYYY-MM)" },
        { status: 400 }
      );
    }

    // Récupérer toutes les évaluations du mois avec notes finales
    const evaluations = await evaluationRepository.findByMonth(month);
    
    // Construire l'objet finalNotes au format attendu
    const finalNotes: Record<string, { finalNote?: number; savedAt: string; savedBy: string }> = {};
    
    evaluations.forEach((eval) => {
      if (eval.finalNote !== undefined && eval.finalNote !== null) {
        finalNotes[eval.twitchLogin.toLowerCase()] = {
          finalNote: eval.finalNote,
          savedAt: eval.finalNoteSavedAt?.toISOString() || new Date().toISOString(),
          savedBy: eval.finalNoteSavedBy || '',
        };
      }
    });

    return NextResponse.json({
      success: true,
      finalNotes,
      month,
    });
  } catch (error) {
    console.error('[API Evaluations Synthesis Save GET] Erreur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

