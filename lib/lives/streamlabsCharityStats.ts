/** URL page campagne du type https://streamlabscharity.com/@equipe/slug-campagne */
export function streamlabsCharityPageToTeamApiUrl(pageUrl: string): string | null {
  const trimmed = String(pageUrl || "").trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    if (host !== "streamlabscharity.com" && host !== "www.streamlabscharity.com") return null;
    const path = u.pathname.replace(/\/$/, "");
    const match = path.match(/^\/@([^/]+)\/([^/]+)$/);
    if (!match) return null;
    const team = encodeURIComponent(match[1]);
    const campaign = encodeURIComponent(match[2]);
    return `https://streamlabscharity.com/api/v1/teams/@${team}/${campaign}`;
  } catch {
    return null;
  }
}

export function isAllowedStreamlabsCharityStatsApiUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (host !== "streamlabscharity.com" && host !== "www.streamlabscharity.com") return false;
    return u.pathname.startsWith("/api/v1/teams/");
  } catch {
    return false;
  }
}

export type StreamlabsCharityTeamStats = {
  raised: number;
  /** Objectif affiché (API ou env ou 10 000 €). */
  displayGoal: number;
  currency: string;
};

function parseCurrency(raw: unknown): string {
  const c = String(raw || "EUR")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);
  return c.length === 3 ? c : "EUR";
}

export type ParsedSlcTeamPayload = { raised: number; currency: string; apiGoal: number };

export function parseStreamlabsCharityTeamJson(data: unknown): ParsedSlcTeamPayload | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const campaign = root.campaign && typeof root.campaign === "object" ? (root.campaign as Record<string, unknown>) : null;

  const raisedRaw = campaign?.amount_raised ?? root.amount_raised;
  const raised = typeof raisedRaw === "number" ? raisedRaw : Number.parseFloat(String(raisedRaw ?? ""));
  if (!Number.isFinite(raised) || raised < 0) return null;

  const goalBlock =
    campaign?.goal && typeof campaign.goal === "object"
      ? (campaign.goal as Record<string, unknown>)
      : root.goal && typeof root.goal === "object"
        ? (root.goal as Record<string, unknown>)
        : null;
  const goalRaw = goalBlock?.amount;
  const apiGoal = typeof goalRaw === "number" ? goalRaw : Number.parseFloat(String(goalRaw ?? ""));
  const currency = parseCurrency(campaign?.currency ?? root.currency);

  return {
    raised,
    currency,
    apiGoal: Number.isFinite(apiGoal) && apiGoal > 0 ? apiGoal : 0,
  };
}

export function withDisplayGoal(parsed: ParsedSlcTeamPayload, envGoalEuros: number): StreamlabsCharityTeamStats {
  const defaultGoal = 10_000;
  const env = Number.isFinite(envGoalEuros) && envGoalEuros > 0 ? envGoalEuros : 0;
  const displayGoal = env > 0 ? env : parsed.apiGoal > 0 ? parsed.apiGoal : defaultGoal;
  return {
    raised: parsed.raised,
    displayGoal,
    currency: parsed.currency,
  };
}

export async function fetchStreamlabsCharityTeamStats(statsUrl: string, timeoutMs = 10000): Promise<StreamlabsCharityTeamStats | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(statsUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    const parsed = parseStreamlabsCharityTeamJson(json);
    if (!parsed) return null;
    const envGoal = Number.parseInt(String(process.env.STREAMLABS_CHARITY_GOAL_EUROS || "").trim(), 10);
    return withDisplayGoal(parsed, envGoal);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
