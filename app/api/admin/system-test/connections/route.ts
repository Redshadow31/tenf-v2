import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { getRedisClient } from '@/lib/cache';
import { getBlobStore } from '@/lib/memberData';
import { eventRepository } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

interface TestResult {
  service: string;
  status: 'success' | 'error' | 'warning' | 'not-testable';
  message: string;
  details?: any;
}

/**
 * GET - Test des connexions aux services (Supabase, Netlify Blobs, Redis)
 * Accessible uniquement aux admins
 */
export async function GET(request: NextRequest) {
  try {
    // Authentification admin requise
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Non authentifié ou accès refusé' },
        { status: 401 }
      );
    }

    const results: TestResult[] = [];

    // Test Supabase
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from('events').select('id').limit(1);
      
      if (error) {
        results.push({
          service: 'Supabase',
          status: 'error',
          message: `Erreur: ${error.message}`,
          details: error,
        });
      } else {
        results.push({
          service: 'Supabase',
          status: 'success',
          message: `Connexion OK - ${data?.length || 0} événement(s) trouvé(s)`,
          details: { count: data?.length || 0 },
        });
      }
    } catch (error) {
      results.push({
        service: 'Supabase',
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        details: error instanceof Error ? { stack: error.stack } : error,
      });
    }

    // Test Netlify Blobs
    try {
      const isNetlify = process.env.NETLIFY === 'true' || process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
      
      if (!isNetlify) {
        results.push({
          service: 'Netlify Blobs',
          status: 'not-testable',
          message: 'Non testable (pas dans l\'environnement Netlify)',
          details: { 
            NETLIFY: process.env.NETLIFY,
            NETLIFY_SITE_ID: process.env.NETLIFY_SITE_ID ? 'défini' : 'non défini',
            SITE_ID: process.env.SITE_ID ? 'défini' : 'non défini',
          },
        });
      } else {
        try {
          const store = getBlobStore('tenf-members');
          const testKey = `test-connection-${Date.now()}`;
          const testData = { test: true, timestamp: Date.now() };
          
          await store.set(testKey, JSON.stringify(testData));
          const retrieved = await store.get(testKey, { type: 'text' });
          await store.delete(testKey);
          
          if (retrieved) {
            const parsed = JSON.parse(retrieved);
            results.push({
              service: 'Netlify Blobs',
              status: 'success',
              message: 'Connexion OK - Lecture/écriture fonctionnelle',
              details: { testData: parsed },
            });
          } else {
            results.push({
              service: 'Netlify Blobs',
              status: 'error',
              message: 'Pas de données récupérées',
            });
          }
        } catch (blobError) {
          results.push({
            service: 'Netlify Blobs',
            status: 'error',
            message: blobError instanceof Error ? blobError.message : 'Erreur inconnue',
            details: blobError instanceof Error ? { stack: blobError.stack } : blobError,
          });
        }
      }
    } catch (error) {
      results.push({
        service: 'Netlify Blobs',
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        details: error instanceof Error ? { stack: error.stack } : error,
      });
    }

    // Test Upstash Redis
    try {
      const redis = getRedisClient();
      if (!redis) {
        results.push({
          service: 'Upstash Redis',
          status: 'warning',
          message: 'Non configuré (variables d\'environnement manquantes)',
          details: {
            UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? 'défini' : 'non défini',
            UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? 'défini' : 'non défini',
          },
        });
      } else {
        const testKey = `test:connection:${Date.now()}`;
        await redis.set(testKey, 'test');
        const value = await redis.get(testKey);
        await redis.del(testKey);
        
        if (value === 'test') {
          results.push({
            service: 'Upstash Redis',
            status: 'success',
            message: 'Connexion OK - Lecture/écriture fonctionnelle',
          });
        } else {
          results.push({
            service: 'Upstash Redis',
            status: 'error',
            message: `Valeur incorrecte: ${value}`,
          });
        }
      }
    } catch (error) {
      results.push({
        service: 'Upstash Redis',
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        details: error instanceof Error ? { stack: error.stack } : error,
      });
    }

    // Test EventRepository
    try {
      const events = await eventRepository.findAll(10, 0);
      results.push({
        service: 'EventRepository',
        status: 'success',
        message: `${events.length} événement(s) récupéré(s)`,
        details: { count: events.length },
      });
    } catch (error) {
      results.push({
        service: 'EventRepository',
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        details: error instanceof Error ? { stack: error.stack } : error,
      });
    }

    // Test MemberRepository
    try {
      const { memberRepository } = await import('@/lib/repositories');
      const members = await memberRepository.findAll(10, 0);
      results.push({
        service: 'MemberRepository',
        status: 'success',
        message: `${members.length} membre(s) récupéré(s)`,
        details: { count: members.length },
      });
    } catch (error) {
      results.push({
        service: 'MemberRepository',
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        details: error instanceof Error ? { stack: error.stack } : error,
      });
    }

    // Résumé
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const notTestableCount = results.filter(r => r.status === 'not-testable').length;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NETLIFY: process.env.NETLIFY,
        NETLIFY_SITE_ID: process.env.NETLIFY_SITE_ID ? 'défini' : 'non défini',
        SITE_ID: process.env.SITE_ID ? 'défini' : 'non défini',
      },
      summary: {
        total: results.length,
        success: successCount,
        errors: errorCount,
        warnings: warningCount,
        notTestable: notTestableCount,
      },
      results,
    });
  } catch (error) {
    console.error('[System Test Connections] Erreur:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors du test des connexions',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
