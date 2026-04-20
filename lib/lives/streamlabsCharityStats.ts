/** URL page campagne : /@equipe/slug, /teams/@equipe/slug, ou .../donate/@... */
export function streamlabsCharityPageToTeamApiUrl(pageUrl: string): string | null {
  const trimmed = String(pageUrl || "").trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    if (host !== "streamlabscharity.com" && host !== "www.streamlabscharity.com") return null;
    let path = u.pathname.replace(/\/$/, "");
    if (path.toLowerCase().startsWith("/teams/")) {
      path = path.replace(/^\/teams\//i, "/");
    }
    if (/\/donate\//i.test(path)) {
      path = path.replace(/^\/donate\//i, "/");
    }
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
  /** Objectif utilisé pour la largeur de la barre (souvent 10 k€ pour l’impact). */
  displayGoal: number;
  currency: string;
  /** Objectif déclaré sur la campagne Streamlabs quand il diffère de la barre (ex. 100 k€). */
  campaignGoal?: number;
};

/** Priorité : BAR_GOAL_EUROS puis GOAL_EUROS (rétrocompat). 0 = laisser withDisplayGoal décider. */
export function readStreamlabsCharityBarGoalEnv(): number {
  const bar = Number.parseInt(String(process.env.STREAMLABS_CHARITY_BAR_GOAL_EUROS || "").trim(), 10);
  if (Number.isFinite(bar) && bar > 0) return bar;
  const legacy = Number.parseInt(String(process.env.STREAMLABS_CHARITY_GOAL_EUROS || "").trim(), 10);
  if (Number.isFinite(legacy) && legacy > 0) return legacy;
  return 0;
}

function parseCurrency(raw: unknown): string {
  const c = String(raw || "EUR")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);
  return c.length === 3 ? c : "EUR";
}

/** Nombre depuis API (virgule ou point). */
export function parseAmountToNumber(raw: unknown): number {
  if (typeof raw === "number") return raw;
  const s = String(raw ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Streamlabs renvoie souvent `amount_raised` en centimes alors que `goal` est en euros.
 * Si l objectif API est tres eleve (ex. 1 M€), le brut peut rester < objectif tout en etant des centimes (107125 → 1071,25 €).
 */
export function normalizeRaisedCentsVsMajorGoal(raised: number, apiGoal: number): number {
  if (!Number.isFinite(raised) || !Number.isFinite(apiGoal) || apiGoal <= 0) return raised;
  if (!Number.isInteger(raised)) return raised;

  const asMajor = raised / 100;
  const rawFrac = raised / apiGoal;
  const majorFrac = asMajor / apiGoal;
  const likelyCentsWhenBelowGoal = asMajor >= 1 && asMajor <= apiGoal * 1.15 && rawFrac < 0.25 && majorFrac < 0.02;
  const likelyCentsWhenSlightlyAboveGoal =
    asMajor >= 1 && asMajor <= apiGoal * 1.15 && rawFrac > 1 && rawFrac <= 1.12 && majorFrac < 0.2;

  if (raised <= apiGoal) {
    if (likelyCentsWhenBelowGoal) return asMajor;
    return raised;
  }

  if (likelyCentsWhenSlightlyAboveGoal) return asMajor;
  return raised;
}

/**
 * Quand l objectif API est intermediaire (ex. 200 k€), 107125 peut rester non corrige ; si le palier barre est bas (10 k€),
 * un brut 8x–11,5x le palier avec centimes non nuls correspond en pratique a des centimes pour un total ~1–2 k€.
 */
function normalizeRaisedCentsAgainstBarPalier(raised: number, displayGoal: number): number {
  if (!Number.isFinite(raised) || !Number.isFinite(displayGoal) || displayGoal <= 0) return raised;
  if (!Number.isInteger(raised)) return raised;
  const asMajor = raised / 100;
  if (asMajor < 1 || asMajor > displayGoal * 2.5) return raised;
  const loExclusive = displayGoal * 8;
  const hiInclusive = displayGoal * 25;
  if (raised <= loExclusive || raised > hiInclusive) return raised;
  return asMajor;
}

export type ParsedSlcTeamPayload = { raised: number; currency: string; apiGoal: number };

export function parseStreamlabsCharityTeamJson(data: unknown): ParsedSlcTeamPayload | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const campaign = root.campaign && typeof root.campaign === "object" ? (root.campaign as Record<string, unknown>) : null;

  const raisedRaw = campaign?.amount_raised ?? root.amount_raised;
  const raised = parseAmountToNumber(raisedRaw);
  if (!Number.isFinite(raised) || raised < 0) return null;

  const goalBlock =
    campaign?.goal && typeof campaign.goal === "object"
      ? (campaign.goal as Record<string, unknown>)
      : root.goal && typeof root.goal === "object"
        ? (root.goal as Record<string, unknown>)
        : null;
  const goalRaw = goalBlock?.amount;
  const apiGoal = parseAmountToNumber(goalRaw);
  const currency = parseCurrency(campaign?.currency ?? root.currency);

  const safeGoal = Number.isFinite(apiGoal) && apiGoal > 0 ? apiGoal : 0;
  const raisedNorm = normalizeRaisedCentsVsMajorGoal(raised, safeGoal);

  return {
    raised: raisedNorm,
    currency,
    apiGoal: safeGoal,
  };
}

export function withDisplayGoal(parsed: ParsedSlcTeamPayload, forcedBarGoalEuros: number): StreamlabsCharityTeamStats {
  const defaultGoal = 10_000;
  const forced = Number.isFinite(forcedBarGoalEuros) && forcedBarGoalEuros > 0 ? forcedBarGoalEuros : 0;
  const displayGoal = forced > 0 ? forced : parsed.apiGoal > 0 ? parsed.apiGoal : defaultGoal;
  const raisedNorm = normalizeRaisedCentsAgainstBarPalier(
    normalizeRaisedCentsVsMajorGoal(parsed.raised, parsed.apiGoal),
    displayGoal,
  );
  const campaignGoal =
    parsed.apiGoal > 0 && Math.abs(parsed.apiGoal - displayGoal) > 0.5 ? parsed.apiGoal : undefined;
  return {
    raised: raisedNorm,
    displayGoal,
    currency: parsed.currency,
    campaignGoal,
  };
}

export async function fetchStreamlabsCharityTeamStats(
  statsUrl: string,
  forcedBarGoalEuros: number,
  timeoutMs = 10000
): Promise<StreamlabsCharityTeamStats | null> {
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
    return withDisplayGoal(parsed, forcedBarGoalEuros);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Jeton query du widget objectif (meme variable que l iframe). */
export function extractCharityDonationGoalWidgetToken(widgetUrl: string): string | null {
  const trimmed = String(widgetUrl || "").trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.hostname.toLowerCase() !== "streamlabs.com" && !u.hostname.toLowerCase().endsWith(".streamlabs.com")) {
      return null;
    }
    if (!u.pathname.toLowerCase().includes("streamlabs-charity-donation-goal")) return null;
    const token = u.searchParams.get("token");
    return token && token.length > 20 ? token : null;
  } catch {
    return null;
  }
}

/** Extrait raised / goal depuis JSON serialise ou HTML de widget (chaine brute). */
function extractGoalFromSerializedText(s: string): ParsedSlcTeamPayload | null {
  if (!s || s.length < 20) return null;

  const num = "([0-9]+(?:[.,][0-9]+)?)";
  const pair =
    s.match(new RegExp(`"current_amount"\\s*:\\s*${num}[\\s\\S]{0,400}?"goal_amount"\\s*:\\s*${num}`, "i")) ||
    s.match(new RegExp(`"currentAmount"\\s*:\\s*${num}[\\s\\S]{0,400}?"goalAmount"\\s*:\\s*${num}`)) ||
    s.match(new RegExp(`"current"\\s*:\\s*${num}[\\s\\S]{0,200}?"goal"\\s*:\\s*${num}`));

  if (pair) {
    const raised = parseAmountToNumber(pair[1]);
    const apiGoal = parseAmountToNumber(pair[2]);
    if (Number.isFinite(raised) && raised >= 0 && Number.isFinite(apiGoal) && apiGoal > 0) {
      const raisedNorm = normalizeRaisedCentsVsMajorGoal(raised, apiGoal);
      return { raised: raisedNorm, currency: "EUR", apiGoal };
    }
  }

  const raisedM =
    s.match(/"amount_raised"\s*:\s*([0-9]+(?:[.,][0-9]+)?)/) ||
    s.match(/"current_amount"\s*:\s*([0-9]+(?:[.,][0-9]+)?)/i) ||
    s.match(/"currentAmount"\s*:\s*([0-9]+(?:[.,][0-9]+)?)/) ||
    s.match(/"current"\s*:\s*([0-9]+(?:[.,][0-9]+)?)/);
  const goalM =
    s.match(/"goal"\s*:\s*\{[^}]{0,800}?"amount"\s*:\s*([0-9]+(?:[.,][0-9]+)?)/) ||
    s.match(/"goal_amount"\s*:\s*([0-9]+(?:[.,][0-9]+)?)/i) ||
    s.match(/"goalAmount"\s*:\s*([0-9]+(?:[.,][0-9]+)?)/) ||
    s.match(/"target"\s*:\s*([0-9]+(?:[.,][0-9]+)?)/);

  if (!raisedM) return null;
  const raised = parseAmountToNumber(raisedM[1]);
  const apiGoal = goalM ? parseAmountToNumber(goalM[1]) : 0;
  if (!Number.isFinite(raised) || raised < 0) return null;
  const safeGoal = Number.isFinite(apiGoal) && apiGoal > 0 ? apiGoal : 0;
  const raisedNorm = normalizeRaisedCentsVsMajorGoal(raised, safeGoal);
  return {
    raised: raisedNorm,
    currency: "EUR",
    apiGoal: safeGoal,
  };
}

/** Parse des reponses JSON variables (widget dashboard / API interne) ou HTML. */
function parseLooseDonationGoalPayload(data: unknown): ParsedSlcTeamPayload | null {
  if (typeof data === "string") {
    return extractGoalFromSerializedText(data);
  }
  const fromTeam = parseStreamlabsCharityTeamJson(data);
  if (fromTeam) return fromTeam;
  return extractGoalFromSerializedText(JSON.stringify(data));
}

const WIDGET_STATS_URLS = (token: string) =>
  [
    `https://streamlabs.com/api/v5/slobs/widget/streamlabs-charity-donation-goal?token=${encodeURIComponent(token)}`,
    `https://streamlabs.com/api/v5/widget/streamlabs-charity-donation-goal?token=${encodeURIComponent(token)}`,
    `https://streamlabs.com/api/v6/slobs/widget/streamlabs-charity-donation-goal?token=${encodeURIComponent(token)}`,
    `https://streamlabscharity.com/api/v1/widgets/streamlabs-charity-donation-goal/${encodeURIComponent(token)}`,
  ] as const;

/**
 * Fallback lorsque l API equipe (/api/v1/teams/@...) n est pas configuree :
 * meme jeton que STREAMLABS_CHARITY_GOAL_WIDGET_URL.
 */
export async function fetchStreamlabsCharityStatsFromDonationGoalWidget(
  widgetPageUrl: string,
  forcedBarGoalEuros: number,
  timeoutMs = 9000
): Promise<StreamlabsCharityTeamStats | null> {
  const token = extractCharityDonationGoalWidgetToken(widgetPageUrl);
  if (!token) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    for (const url of WIDGET_STATS_URLS(token)) {
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json", "User-Agent": "TENF-V2/charity-stats" },
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) continue;
        const json: unknown = await res.json();
        const parsed = parseLooseDonationGoalPayload(json);
        if (parsed) {
          return withDisplayGoal(parsed, forcedBarGoalEuros);
        }
      } catch {
        /* essai suivant */
      }
    }

    try {
      const res = await fetch(widgetPageUrl, {
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: controller.signal,
        cache: "no-store",
      });
      if (res.ok) {
        const html = await res.text();
        const next = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
        if (next) {
          try {
            const parsed = parseLooseDonationGoalPayload(JSON.parse(next[1]));
            if (parsed) return withDisplayGoal(parsed, forcedBarGoalEuros);
          } catch {
            /* */
          }
        }
        const fromHtml = parseLooseDonationGoalPayload(html);
        if (fromHtml) return withDisplayGoal(fromHtml, forcedBarGoalEuros);
      }
    } catch {
      /* */
    }

    return null;
  } finally {
    clearTimeout(timer);
  }
}
