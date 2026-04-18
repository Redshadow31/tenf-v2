import { NextResponse } from "next/server";
import { safeStreamlabsCharityGoalWidgetUrl } from "@/lib/lives/safeStreamlabsCharityGoalWidgetUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sert l'URL du widget au runtime uniquement, pour ne pas figer STREAMLABS_CHARITY_GOAL_WIDGET_URL
 * dans le HTML/RSC de /lives (scan de secrets Netlify sur les artefacts de build).
 */
export async function GET() {
  const widgetSrc = safeStreamlabsCharityGoalWidgetUrl(process.env.STREAMLABS_CHARITY_GOAL_WIDGET_URL);
  return NextResponse.json({ widgetSrc }, { headers: { "Cache-Control": "no-store" } });
}
