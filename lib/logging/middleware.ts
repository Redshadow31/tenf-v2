/**
 * Middleware pour logger automatiquement les routes API
 */

import { NextRequest, NextResponse } from 'next/server';
import { logApi, LogCategory } from './logger';

/**
 * Wrapper pour logger automatiquement les routes API
 */
export function withLogging(
  handler: (request: NextRequest) => Promise<NextResponse>,
  category: LogCategory = LogCategory.API_ROUTE
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const path = request.nextUrl.pathname;
    let status = 500;
    let userId: string | undefined;

    try {
      // Essayer de récupérer l'utilisateur (si authentifié)
      try {
        const { getCurrentAdmin } = await import('@/lib/admin');
        const admin = await getCurrentAdmin();
        userId = admin?.id;
      } catch {
        // Pas d'utilisateur, continuer
      }

      const response = await handler(request);
      status = response.status;

      const duration = Date.now() - startTime;
      logApi.route(method, path, status, duration, userId, {
        category,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(path, error instanceof Error ? error : new Error(String(error)), userId);
      
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }
  };
}
