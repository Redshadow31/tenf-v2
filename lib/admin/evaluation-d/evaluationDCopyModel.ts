import {
  accentForTier,
  resolveAdminStaffTier,
  type AdminStaffTier,
} from "@/lib/admin/dashboard/adminDashboardModel";
import { firstNameFromDisplay, getTimeGreeting } from "@/lib/admin/account/adminAccountUtils";
import type { EvaluationDTab } from "@/lib/admin/evaluation-d/evaluationDTypes";

export type EvaluationDWelcomeInsight = {
  id: string;
  label: string;
  detail: string;
  tone: "accent" | "success" | "warning" | "info" | "muted";
};

export type EvaluationDGuideStep = {
  id: string;
  kicker: string;
  title: string;
  body: string;
};

export type EvaluationDKpiCounts = {
  members: number;
  vip: number;
  surveiller: number;
  pendingEdits: number;
  manualOverrides: number;
  historyLogs: number;
  finalNotesSaved: number;
};

export type EvaluationDCopyModel = {
  accent: string;
  tier: AdminStaffTier;
  tierLabel: string;
  firstName: string;
  displayName: string;
  welcomeKicker: string;
  welcomeBadge: string;
  welcomeTitle: string;
  welcomeMessage: string;
  welcomeInsights: EvaluationDWelcomeInsight[];
  heroGuideLine: string;
  encouragement: string;
  pageMission: string;
  guidanceKicker: string;
  guidanceTitle: string;
  guidanceIntro: string;
  guideSteps: EvaluationDGuideStep[];
  refreshLabel: string;
  tabs: Record<
    EvaluationDTab,
    { label: string; desc: string; step: string }
  >;
  kpi: {
    members: { label: string; hint: string };
    vip: { label: string; hint: string };
    surveiller: { label: string; hint: string };
    pending: { label: string; hint: string };
    manual: { label: string; hint: string };
    history: { label: string; hint: string };
  };
  aside: {
    backLabel: string;
    backIntro: string;
    sourcesTitle: string;
    workflowTitle: string;
    toolsTitle: string;
  };
  sections: {
    pilotage: { kicker: string; title: string; intro: string };
    tableau: { kicker: string; title: string; intro: string };
    historique: { kicker: string; title: string; intro: string };
    bareme: { kicker: string; title: string; intro: string };
  };
  toolbar: {
    kicker: string;
    title: string;
    intro: string;
    searchPlaceholder: string;
  };
};

export type BuildEvaluationDCopyInput = {
  displayName: string;
  rawRole?: string | null;
  monthLabel: string;
  counts: EvaluationDKpiCounts;
};

function buildWelcome(input: BuildEvaluationDCopyInput, tier: AdminStaffTier, firstName: string): Pick<
  EvaluationDCopyModel,
  | "welcomeKicker"
  | "welcomeBadge"
  | "welcomeTitle"
  | "welcomeMessage"
  | "welcomeInsights"
  | "heroGuideLine"
  | "encouragement"
  | "pageMission"
> {
  const { counts, monthLabel } = input;
  const greeting = getTimeGreeting();
  const insights: EvaluationDWelcomeInsight[] = [
    {
      id: "members",
      label: "Membres",
      detail: String(counts.members),
      tone: "muted",
    },
    {
      id: "vip",
      label: "VIP",
      detail: String(counts.vip),
      tone: "success",
    },
    {
      id: "surveiller",
      label: "À surveiller",
      detail: String(counts.surveiller),
      tone: counts.surveiller > 0 ? "warning" : "muted",
    },
    {
      id: "pending",
      label: "En attente",
      detail: String(counts.pendingEdits),
      tone: counts.pendingEdits > 0 ? "warning" : "success",
    },
  ];

  const baseMission =
    "La synthèse /34 consolide Spotlight, Raids, Discord, Events, Follow et les bonus — chaque override laisse une trace.";

  switch (tier) {
    case "founder":
    case "coordinator":
      return {
        welcomeKicker: `${greeting} · ${monthLabel}`,
        welcomeBadge: "Synthèse mensuelle",
        welcomeTitle: `${firstName} — pilote la note finale du mois`,
        welcomeMessage:
          counts.pendingEdits > 0
            ? `${counts.pendingEdits} modification(s) non enregistrée(s) : valide ou documente avant de clôturer ${monthLabel}.`
            : `${counts.vip} VIP et ${counts.surveiller} profils à surveiller ce mois — commence par le pilotage, puis le tableau.`,
        welcomeInsights: insights,
        heroGuideLine:
          "Priorité : sources A/B/C à jour → lecture des signaux → overrides motivés dans l'historique.",
        encouragement: `${firstName}, cette page est le contrat de reconnaissance TENF — prends le temps de la rendre juste.`,
        pageMission: baseMission,
      };
    case "moderator_discovery":
    case "moderator_paused":
      return {
        welcomeKicker: `${greeting} · découverte`,
        welcomeBadge: "Observation synthèse",
        welcomeTitle: `${firstName} — comprends le barème avant d'agir`,
        welcomeMessage:
          "Parcours le pilotage et le barème expliqué. Les overrides restent réservés au staff confirmé — tu peux filtrer et exporter.",
        welcomeInsights: insights,
        heroGuideLine: "Lis les KPI, repère VIP et « à surveiller », pose tes questions au staff référent.",
        encouragement: "Curiosité et rigueur : exactement ce qu'on attend pour monter en compétence sur l'évaluation.",
        pageMission: baseMission,
      };
    default:
      return {
        welcomeKicker: `${greeting} · ${monthLabel}`,
        welcomeBadge: "Staff évaluation",
        welcomeTitle: `${firstName} — synthèse & bonus TENF`,
        welcomeMessage:
          counts.surveiller > 0
            ? `${counts.surveiller} membre(s) sous le seuil de vigilance — filtre « À surveiller » dans le tableau.`
            : `Mois ${monthLabel} : parcours pilotage → édition → historique pour une clôture propre.`,
        welcomeInsights: insights,
        heroGuideLine: "Choisis le mois, lis les signaux, édite avec un motif clair pour chaque override.",
        encouragement: `${firstName}, merci de tenir cette synthèse lisible pour toute l'équipe.`,
        pageMission: baseMission,
      };
  }
}

