/**
 * API Route pour vérifier la synchronisation des validations de follow entre Netlify Blobs et Supabase
 * 
 * GET /api/admin/migration/check-sync-follows
 * Retourne les validations de follow dans Blobs vs Supabase par mois et par staff
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getBlobStore } from '@/lib/memberData';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getAllFollowValidationsForMonth } from '@/lib/followStorage';

export const dynamic = 'force-dynamic';

const FOLLOW_STORE_NAME = 'tenf-follow-validations';

interface SyncCheckResult {
  months: {
    inBlobs: string[];
    inSupabase: string[];
    missingInSupabase: string[];
    extraInSupabase: string[];
  };
  validations: {
    totalInBlobs: number;
    totalInSupabase: number;
    byMonth: Array<{
      month: string;
      inBlobs: number; // Nombre de validations (staff) dans Blobs
      inSupabase: number; // Nombre de validations dans Supabase
      missingInSupabase: number;
      byStaff: Array<{
        staffSlug: string;
        staffName: string;
        inBlobs: boolean;
        inSupabase: boolean;
        membersInBlobs: number;
        membersInSupabase: number;
      }>;
    }>;
  };
}

async function listMonthsInBlobs(): Promise<string[]> {
  const months = new Set<string>();
  
  try {
    const store = getBlobStore(FOLLOW_STORE_NAME);
    const list = await store.list();
    
    for (const item of list.blobs) {
      // Format: YYYY-MM/staffSlug.json
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
    
    // 2. Lister les mois dans Supabase (depuis la table evaluations)
    const { data: supabaseEvaluations, error: supabaseError } = await supabaseAdmin
      .from('evaluations')
      .select('month, follow_validations')
      .not('follow_validations', 'is', null)
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

    // 3. Compter les validations par mois et par staff
    const validationsByMonth: Array<{
      month: string;
      inBlobs: number;
      inSupabase: number;
      missingInSupabase: number;
      byStaff: Array<{
        staffSlug: string;
        staffName: string;
        inBlobs: boolean;
        inSupabase: boolean;
        membersInBlobs: number;
        membersInSupabase: number;
      }>;
    }> = [];

    for (const month of monthsInBlobs) {
      // Charger depuis Blobs
      const blobValidations = await getAllFollowValidationsForMonth(month);
      
      // Charger depuis Supabase
      const monthDate = `${month}-01`;
      const { data: supabaseEvals } = await supabaseAdmin
        .from('evaluations')
        .select('follow_validations')
        .eq('month', monthDate)
        .not('follow_validations', 'is', null);

      // Extraire les staff slugs depuis Supabase
      const supabaseStaffSet = new Set<string>();
      const supabaseMembersByStaff: Record<string, number> = {};
      
      (supabaseEvals || []).forEach((eval: any) => {
        if (eval.follow_validations && Array.isArray(eval.follow_validations)) {
          eval.follow_validations.forEach((fv: any) => {
            const staffSlug = fv.staffTwitchLogin?.toLowerCase() || '';
            if (staffSlug) {
              supabaseStaffSet.add(staffSlug);
              const memberCount = Object.keys(fv.follows || {}).length;
              supabaseMembersByStaff[staffSlug] = (supabaseMembersByStaff[staffSlug] || 0) + memberCount;
            }
          });
        }
      });

      // Créer un map des validations Blobs par staffSlug
      const blobValidationsByStaff = new Map<string, { name: string; members: number }>();
      blobValidations.forEach(v => {
        const slug = v.staffSlug?.toLowerCase() || '';
        if (slug) {
          blobValidationsByStaff.set(slug, {
            name: v.staffName || slug,
            members: v.members?.length || 0,
          });
        }
      });

      // Créer la liste byStaff
      const byStaff: Array<{
        staffSlug: string;
        staffName: string;
        inBlobs: boolean;
        inSupabase: boolean;
        membersInBlobs: number;
        membersInSupabase: number;
      }> = [];

      // Ajouter les validations de Blobs
      blobValidationsByStaff.forEach((data, slug) => {
        byStaff.push({
          staffSlug: slug,
          staffName: data.name,
          inBlobs: true,
          inSupabase: supabaseStaffSet.has(slug),
          membersInBlobs: data.members,
          membersInSupabase: supabaseMembersByStaff[slug] || 0,
        });
      });

      // Ajouter les validations de Supabase qui ne sont pas dans Blobs
      supabaseStaffSet.forEach(slug => {
        if (!blobValidationsByStaff.has(slug)) {
          byStaff.push({
            staffSlug: slug,
            staffName: slug, // On ne connaît pas le nom depuis Supabase seul
            inBlobs: false,
            inSupabase: true,
            membersInBlobs: 0,
            membersInSupabase: supabaseMembersByStaff[slug] || 0,
          });
        }
      });

      const missing = byStaff.filter(s => s.inBlobs && !s.inSupabase).length;

      validationsByMonth.push({
        month,
        inBlobs: blobValidations.length,
        inSupabase: supabaseStaffSet.size,
        missingInSupabase: missing,
        byStaff,
      });
    }

    const totalInBlobs = validationsByMonth.reduce((sum, m) => sum + m.inBlobs, 0);
    const totalInSupabase = validationsByMonth.reduce((sum, m) => sum + m.inSupabase, 0);

    const result: SyncCheckResult = {
      months: {
        inBlobs: monthsInBlobs,
        inSupabase: monthsInSupabase,
        missingInSupabase,
        extraInSupabase,
      },
      validations: {
        totalInBlobs,
        totalInSupabase,
        byMonth: validationsByMonth,
      },
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Check Sync Follows] Erreur:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
