import type { WelcomeInsight } from "@/components/member/dashboard/memberDashboardModel";
import type { MemberOverview } from "@/components/member/hooks/useMemberOverview";
import {
  FORMATIONS_VALIDEES_TRUTHS,
  FORMATIONS_VALIDEES_WHY,
} from "@/components/member/formations/validees/formationsValideesContent";
import {
  formatMonthLabel,
  getFormationTier,
  type FormationTier,
} from "@/components/member/formations/validees/formationsValideesUtils";

export type FormationsValideesProfile = "starting" | "building" | "onTrack" | "goalMet" | "champion";

export type FormationsValideesHeroModel = {
  firstName: string;
  welcomeKicker: string;
  welcomeTitle: string;
  welcomeMessage: string;
  welcomeInsights: WelcomeInsight[];
  tier: FormationTier;
};

export type FormationsValideesGuidanceModel = {
  introLead: string;
  encouragement: string;
  truths: typeof FORMATIONS_VALIDEES_TRUTHS;
};

function getFirstName(displayName: string, twitchLogin: string): string {
  const raw = displayName?.trim() || twitchLogin?.trim() || "toi";
  const first = raw.split(/\s+/)[0] || raw;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function resolveFormationsValideesProfile(input: {
  currentMonthValidated: number;
  goalFormations: number;
  totalValidated12Months: number;
  totalValidatedGlobal: number;
}): FormationsValideesProfile {
  if (input.totalValidatedGlobal >= 4 || input.totalValidated12Months >= 6) return "champion";
  if (input.goalFormations > 0 && input.currentMonthValidated >= input.goalFormations) return "goalMet";
  if (input.currentMonthValidated >= 1 || input.totalValidated12Months >= 2) return "onTrack";
  if (input.totalValidatedGlobal >= 1 || input.totalValidated12Months >= 1) return "building";
  return "starting";
}

export function buildFormationsValideesHeroModel(input: {
  overview: MemberOverview;
  selectedMonth: string;
  currentMonthValidated: number;
  goalFormations: number;
  totalValidated12Months: number;
  completionRate: number;
  remainingToTarget: number;
}): FormationsValideesHeroModel {
  const firstName = getFirstName(input.overview.member.displayName, input.overview.member.twitchLogin);
  const greeting = getTimeGreeting();
  const monthLabel = formatMonthLabel(input.selectedMonth);
  const tier = getFormationTier(input.currentMonthValidated);
  const totalGlobal = input.overview.stats.formationsValidated ?? 0;

  const profile = resolveFormationsValideesProfile({
    currentMonthValidated: input.currentMonthValidated,
    goalFormations: input.goalFormations,
    totalValidated12Months: input.totalValidated12Months,
    totalValidatedGlobal: totalGlobal,
  });

  let welcomeTitle: string;
  const paragraphs: string[] = [];

  if (profile === "starting") {
    welcomeTitle = `${greeting} ${firstName}, ton parcours formation commence ici`;
    paragraphs.push(
      `Sur ${monthLabel}, aucune validation enregistrée pour l'instant — pas de quoi te mettre la pression.`,
      "Le catalogue propose des sessions live ; une seule présence suffit à faire bouger cette page.",
    );
  } else if (profile === "building") {
    welcomeTitle = `${greeting} ${firstName}, tu poses les premières pierres`;
    paragraphs.push(
      "Tu as déjà des formations validées dans ton historique TENF — c'est un bon départ.",
      "Explore le catalogue ou ajuste ton objectif mensuel si tu veux te fixer un cap doux.",
    );
  } else if (profile === "goalMet") {
    welcomeTitle = `${greeting} ${firstName}, objectif du mois atteint`;
    paragraphs.push(
      `${input.currentMonthValidated} formation${input.currentMonthValidated > 1 ? "s" : ""} validée${input.currentMonthValidated > 1 ? "s" : ""} en ${monthLabel.split(" ")[0]?.toLowerCase() ?? "mois"} — bravo.`,
      "Tu peux viser plus haut depuis Objectifs, ou simplement savourer ce rythme.",
    );
  } else if (profile === "champion") {
    welcomeTitle = `${greeting} ${firstName}, beau parcours formation`;
    paragraphs.push(
      `${totalGlobal} formation${totalGlobal > 1 ? "s" : ""} validée${totalGlobal > 1 ? "s" : ""} au total — tu maîtrises déjà plusieurs briques TENF.`,
      "Continue à varier les thèmes : modération, technique, communauté… l'entraide passe aussi par là.",
    );
  } else {
    welcomeTitle = `${greeting} ${firstName}, tu avances sur ${monthLabel.split(" ")[0]?.toLowerCase() ?? "ce mois"}`;
    paragraphs.push(
      `${input.currentMonthValidated} validation${input.currentMonthValidated > 1 ? "s" : ""} ce mois — palier « ${tier.label} ».`,
      input.remainingToTarget > 0
        ? `Encore ${input.remainingToTarget} formation${input.remainingToTarget > 1 ? "s" : ""} pour ton objectif mensuel (${input.goalFormations}).`
        : "Ton objectif mensuel est déjà couvert — tu peux te reposer ou viser plus haut.",
    );
  }

  const insights: WelcomeInsight[] = [
    {
      id: "month",
      label: `${input.currentMonthValidated}/${input.goalFormations || "—"}`,
      detail: "Objectif mois",
      tone: input.goalFormations > 0 && input.currentMonthValidated >= input.goalFormations ? "success" : "accent",
    },
    {
      id: "rate",
      label: `${Math.round(input.completionRate)}%`,
      detail: "Progression",
      tone: input.completionRate >= 100 ? "success" : "info",
    },
    {
      id: "total",
      label: `${totalGlobal} total`,
      detail: "Validées TENF",
      tone: totalGlobal > 0 ? "warning" : "muted",
    },
  ];

  if (input.totalValidated12Months > 0) {
    insights.push({
      id: "12m",
      label: `${input.totalValidated12Months} sur 12 m.`,
      detail: "Glissant",
      tone: "info",
    });
  }

  return {
    firstName,
    welcomeKicker: "Mes formations validées",
    welcomeTitle,
    welcomeMessage: paragraphs.join("\n\n"),
    welcomeInsights: insights,
    tier,
  };
}

export function buildFormationsValideesGuidanceModel(input: {
  firstName: string;
  profile: FormationsValideesProfile;
  remainingToTarget: number;
}): FormationsValideesGuidanceModel {
  let encouragement: string;
  if (input.profile === "starting") {
    encouragement = `${input.firstName}, une session du catalogue suffit pour lancer ton historique — choisis un thème qui te parle, sans viser la perfection.`;
  } else if (input.profile === "goalMet") {
    encouragement = "Objectif atteint — prends le temps de digérer ce que tu as appris avant d'enchaîner, si tu en ressens le besoin.";
  } else if (input.remainingToTarget > 0) {
    encouragement = `Il te reste ${input.remainingToTarget} formation${input.remainingToTarget > 1 ? "s" : ""} pour ton cap du mois — ou tu peux baisser l'objectif sur la page Objectifs, sans culpabilité.`;
  } else {
    encouragement = "Tu construis une progression solide — les paliers sont là pour te féliciter, pas pour te comparer aux autres.";
  }

  return {
    introLead: FORMATIONS_VALIDEES_WHY.lead,
    encouragement,
    truths: FORMATIONS_VALIDEES_TRUTHS,
  };
}