function buildGuideSteps(tier: AdminStaffTier): EvaluationDGuideStep[] {
  const overrideBody =
    tier === "moderator_discovery" || tier === "moderator_paused"
      ? "Observe les overrides existants dans l'historique — ne modifie pas seul sans validation staff."
      : "Override uniquement avec motif ; enregistre par lot ou note par note.";

  return [
    {
      id: "sources",
      kicker: "Étape 1",
      title: "Vérifier les sources",
      body: "Sections A (Spotlight, Raids), B (Discord, Events), C (Follow) alimentent le tableau — corrige en amont si un pilier est vide.",
    },
    {
      id: "signals",
      kicker: "Étape 2",
      title: "Lire les signaux",
      body: "Pilotage : moyennes, VIP progressif (10 / 12 / 15), à surveiller (2 mois < 5 consécutifs), passage Communauté au 3e mois (< 61 j : note non significative).",
    },
    {
      id: "validate",
      kicker: "Étape 3",
      title: "Assumer les décisions",
      body: overrideBody,
    },
  ];
}

export function buildEvaluationDCopyModel(input: BuildEvaluationDCopyInput): EvaluationDCopyModel {
  const tier = resolveAdminStaffTier(input.rawRole ?? null);
  const accent = accentForTier(tier);
  const firstName = firstNameFromDisplay(input.displayName);
  const welcome = buildWelcome(input, tier, firstName);

  return {
    accent,
    tier,
    tierLabel: tier.replace(/_/g, " "),
    firstName,
    displayName: input.displayName,
    ...welcome,
    guidanceKicker: "Marche staff · synthèse",
    guidanceTitle: "Comment clôturer un mois proprement",
    guidanceIntro: "Trois gestes qui évitent les surprises en réunion staff ou en communication membres.",
    guideSteps: buildGuideSteps(tier),
    refreshLabel: "Recharger les données",
    tabs: {
      pilotage: { step: "01", label: "Pilotage", desc: "KPI, graphiques & barème" },
      tableau: { step: "02", label: "Tableau d'édition", desc: "Notes, bonus & décisions" },
      historique: { step: "03", label: "Historique", desc: "Overrides & traçabilité" },
    },
    kpi: {
      members: { label: "Membres évalués", hint: "Profils chargés pour le mois" },
      vip: { label: "VIP (10·12·15)", hint: "Seuil auto selon jours d'historique TENF" },
      surveiller: { label: "À surveiller", hint: "2 mois consécutifs < 5 (≥ 61 j) — 3e mois → Communauté" },
      pending: { label: "Modifs en attente", hint: "Non enregistrées dans le tableau" },
      manual: { label: "Overrides actifs", hint: "Notes manuelles en cours d'édition" },
      history: { label: "Traces du mois", hint: "Entrées dans l'historique" },
    },
    aside: {
      backLabel: "Hub évaluation",
      backIntro: "Retour au dashboard sections A · B · C",
      sourcesTitle: "Sources du barème",
      workflowTitle: "Parcours mensuel",
      toolsTitle: "Outils liés",
    },
    sections: {
      pilotage: {
        kicker: "Lecture",
        title: "Vue d'ensemble & barème",
        intro: "Comprends le mois avant d'éditer — moyennes, signaux et référentiel /34.",
      },
      tableau: {
        kicker: "Édition",
        title: "Tableau récapitulatif",
        intro: "Zones colorées par domaine. Scroll vertical ; colonnes adaptées à la largeur écran.",
      },
      historique: {
        kicker: "Traçabilité",
        title: "Journal des overrides",
        intro: "Qui, quand, pourquoi — preuve staff pour chaque écart au calcul automatique.",
      },
      bareme: {
        kicker: "Référentiel",
        title: "Barème expliqué",
        intro: "Sections A / B / C + bonus — même logique que le dashboard évaluation.",
      },
    },
    toolbar: {
      kicker: "Contrôles",
      title: "Filtres, affichage & export",
      intro: "Le mois sélectionné s'applique à tous les onglets.",
      searchPlaceholder: "Pseudo, nom ou rôle…",
    },
  };
}

export const EVAL_D_LOADING_COPY = {
  accent: "#8b5cf6",
  title: "Chargement de la synthèse…",
  subtitle: "Agrégation des sections A, B, C et des notes finales du mois.",
};
