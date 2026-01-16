import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { getLogs, initializeLogs } from '@/lib/logAction';

/**
 * API pour récupérer les dernières activités pour le Centre de contrôle
 * Lecture seule, utilise les logs existants
 */
export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier l'accès admin
    const { hasAdminDashboardAccessAsync } = await import('@/lib/adminAccessCheck');
    if (!(await hasAdminDashboardAccessAsync(admin.id))) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Initialiser et récupérer les logs
    await initializeLogs();
    const logs = await getLogs(10); // Récupérer les 10 derniers logs

    // Formater les logs en activités
    const activities = logs.slice(0, 5).map((log) => {
      // Déterminer le type d'activité selon l'action
      let activityType: "member" | "spotlight" | "event" | "evaluation" = "member";
      
      if (log.action.toLowerCase().includes("spotlight")) {
        activityType = "spotlight";
      } else if (log.action.toLowerCase().includes("event") || log.action.toLowerCase().includes("événement")) {
        activityType = "event";
      } else if (log.action.toLowerCase().includes("évaluation") || log.action.toLowerCase().includes("evaluation")) {
        activityType = "evaluation";
      }

      // Formater le timestamp relatif
      const now = new Date();
      const timestamp = new Date(log.timestamp);
      const diffMs = now.getTime() - timestamp.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let relativeTime = "À l'instant";
      if (diffMins > 0 && diffMins < 60) {
        relativeTime = `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
      } else if (diffHours > 0 && diffHours < 24) {
        relativeTime = `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      } else if (diffDays > 0 && diffDays < 30) {
        relativeTime = `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      } else if (diffDays >= 30) {
        const diffMonths = Math.floor(diffDays / 30);
        relativeTime = `Il y a ${diffMonths} mois`;
      }

      return {
        id: log.timestamp.toString(),
        type: activityType,
        action: log.action,
        target: log.target || "N/A",
        timestamp: relativeTime,
        rawTimestamp: timestamp.toISOString(),
      };
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error in control-center activities API:", error);
    return NextResponse.json(
      { error: "Erreur serveur", activities: [] },
      { status: 500 }
    );
  }
}
