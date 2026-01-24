import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { logSystemTest } from '@/lib/logging/logger';
import { memberRepository, eventRepository, spotlightRepository, evaluationRepository } from '@/lib/repositories';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getRedisClient } from '@/lib/cache';

/**
 * POST - Teste tous les systèmes du site
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const system = searchParams.get('system'); // Teste un système spécifique si fourni

    const results: Record<string, any> = {};

    // Test Supabase
    if (!system || system === 'supabase') {
      try {
        const startTime = Date.now();
        const { data, error } = await supabaseAdmin
          .from('members')
          .select('count')
          .limit(1);
        
        const duration = Date.now() - startTime;
        
        if (error) {
          results.supabase = {
            status: 'error',
            message: error.message,
            duration,
          };
          logSystemTest.error('Supabase', 'Connexion échouée', { error: error.message });
        } else {
          results.supabase = {
            status: 'success',
            message: 'Connexion réussie',
            duration,
          };
          logSystemTest.success('Supabase', 'Connexion réussie', { duration });
        }
      } catch (error: any) {
        results.supabase = {
          status: 'error',
          message: error.message || 'Erreur inconnue',
        };
        logSystemTest.error('Supabase', 'Erreur de test', { error: error.message });
      }
    }

    // Test Redis Cache
    if (!system || system === 'redis') {
      try {
        const startTime = Date.now();
        const redis = getRedisClient();
        
        if (!redis) {
          results.redis = {
            status: 'warning',
            message: 'Redis non configuré (variables d\'environnement manquantes)',
          };
          logSystemTest.warning('Redis', 'Non configuré');
        } else {
          await redis.set('test:ping', 'pong', { ex: 10 });
          const value = await redis.get('test:ping');
          const duration = Date.now() - startTime;
          
          if (value === 'pong') {
            results.redis = {
              status: 'success',
              message: 'Cache Redis fonctionnel',
              duration,
            };
            logSystemTest.success('Redis', 'Cache fonctionnel', { duration });
          } else {
            results.redis = {
              status: 'error',
              message: 'Cache Redis ne répond pas correctement',
              duration,
            };
            logSystemTest.error('Redis', 'Réponse incorrecte');
          }
        }
      } catch (error: any) {
        results.redis = {
          status: 'error',
          message: error.message || 'Erreur inconnue',
        };
        logSystemTest.error('Redis', 'Erreur de test', { error: error.message });
      }
    }

    // Test Repositories
    if (!system || system === 'repositories') {
      const repoTests: Record<string, any> = {};

      // Test MemberRepository
      try {
        const startTime = Date.now();
        const count = await memberRepository.countActive();
        const duration = Date.now() - startTime;
        
        repoTests.memberRepository = {
          status: 'success',
          message: `Comptage actif: ${count} membres`,
          duration,
        };
        logSystemTest.success('MemberRepository', 'Comptage réussi', { count, duration });
      } catch (error: any) {
        repoTests.memberRepository = {
          status: 'error',
          message: error.message || 'Erreur inconnue',
        };
        logSystemTest.error('MemberRepository', 'Erreur de test', { error: error.message });
      }

      // Test EventRepository
      try {
        const startTime = Date.now();
        const events = await eventRepository.findAll(10, 0);
        const duration = Date.now() - startTime;
        
        repoTests.eventRepository = {
          status: 'success',
          message: `${events.length} événements récupérés`,
          duration,
        };
        logSystemTest.success('EventRepository', 'Récupération réussie', { count: events.length, duration });
      } catch (error: any) {
        repoTests.eventRepository = {
          status: 'error',
          message: error.message || 'Erreur inconnue',
        };
        logSystemTest.error('EventRepository', 'Erreur de test', { error: error.message });
      }

      // Test SpotlightRepository
      try {
        const startTime = Date.now();
        const spotlights = await spotlightRepository.findAll(10, 0);
        const duration = Date.now() - startTime;
        
        repoTests.spotlightRepository = {
          status: 'success',
          message: `${spotlights.length} spotlights récupérés`,
          duration,
        };
        logSystemTest.success('SpotlightRepository', 'Récupération réussie', { count: spotlights.length, duration });
      } catch (error: any) {
        repoTests.spotlightRepository = {
          status: 'error',
          message: error.message || 'Erreur inconnue',
        };
        logSystemTest.error('SpotlightRepository', 'Erreur de test', { error: error.message });
      }

      // Test EvaluationRepository
      try {
        const startTime = Date.now();
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const evaluations = await evaluationRepository.findByMonth(monthKey, 10, 0);
        const duration = Date.now() - startTime;
        
        repoTests.evaluationRepository = {
          status: 'success',
          message: `${evaluations.length} évaluations récupérées pour ${monthKey}`,
          duration,
        };
        logSystemTest.success('EvaluationRepository', 'Récupération réussie', { count: evaluations.length, duration });
      } catch (error: any) {
        repoTests.evaluationRepository = {
          status: 'error',
          message: error.message || 'Erreur inconnue',
        };
        logSystemTest.error('EvaluationRepository', 'Erreur de test', { error: error.message });
      }

      results.repositories = repoTests;
    }

    // Test Twitch API
    if (!system || system === 'twitch') {
      try {
        const clientId = process.env.TWITCH_CLIENT_ID;
        const clientSecret = process.env.TWITCH_CLIENT_SECRET;
        
        if (!clientId || !clientSecret) {
          results.twitch = {
            status: 'warning',
            message: 'Variables d\'environnement Twitch non configurées',
          };
          logSystemTest.warning('Twitch', 'Non configuré');
        } else {
          const startTime = Date.now();
          const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              grant_type: 'client_credentials',
            }),
          });
          
          const duration = Date.now() - startTime;
          
          if (tokenResponse.ok) {
            results.twitch = {
              status: 'success',
              message: 'API Twitch accessible',
              duration,
            };
            logSystemTest.success('Twitch', 'API accessible', { duration });
          } else {
            results.twitch = {
              status: 'error',
              message: `Erreur API Twitch: ${tokenResponse.status}`,
              duration,
            };
            logSystemTest.error('Twitch', 'Erreur API', { status: tokenResponse.status });
          }
        }
      } catch (error: any) {
        results.twitch = {
          status: 'error',
          message: error.message || 'Erreur inconnue',
        };
        logSystemTest.error('Twitch', 'Erreur de test', { error: error.message });
      }
    }

    // Test Discord API
    if (!system || system === 'discord') {
      try {
        const botToken = process.env.DISCORD_BOT_TOKEN;
        
        if (!botToken) {
          results.discord = {
            status: 'warning',
            message: 'Token Discord Bot non configuré',
          };
          logSystemTest.warning('Discord', 'Non configuré');
        } else {
          const startTime = Date.now();
          const response = await fetch('https://discord.com/api/v10/users/@me', {
            headers: {
              Authorization: `Bot ${botToken}`,
            },
          });
          
          const duration = Date.now() - startTime;
          
          if (response.ok) {
            results.discord = {
              status: 'success',
              message: 'API Discord accessible',
              duration,
            };
            logSystemTest.success('Discord', 'API accessible', { duration });
          } else {
            results.discord = {
              status: 'error',
              message: `Erreur API Discord: ${response.status}`,
              duration,
            };
            logSystemTest.error('Discord', 'Erreur API', { status: response.status });
          }
        }
      } catch (error: any) {
        results.discord = {
          status: 'error',
          message: error.message || 'Erreur inconnue',
        };
        logSystemTest.error('Discord', 'Erreur de test', { error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API System Test] Erreur:', error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
