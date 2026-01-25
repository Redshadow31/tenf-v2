/**
 * API Route pour vérifier la synchronisation des évaluations entre Netlify Blobs et Supabase
 * 
 * GET /api/admin/migration/check-sync-evaluations
 * Retourne les évaluations dans Blobs vs Supabase par mois
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getBlobStore } from '@/lib/memberData';
import { supabaseAdmin } from '@/lib/db/supabase';
import { loadSectionAData, loadSectionCData, loadSectionDData } from '@/lib/evaluationStorage';

export const dynamic = 'force-dynamic';

const EVALUATION_STORE_NAME = 'tenf-evaluations';

interface SyncCheckResult {
  months: {
    inBlobs: string[]; // Liste des mois disponibles dans Blobs
    inSupabase: string[]; // Liste des mois disponibles dans Supabase
    missingInSupabase: string[]; // Mois présents dans Blobs mais pas dans Supabase
    extraInSupabase: string[]; // Mois présents dans Supabase mais pas dans Blobs
  };
  evaluations: {
    totalInBlobs: number; // Total des évaluations (membres x mois) dans Blobs
    totalInSupabase: number; // Total des évaluations dans Supabase
    byMonth: Array<{
      month: string;
      inBlobs: number; // Nombre de membres avec évaluations dans Blobs
      inSupabase: number; // Nombre de membres avec évaluations dans Supabase
      missingInSupabase: number; // Membres manquants dans Supabase
    }>;
  };
  sections: {
    sectionA: {
      totalInBlobs: number;
      totalInSupabase: number;
      byMonth: Array<{
        month: string;
        inBlobs: number;
        inSupabase: number;
      }>;
    };
    sectionC: {
      totalInBlobs: number;
      totalInSupabase: number;
      byMonth: Array<{
        month: string;
        inBlobs: number;
        inSupabase: number;
      }>;
    };
    sectionD: {
      totalInBlobs: number;
      totalInSupabase: number;
      byMonth: Array<{
        month: string;
        inBlobs: number;
        inSupabase: number;
      }>;
    };
  };
}

async function listMonthsInBlobs(): Promise<string[]> {
  const months = new Set<string>();
  
  try {
    // Lister les mois depuis le store principal des évaluations
    const store = getBlobStore(EVALUATION_STORE_NAME);
    const list = await store.list();
    
    for (const item of list.blobs) {
      // Format: YYYY-MM/section-a.json ou YYYY-MM/final-result.json
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


export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // 1. Lister les mois dans Blobs
    const monthsInBlobs = await listMonthsInBlobs();
    
    // 2. Lister les mois dans Supabase
    const { data: supabaseEvaluations, error: supabaseError } = await supabaseAdmin
      .from('evaluations')
      .select('month')
      .order('month', { ascending: false });

    if (supabaseError) {
      throw supabaseError;
    }

    const monthsInSupabase = Array.from(
      new Set(
        (supabaseEvaluations || []).map((e: any) => {
          const date = new Date(e.month);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        })
      )
    ).sort();

    const missingInSupabase = monthsInBlobs.filter(m => !monthsInSupabase.includes(m));
    const extraInSupabase = monthsInSupabase.filter(m => !monthsInBlobs.includes(m));

    // 3. Compter les évaluations par mois
    const evaluationsByMonth: Array<{
      month: string;
      inBlobs: number;
      inSupabase: number;
      missingInSupabase: number;
    }> = [];

    for (const month of monthsInBlobs) {
      // Compter les membres uniques dans Blobs pour ce mois
      const sectionA = await loadSectionAData(month);
      const sectionC = await loadSectionCData(month);
      const sectionD = await loadSectionDData(month);
      
      const membersInBlobs = new Set<string>();
      
      // Section A - spotlights et events
      if (sectionA?.spotlights) {
        sectionA.spotlights.forEach((s: any) => {
          if (s.members) {
            s.members.forEach((m: any) => membersInBlobs.add(m.twitchLogin.toLowerCase()));
          }
        });
      }
      if (sectionA?.events) {
        sectionA.events.forEach((e: any) => {
          if (e.members) {
            e.members.forEach((m: any) => membersInBlobs.add(m.twitchLogin.toLowerCase()));
          }
        });
      }
      if (sectionA?.raidPoints) {
        Object.keys(sectionA.raidPoints).forEach(login => membersInBlobs.add(login.toLowerCase()));
      }
      
      // Section C - follow validations
      if (sectionC?.validations) {
        sectionC.validations.forEach((v: any) => {
          if (v.follows) {
            Object.keys(v.follows).forEach(login => membersInBlobs.add(login.toLowerCase()));
          }
        });
      }
      
      // Section D - bonuses
      if (sectionD?.bonuses) {
        sectionD.bonuses.forEach((b: any) => membersInBlobs.add(b.twitchLogin.toLowerCase()));
      }

      // Compter dans Supabase
      const monthDate = `${month}-01`;
      const { data: supabaseEvals, error: evalError } = await supabaseAdmin
        .from('evaluations')
        .select('twitch_login')
        .eq('month', monthDate);

      const membersInSupabase = new Set(
        (supabaseEvals || []).map((e: any) => e.twitch_login.toLowerCase())
      );

      const missing = Math.max(0, membersInBlobs.size - membersInSupabase.size);

      evaluationsByMonth.push({
        month,
        inBlobs: membersInBlobs.size,
        inSupabase: membersInSupabase.size,
        missingInSupabase: missing,
      });
    }

    const totalInBlobs = evaluationsByMonth.reduce((sum, m) => sum + m.inBlobs, 0);
    const totalInSupabase = evaluationsByMonth.reduce((sum, m) => sum + m.inSupabase, 0);

    // 4. Compter les sections par mois
    const sectionAByMonth: Array<{ month: string; inBlobs: number; inSupabase: number }> = [];
    const sectionCByMonth: Array<{ month: string; inBlobs: number; inSupabase: number }> = [];
    const sectionDByMonth: Array<{ month: string; inBlobs: number; inSupabase: number }> = [];

    for (const month of monthsInBlobs) {
      const sectionA = await loadSectionAData(month);
      const sectionC = await loadSectionCData(month);
      const sectionD = await loadSectionDData(month);

      const monthDate = `${month}-01`;

      // Section A
      const hasSectionAInBlobs = !!(sectionA && (sectionA.spotlights?.length > 0 || sectionA.events?.length > 0 || Object.keys(sectionA.raidPoints || {}).length > 0));
      const { data: sectionAInSupabase } = await supabaseAdmin
        .from('evaluations')
        .select('id')
        .eq('month', monthDate)
        .not('section_a_points', 'is', null)
        .limit(1);
      
      sectionAByMonth.push({
        month,
        inBlobs: hasSectionAInBlobs ? 1 : 0,
        inSupabase: (sectionAInSupabase?.length || 0) > 0 ? 1 : 0,
      });

      // Section C
      const hasSectionCInBlobs = !!(sectionC && sectionC.validations?.length > 0);
      const { data: sectionCInSupabase } = await supabaseAdmin
        .from('evaluations')
        .select('id')
        .eq('month', monthDate)
        .not('section_c_points', 'is', null)
        .limit(1);
      
      sectionCByMonth.push({
        month,
        inBlobs: hasSectionCInBlobs ? 1 : 0,
        inSupabase: (sectionCInSupabase?.length || 0) > 0 ? 1 : 0,
      });

      // Section D
      const hasSectionDInBlobs = !!(sectionD && sectionD.bonuses?.length > 0);
      const { data: sectionDInSupabase } = await supabaseAdmin
        .from('evaluations')
        .select('id')
        .eq('month', monthDate)
        .not('section_d_bonuses', 'is', null)
        .limit(1);
      
      sectionDByMonth.push({
        month,
        inBlobs: hasSectionDInBlobs ? 1 : 0,
        inSupabase: (sectionDInSupabase?.length || 0) > 0 ? 1 : 0,
      });
    }

    const result: SyncCheckResult = {
      months: {
        inBlobs: monthsInBlobs,
        inSupabase: monthsInSupabase,
        missingInSupabase,
        extraInSupabase,
      },
      evaluations: {
        totalInBlobs,
        totalInSupabase,
        byMonth: evaluationsByMonth,
      },
      sections: {
        sectionA: {
          totalInBlobs: sectionAByMonth.reduce((sum, m) => sum + m.inBlobs, 0),
          totalInSupabase: sectionAByMonth.reduce((sum, m) => sum + m.inSupabase, 0),
          byMonth: sectionAByMonth,
        },
        sectionC: {
          totalInBlobs: sectionCByMonth.reduce((sum, m) => sum + m.inBlobs, 0),
          totalInSupabase: sectionCByMonth.reduce((sum, m) => sum + m.inSupabase, 0),
          byMonth: sectionCByMonth,
        },
        sectionD: {
          totalInBlobs: sectionDByMonth.reduce((sum, m) => sum + m.inBlobs, 0),
          totalInSupabase: sectionDByMonth.reduce((sum, m) => sum + m.inSupabase, 0),
          byMonth: sectionDByMonth,
        },
      },
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Check Sync Evaluations] Erreur:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
