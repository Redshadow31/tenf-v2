import { NextResponse } from "next/server";
import { upaEventRepository } from "@/lib/repositories";
import {
  fetchStreamlabsCharityStatsFromDonationGoalWidget,
  fetchStreamlabsCharityTeamStats,
  isAllowedStreamlabsCharityStatsApiUrl,
  readStreamlabsCharityBarGoalEnv,
  streamlabsCharityPageToTeamApiUrl,
} from "@/lib/lives/streamlabsCharityStats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Montants campagne Streamlabs Charity (API publique non documentée mais largement utilisée).
 * Priorité : STREAMLABS_CHARITY_STATS_API_URL ; sinon déduit de general.charityCampaignUrl UPA
 * si URL du type https://streamlabscharity.com/@equipe/slug-campagne
 */
export async function GET() {
  try {
    const explicit = process.env.STREAMLABS_CHARITY_STATS_API_URL?.trim() || "";
    let statsUrl = explicit && isAllowedStreamlabsCharityStatsApiUrl(explicit) ? explicit : "";

    if (!statsUrl) {
      const upa = await upaEventRepository.getContent("upa-event");
      const pageUrl = String(upa?.general?.charityCampaignUrl || "").trim();
      statsUrl = streamlabsCharityPageToTeamApiUrl(pageUrl) || "";
    }

    const forcedBar = readStreamlabsCharityBarGoalEnv();

    let stats =
      statsUrl ? await fetchStreamlabsCharityTeamStats(statsUrl, forcedBar) : null;

    if (!stats) {
      const widgetUrl = process.env.STREAMLABS_CHARITY_GOAL_WIDGET_URL?.trim() || "";
      stats = await fetchStreamlabsCharityStatsFromDonationGoalWidget(widgetUrl, forcedBar);
    }

    if (!stats) {
      return NextResponse.json({ available: false }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json(
      {
        available: true,
        raised: stats.raised,
        displayGoal: stats.displayGoal,
        currency: stats.currency,
        ...(typeof stats.campaignGoal === "number" ? { campaignGoal: stats.campaignGoal } : {}),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ available: false }, { headers: { "Cache-Control": "no-store" } });
  }
}
