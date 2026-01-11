import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, logAction } from '@/lib/adminAuth';
import { hasPermission } from '@/lib/adminRoles';
import { loadMemberDataFromStorage, getMemberData, updateMemberData } from '@/lib/memberData';
import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STORE_NAME = 'tenf-evaluations';

interface SynthesisSaveRequest {
  month: string; // YYYY-MM
  updates: Array<{
    twitchLogin: string;
    finalNote?: number; // Note finale manuelle (optionnelle)
    isActive?: boolean; // Statut actif/inactif
  }>;
}

async function getEvaluationStore() {
  try {
    const { getStore: dynamicGetStore } = await import('@netlify/blobs');
    return dynamicGetStore(STORE_NAME);
  } catch (error) {
    console.warn('Netlify Blobs not available, falling back to file system for evaluation synthesis data.', error);
    return null;
  }
}

/**
 * POST - Sauvegarde les notes finales et statuts pour une évaluation mensuelle
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasPermission(admin.id, 'write')) {
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

    // Charger les données des membres
    await loadMemberDataFromStorage();

    const store = await getEvaluationStore();
    const key = `${month}/synthesis-final-notes.json`;

    // Charger les notes finales existantes
    let finalNotes: Record<string, { finalNote?: number; savedAt: string; savedBy: string }> = {};
    if (store) {
      const existing = await store.get(key, { type: 'json' }).catch(() => null);
      if (existing) {
        finalNotes = existing;
      }
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'evaluations', month);
      const filePath = path.join(dataDir, 'synthesis-final-notes.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        finalNotes = JSON.parse(content);
      }
    }

    // Mettre à jour les notes finales et statuts
    const results = {
      notesUpdated: 0,
      statusUpdated: 0,
      errors: [] as string[],
    };

    for (const update of updates) {
      const { twitchLogin, finalNote, isActive } = update;

      // Mettre à jour la note finale si fournie
      if (finalNote !== undefined && finalNote !== null) {
        finalNotes[twitchLogin.toLowerCase()] = {
          finalNote: Number(finalNote),
          savedAt: new Date().toISOString(),
          savedBy: admin.id,
        };
        results.notesUpdated++;
      }

      // Mettre à jour le statut (isActive) si fourni
      if (isActive !== undefined && isActive !== null) {
        try {
          const member = getMemberData(twitchLogin);
          if (!member) {
            results.errors.push(`Membre ${twitchLogin} non trouvé`);
            continue;
          }

          const currentRole = member.role;
          let newRole = currentRole;

          // Si on désactive le membre (isActive = false), changer le rôle en "Communauté"
          if (!isActive && currentRole !== 'Communauté') {
            newRole = 'Communauté';
          }
          // Si on réactive le membre (isActive = true) et qu'il était en "Communauté", on ne change pas (à gérer manuellement)
          // Note: On pourrait ajouter une logique pour restaurer l'ancien rôle, mais pour l'instant on laisse tel quel

          await updateMemberData(
            twitchLogin,
            {
              isActive: Boolean(isActive),
              role: newRole,
              roleManuallySet: true, // Marquer comme défini manuellement
            },
            admin.id
          );

          await logAction(
            admin,
            'update_member_status',
            'member',
            {
              resourceId: twitchLogin,
              previousValue: { isActive: member.isActive, role: currentRole },
              newValue: { isActive: Boolean(isActive), role: newRole },
              metadata: { month, reason: 'Évaluation mensuelle' },
            }
          );

          results.statusUpdated++;
        } catch (error) {
          console.error(`Erreur lors de la mise à jour du statut pour ${twitchLogin}:`, error);
          results.errors.push(`Erreur pour ${twitchLogin}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      }
    }

    // Sauvegarder les notes finales
    if (store) {
      await store.set(key, JSON.stringify(finalNotes, null, 2));
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'evaluations', month);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, 'synthesis-final-notes.json');
      fs.writeFileSync(filePath, JSON.stringify(finalNotes, null, 2), 'utf-8');
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
    const admin = await getCurrentAdmin();
    if (!admin || !hasPermission(admin.id, 'read')) {
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

    const store = await getEvaluationStore();
    const key = `${month}/synthesis-final-notes.json`;

    let finalNotes: Record<string, { finalNote?: number; savedAt: string; savedBy: string }> = {};

    if (store) {
      const existing = await store.get(key, { type: 'json' }).catch(() => null);
      if (existing) {
        finalNotes = existing;
      }
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'evaluations', month);
      const filePath = path.join(dataDir, 'synthesis-final-notes.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        finalNotes = JSON.parse(content);
      }
    }

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

