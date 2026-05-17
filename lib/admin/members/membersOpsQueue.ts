/**
 * File d'actions opérationnelles membres — source unique.
 *
 * Utilisée par :
 *  - `/admin/membres`         (top 5, vue "À traiter aujourd'hui")
 *  - `/admin/membres/actions` (vue complète, tri/score, filtres)
 *
 * Cette logique est isolée pour éviter d'avoir deux systèmes de scoring
 * différents entre le hub et la page actions.
 */

export type MembersOpsPriority = "P1" | "P2" | "P3";

export type MembersOpsImpact =
  | "onboarding"
  | "moderation"
  | "qualite_data"
  | "processus_interne";

export type MembersOpsItem = {
  id: string;
  title: string;
  /** Description courte (≤ 100 chars). */
  description: string;
  /** Volume de l'action à date. */
  count: number;
  priority: MembersOpsPriority;
  impact: MembersOpsImpact;
  /** SLA cible humain ("24h", "48h", "7 jours"). */
  sla: string;
  /** Owner local (localStorage côté hub) — vide par défaut. */
  owner?: string;
  /** URL à ouvrir pour traiter. */
  href: string;
};

export type MembersOpsQueueInputs = {
  profileValidationPendingCount: number;
  staffApplicationsPendingCount: number;
  reviewOverdue: number;
  reviewDue7d: number;
  incomplete: number;
  syncMissingCount: number;
  dataErrors: number;
  owners?: Record<string, string>;
};

/** Renvoie la file complète des actions, avec priorité/impact dérivés du volume. */
export function buildMembersOpsQueue(input: MembersOpsQueueInputs): MembersOpsItem[] {
  const owners = input.owners || {};
  const own = (id: string) => owners[id] || "";

  return [
    {
      id: "profile-validation",
      title: "Créateurs bloqués avant intégration",
      description:
        "Profils en attente d'une lecture staff : une validation rapide les remet en route.",
      count: input.profileValidationPendingCount,
      priority: input.profileValidationPendingCount > 0 ? "P1" : "P3",
      impact: "onboarding",
      sla: "24h",
      owner: own("profile-validation"),
      href: "/admin/membres/validation-profil",
    },
    {
      id: "new-postulations",
      title: "Candidatures staff à instruire",
      description:
        "Ces créateurs souhaitent rejoindre l'équipe : à trier avant entretien ou réponse.",
      count: input.staffApplicationsPendingCount,
      priority: input.staffApplicationsPendingCount > 0 ? "P1" : "P3",
      impact: "moderation",
      sla: "24h",
      owner: own("new-postulations"),
      href: "/admin/membres/postulations",
    },
    {
      id: "data-errors",
      title: "Incohérences à corriger sur les fiches",
      description:
        "Anomalies techniques détectées : ces créateurs ne sont pas exploitables tels quels.",
      count: input.dataErrors,
      priority: input.dataErrors > 0 ? "P1" : "P3",
      impact: "qualite_data",
      sla: "48h",
      owner: own("data-errors"),
      href: "/admin/membres/incomplets?vue=erreurs",
    },
    {
      id: "sync-missing",
      title: "Données à réconcilier",
      description:
        "Des créateurs présents dans la source historique manquent à l'appel côté nouvelle base.",
      count: input.syncMissingCount,
      priority: input.syncMissingCount > 0 ? "P2" : "P3",
      impact: "qualite_data",
      sla: "48h",
      owner: own("sync-missing"),
      href: "/admin/membres/qualite-data?onglet=sync",
    },
    {
      id: "review-due",
      title: "Membres à accompagner",
      description:
        "Revues dépassées : un échange ou un point d'étape s'impose pour ces créateurs.",
      count: input.reviewOverdue,
      priority: input.reviewOverdue > 0 ? "P2" : "P3",
      impact: "processus_interne",
      sla: "7 jours",
      owner: own("review-due"),
      href: "/admin/membres/revues",
    },
    {
      id: "incomplete-profiles",
      title: "Fiches à fiabiliser",
      description:
        "Profils ouverts mais incomplets : ces créateurs gagneraient à être finalisés.",
      count: input.incomplete,
      priority: input.incomplete > 0 ? "P2" : "P3",
      impact: "onboarding",
      sla: "7 jours",
      owner: own("incomplete-profiles"),
      href: "/admin/membres/incomplets",
    },
    {
      id: "review-due-7d",
      title: "Revues à préparer cette semaine",
      description:
        "Échéances à venir : prévoyez un créneau pour rester serein côté suivi.",
      count: input.reviewDue7d,
      priority: input.reviewDue7d > 0 ? "P3" : "P3",
      impact: "processus_interne",
      sla: "7 jours",
      owner: own("review-due-7d"),
      href: "/admin/membres/revues",
    },
  ];
}

const PRIORITY_WEIGHT: Record<MembersOpsPriority, number> = { P1: 3, P2: 2, P3: 1 };
const IMPACT_WEIGHT: Record<MembersOpsImpact, number> = {
  onboarding: 1.4,
  moderation: 1.3,
  qualite_data: 1.25,
  processus_interne: 1.1,
};

/**
 * Score utilitaire pour le tri "à traiter aujourd'hui".
 *
 * Signature permissive : on n'a besoin que du volume, de la priorité et de
 * l'impact pour scorer. Les pages qui dérivent un sous-type (ex. `QueueRow`
 * dans `/admin/membres/actions`) peuvent l'appeler sans devoir transporter
 * `sla` ou `owner`.
 */
export function getMembersOpsScore(
  item: Pick<MembersOpsItem, "count" | "priority" | "impact">
): number {
  return Math.round(item.count * PRIORITY_WEIGHT[item.priority] * IMPACT_WEIGHT[item.impact]);
}

/**
 * Retourne les `limit` actions les plus prioritaires :
 *  - tri par score décroissant,
 *  - puis par priorité puis volume.
 *  - on garde uniquement count > 0 sauf si tout est à zéro (la vue reste informative).
 */
export function getTopMembersOpsActions(
  items: MembersOpsItem[],
  limit = 5
): MembersOpsItem[] {
  const active = items.filter((item) => item.count > 0);
  if (active.length === 0) return [];
  return active
    .slice()
    .sort((a, b) => {
      const sa = getMembersOpsScore(a);
      const sb = getMembersOpsScore(b);
      if (sb !== sa) return sb - sa;
      const pdelta = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (pdelta !== 0) return pdelta;
      return b.count - a.count;
    })
    .slice(0, limit);
}

export const PRIORITY_LABELS: Record<MembersOpsPriority, string> = {
  P1: "P1 · Bloquant",
  P2: "P2 · Important",
  P3: "P3 · À planifier",
};

export const IMPACT_LABELS: Record<MembersOpsImpact, string> = {
  onboarding: "Onboarding",
  moderation: "Modération",
  qualite_data: "Qualité data",
  processus_interne: "Processus interne",
};
