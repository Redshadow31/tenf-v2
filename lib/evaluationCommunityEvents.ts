/** Barème événements communautaires (hors Spotlight) — synthèse évaluation D. */

export const COMMUNITY_EVENT_MAX_POINTS = 6;

/** Entraide max = raids(5) + discord(5) + events(6) + follow(5). */
export const ENTRAIDE_SCORE_MAX = 21;

const ELIGIBLE_CATEGORY_KEYS = new Set([
  "formation",
  "soiree film",
  "apero",
  "jeux communautaire",
]);

export type CommunityEventPresenceInput = {
  category?: string | null;
  presences?: Array<{ twitchLogin?: string; present?: boolean }> | null;
};

export function normalizeEventCategoryKey(category: string | null | undefined): string {
  return (category || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Formation, Soirée Film, Apéro, Jeux communautaire uniquement. */
export function isEligibleCommunityEvaluationEvent(category: string | null | undefined): boolean {
  if (!category) return false;
  if (normalizeEventCategoryKey(category) === "spotlight") return false;
  return ELIGIBLE_CATEGORY_KEYS.has(normalizeEventCategoryKey(category));
}

/**
 * Présence sur ≥ 80 % des events éligibles → 6 pts
 * ≥ 50 % → 4 pts
 * ≥ 1 event → 2 pts
 */
export function calculateCommunityEventPoints(presences: number, totalEligibleEvents: number): number {
  if (totalEligibleEvents <= 0 || presences <= 0) return 0;
  const rate = presences / totalEligibleEvents;
  if (rate >= 0.8) return 6;
  if (rate >= 0.5) return 4;
  return 2;
}

export function buildCommunityEventPresenceIndex(events: CommunityEventPresenceInput[]): {
  totalEligibleEvents: number;
  presencesByLogin: Map<string, number>;
} {
  const eligible = events.filter((event) => isEligibleCommunityEvaluationEvent(event.category));
  const presencesByLogin = new Map<string, number>();

  for (const event of eligible) {
    for (const presence of event.presences || []) {
      const login = presence.twitchLogin?.toLowerCase();
      if (login && presence.present) {
        presencesByLogin.set(login, (presencesByLogin.get(login) || 0) + 1);
      }
    }
  }

  return { totalEligibleEvents: eligible.length, presencesByLogin };
}

export function getCommunityEventPointsForLogin(
  login: string,
  presencesByLogin: Map<string, number>,
  totalEligibleEvents: number
): number {
  return calculateCommunityEventPoints(presencesByLogin.get(login.toLowerCase()) || 0, totalEligibleEvents);
}
