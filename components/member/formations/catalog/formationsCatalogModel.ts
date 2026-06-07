import type { WelcomeInsight } from "@/components/member/dashboard/memberDashboardModel";
import type { MemberOverview } from "@/components/member/hooks/useMemberOverview";
import {
  FORMATIONS_CATALOG_TRUTHS,
  FORMATIONS_CATALOG_WHY,
} from "@/components/member/formations/catalog/formationsCatalogContent";

export type FormationsCatalogProfile =
  | "discovery"
  | "curious"
  | "registered"
  | "learner"
  | "advanced";

export type FormationsCatalogHeroModel = {
  firstName: string;
  welcomeKicker: string;
  welcomeTitle: string;
  welcomeMessage: string;
  welcomeInsights: WelcomeInsight[];
  profileBadge: string;
};

export type FormationsCatalogGuidanceModel = {
  introLead: string;
  encouragement: string;
  truths: typeof FORMATIONS_CATALOG_TRUTHS;
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

export function resolveFormationsCatalogProfile(input: {
  validatedTotal: number;
  validatedThisMonth: number;
  interestedCount: number;
  registeredUpcoming: number;
  upcomingCount: number;
}): FormationsCatalogProfile {
  if (input.validatedTotal >= 3) return "advanced";
  if (input.validatedTotal >= 1 || input.validatedThisMonth >= 1) return "learner";
  if (input.registeredUpcoming > 0) return "registered";
  if (input.interestedCount > 0) return "curious";
  return "discovery";
}

function profileBadge(profile: FormationsCatalogProfile): string {
  if (profile === "advanced") return "Parcours avancé";
  if (profile === "learner") return "En apprentissage";
  if (profile === "registered") return "Inscrit·e à une session";
  if (profile === "curious") return "Thèmes repérés";
  return "Exploration";
}

export function buildFormationsCatalogHeroModel(input: {
  overview: MemberOverview | null;
  upcomingCount: number;
  catalogCount: number;
  interestedCount: number;
  registeredUpcoming: number;
}): FormationsCatalogHeroModel {
  const displayName = input.overview?.member.displayName || input.overview?.member.twitchLogin || "";
  const twitchLogin = input.overview?.member.twitchLogin || "";
  const firstName = getFirstName(displayName, twitchLogin);
  const greeting = getTimeGreeting();
  const validatedTotal = input.overview?.stats.formationsValidated ?? 0;
  const validatedThisMonth =
    input.overview?.stats.formationsValidatedThisMonth ??
    (input.overview?.formationHistory ?? []).filter(
      (item) => (item.date ?? "").slice(0, 7) === (input.overview?.monthKey ?? ""),
    ).length;

  const profile = resolveFormationsCatalogProfile({
    validatedTotal,
    validatedThisMonth,
    interestedCount: input.interestedCount,
    registeredUpcoming: input.registeredUpcoming,
    upcomingCount: input.upcomingCount,
  });

  let welcomeTitle: string;
  const paragraphs: string[] = [];

  if (profile === "advanced") {
    welcomeTitle = `${greeting} ${firstName}, tu construis un vrai parcours`;
    paragraphs.push(
      `${validatedTotal} formation${validatedTotal > 1 ? "s" : ""} validée${validatedTotal > 1 ? "s" : ""} — tu maîtrises déjà plusieurs piliers TENF.`,
      "Continue à explorer le catalogue : un thème passé peut revenir, et tes retours guident l'équipe.",
    );
  } else if (profile === "learner") {
    welcomeTitle = `${greeting} ${firstName}, tu avances sur le parcours`;
    paragraphs.push(
      "Tu as déjà validé au moins une formation — bravo pour l'investissement.",
      "Regarde les prochaines sessions ou manifeste ton intérêt sur un thème archive pour relancer un créneau.",
    );
  } else if (profile === "registered") {
    welcomeTitle = `${greeting} ${firstName}, ta session est dans le radar`;
    paragraphs.push(
      "Tu es inscrit·e à une prochaine formation — pense à l'ajouter à ton calendrier.",
      "Pas d'obligation de tout suivre d'un coup : une session bien choisie vaut mieux qu'une liste impossible.",
    );
  } else if (profile === "curious") {
    welcomeTitle = `${greeting} ${firstName}, tu as repéré des thèmes`;
    paragraphs.push(
      "Tes demandes d'intérêt sont remontées à l'équipe — merci pour ça.",
      "En attendant un nouveau créneau, explore les sessions à venir ou propose un sujet via le formulaire.",
    );
  } else {
    welcomeTitle = `${greeting} ${firstName}, bienvenue au catalogue TENF`;
    paragraphs.push(
      "Sessions live à venir, archives thématiques et formulaire libre — trois portes d'entrée sans pression.",
      "Choisis ce qui te parle : modération, technique, communauté… le parcours Academy s'appuie sur ces briques.",
    );
  }

  const insights: WelcomeInsight[] = [
    {
      id: "upcoming",
      label: `${input.upcomingCount} session${input.upcomingCount > 1 ? "s" : ""}`,
      detail: "À venir",
      tone: input.upcomingCount > 0 ? "accent" : "muted",
    },
    {
      id: "catalog",
      label: `${input.catalogCount} thème${input.catalogCount > 1 ? "s" : ""}`,
      detail: "Archive",
      tone: "info",
    },
  ];

  if (input.interestedCount > 0) {
    insights.push({
      id: "interests",
      label: `${input.interestedCount} intérêt${input.interestedCount > 1 ? "s" : ""}`,
      detail: "En attente staff",
      tone: "success",
    });
  }

  if (validatedTotal > 0) {
    insights.push({
      id: "validated",
      label: `${validatedTotal} validée${validatedTotal > 1 ? "s" : ""}`,
      detail: "Historique TENF",
      tone: "warning",
    });
  }

  return {
    firstName,
    welcomeKicker: "Formations TENF",
    welcomeTitle,
    welcomeMessage: paragraphs.join("\n\n"),
    welcomeInsights: insights,
    profileBadge: profileBadge(profile),
  };
}

export function buildFormationsCatalogGuidanceModel(input: {
  firstName: string;
  profile: FormationsCatalogProfile;
  twitchConnected: boolean;
}): FormationsCatalogGuidanceModel {
  let encouragement: string;
  if (input.profile === "discovery") {
    encouragement = `${input.firstName}, commence par une session à venir ou clique « Ça m'intéresse » sur un thème archive — un geste suffit pour lancer le dialogue avec l'équipe.`;
  } else if (input.profile === "registered") {
    encouragement = "Pense à te ménager avant la session : note tes questions, vérifie Discord et ton lien Twitch si tu veux profiter des intégrations profil.";
  } else if (!input.twitchConnected) {
    encouragement = "Twitch non lié : tu peux quand même consulter et t'inscrire. Lie ton compte depuis Paramètres si tu veux synchroniser certaines infos profil.";
  } else {
    encouragement = "Tu trouves déjà ta place dans le parcours — continue à mixer sessions live et signalements d'intérêt selon ton énergie du moment.";
  }

  return {
    introLead: FORMATIONS_CATALOG_WHY.lead,
    encouragement,
    truths: FORMATIONS_CATALOG_TRUTHS,
  };
}
