import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { loadSectionAData, getCurrentMonthKey } from '@/lib/evaluationStorage';
import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

/**
 * GET - Récupère toutes les données spotlight pour un membre spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { twitchLogin: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const twitchLogin = decodeURIComponent(params.twitchLogin).toLowerCase();

    // Récupérer tous les spotlights depuis les évaluations mensuelles
    const allSpotlights: any[] = [];
    const currentYear = new Date().getFullYear();
    
    // Parcourir les 12 derniers mois
    for (let month = 0; month < 12; month++) {
      const date = new Date(currentYear, new Date().getMonth() - month, 1);
      const year = date.getFullYear();
      const monthNum = String(date.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${monthNum}`;
      
      const sectionAData = await loadSectionAData(monthKey);
      if (sectionAData && sectionAData.spotlights) {
        for (const spotlight of sectionAData.spotlights) {
          // Vérifier si le membre était streamer ou présent
          const isStreamer = spotlight.streamerTwitchLogin.toLowerCase() === twitchLogin;
          const isPresent = spotlight.members?.some(
            (m: any) => m.twitchLogin.toLowerCase() === twitchLogin && m.present
          );
          
          if (isStreamer || isPresent) {
            allSpotlights.push({
              ...spotlight,
              month: monthKey,
              role: isStreamer ? 'streamer' : 'present',
            });
          }
        }
      }
    }

    // Récupérer aussi le spotlight actif/complété depuis le stockage (si présent)
    const SPOTLIGHT_STORE_NAME = 'tenf-spotlights';
    const isNetlify = typeof getStore === 'function' || 
                      !!process.env.NETLIFY || 
                      !!process.env.NETLIFY_DEV;

    if (isNetlify) {
      try {
        const store = getStore(SPOTLIGHT_STORE_NAME);
        const activeData = await store.get('active.json', { type: 'json' });
        
        if (activeData) {
          const isStreamer = activeData.streamerTwitchLogin?.toLowerCase() === twitchLogin;
          
          // Vérifier les présences
          try {
            const presences = await store.get(`${activeData.id}/presences.json`, { type: 'json' });
            const isPresent = presences && Array.isArray(presences) && presences.some(
              (p: any) => p.twitchLogin?.toLowerCase() === twitchLogin
            );
            
            if (isStreamer || isPresent) {
              const evaluation = await store.get(`${activeData.id}/evaluation.json`, { type: 'json' }).catch(() => null);
              
              allSpotlights.push({
                id: activeData.id,
                date: activeData.startedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                streamerTwitchLogin: activeData.streamerTwitchLogin,
                moderatorUsername: activeData.moderatorUsername || 'Unknown',
                members: (presences || []).map((p: any) => ({
                  twitchLogin: p.twitchLogin,
                  present: true,
                })),
                role: isStreamer ? 'streamer' : 'present',
                status: activeData.status,
                evaluation: evaluation || null,
              });
            }
          } catch (error) {
            // Ignorer les erreurs de lecture des présences
          }
        }
      } catch (error) {
        // Ignorer les erreurs de lecture du spotlight actif
      }
    }

    // Trier par date (plus récent en premier)
    allSpotlights.sort((a, b) => {
      const dateA = new Date(a.date || a.startedAt || 0);
      const dateB = new Date(b.date || b.startedAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    // Calculer les statistiques
    const stats = {
      totalSpotlights: allSpotlights.length,
      asStreamer: allSpotlights.filter(s => s.role === 'streamer').length,
      asPresent: allSpotlights.filter(s => s.role === 'present').length,
      averageScore: 0,
      totalScore: 0,
      evaluationsCount: 0,
    };

    // Calculer la moyenne des scores (si streamer)
    const streamerEvaluations = allSpotlights.filter(
      s => s.role === 'streamer' && s.evaluation
    );
    if (streamerEvaluations.length > 0) {
      stats.totalScore = streamerEvaluations.reduce(
        (sum, s) => sum + (s.evaluation?.totalScore || 0),
        0
      );
      stats.evaluationsCount = streamerEvaluations.length;
      stats.averageScore = stats.totalScore / stats.evaluationsCount;
    }

    return NextResponse.json({
      twitchLogin,
      spotlights: allSpotlights,
      stats,
    });
  } catch (error) {
    console.error('[Spotlight Member API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

