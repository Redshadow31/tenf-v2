import type { Handler } from "@netlify/functions";
import { getDashboardSummaryCached } from "../../lib/admin/dashboardSummary";

/**
 * Préchauffe le KPI summary admin (scan membres) en cache.
 * Planifié pour éviter les recalculs coûteux au chargement dashboard.
 */
export const handler: Handler = async () => {
  try {
    const summary = await getDashboardSummaryCached({ forceRefresh: true });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        refreshedAt: new Date().toISOString(),
        summary,
      }),
    };
  } catch (error) {
    console.error("[Dashboard Summary Precompute] Erreur:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};

