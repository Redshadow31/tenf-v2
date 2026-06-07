import type { WelcomeInsight } from "@/components/member/dashboard/memberDashboardModel";
import type { MemberOverview } from "@/components/member/hooks/useMemberOverview";
import {
  ACTIVITY_GENTLE_TRUTHS,
  ACTIVITY_WHY,
} from "@/components/member/activity/activityContent";
import { formatMonthLabel } from "@/components/member/activity/activityUtils";

export type ActivityRhythmProfile = "quiet" | "growing" | "steady" | "intense" | "events" | "raids";

export type ActivityHeroModel = {
  firstName: string;
  welcomeKicker: string;
  welcomeTitle: string;
  welcomeMessage: string;
  welcomeInsights: WelcomeInsight[];
  rhythmBadge: string;
};

export type ActivityGuidanceModel = {
  introLead: string;
  encouragement: string;
  truths: typeof ACTIVITY_GENTLE_TRUTHS;
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

export function resolveActivityRhythmProfile(input: {
  intensityScore: number;
  raidsLive: number;
  eventPresences: number;
  participation: number;
  attendedThisMonth: number;
}): ActivityRhythmProfile {
  if (input.intensityScore >= 55) return "intense";
  if (input.eventPresences >= 3 || input.attendedThisMonth >= 3) return "events";
  if (input.raidsLive >= 5) return "raids";
  if (input.participation >= 4 || input.intensityScore >= 25) return "steady";
  if (input.intensityScore >= 8 || input.participation >= 1) return "growing";
  return "quiet";
}

function rhythmLabel(profile: ActivityRhythmProfile): string {
  if (profile === "intense") return "Mois dense";
  if (profile === "events") return "Présence événements";
  if (profile === "raids") return "Moteur de raids";
  if (profile === "steady") return "Rythme régulier";
  if (profile === "growing") return "En progression";
  return "Mois tranquille";
}

export function buildActivityHeroModel(input: {
  overview: MemberOverview;
  intensityScore: number;
  raidsLive: number;
  attendedThisMonth: number;
  trackedThisMonth: number;
}): ActivityHeroModel {
  const { overview } = input;
  const firstName = getFirstName(overview.member.displayName, overview.member.twitchLogin);
  const greeting = getTimeGreeting();
  const monthLabel = formatMonthLabel(overview.monthKey);
  const profile = resolveActivityRhythmProfile({
    intensityScore: input.intensityScore,
    raidsLive: input.raidsLive,
    eventPresences: overview.stats.eventPresencesThisMonth ?? 0,
    participation: overview.stats.participationThisMonth ?? 0,
    attendedThisMonth: input.attendedThisMonth,
  });

  let welcomeTitle: string;
  const paragraphs: string[] = [];

  if (profile === "quiet") {
    welcomeTitle = `${greeting} ${firstName}, un mois posé — et c'est ok`;
    paragraphs.push(
      `Sur ${monthLabel}, ton radar communautaire est encore discret — pas de quoi culpabiliser.`,
      "Un raid, un événement ou un passage Discord suffit parfois à relancer le lien. Cette page reste une boussole, pas une course.",
    );
  } else if (profile === "growing") {
    welcomeTitle = `${greeting} ${firstName}, tu commences à laisser ta trace`;
    paragraphs.push(
      "Quelques gestes ce mois-ci — raids, présences ou formations — montrent déjà que tu fais vivre TENF.",
      "Continue à ton rythme : l'entraide, c'est aussi la régularité douce, pas l'épuisement.",
    );
  } else if (profile === "events") {
    welcomeTitle = `${greeting} ${firstName}, tu animes la vie collective`;
    paragraphs.push(
      "Tu es présent·e aux événements TENF — c'est ce qui tisse la commu entre les streams.",
      "Merci pour ça : chaque présence rend les moments forts plus chaleureux pour les autres.",
    );
  } else if (profile === "raids") {
    welcomeTitle = `${greeting} ${firstName}, tu pousses l'entraide en raid`;
    paragraphs.push(
      "Tes raids ce mois-ci portent d'autres créateurs — c'est le cœur battant de TENF.",
      "Pense aussi à varier les cibles et à te ménager : l'entraide durable bat le sprint d'un mois.",
    );
  } else if (profile === "intense") {
    welcomeTitle = `${greeting} ${firstName}, beau rythme ce mois-ci`;
    paragraphs.push(
      "Raids, événements, formations — tu cumules les façons de participer. Impressionnant, mais pense à pauser si tu en ressens le besoin.",
      "TENF te remercie pour l'énergie partagée ; ton bien-être reste prioritaire.",
    );
  } else {
    welcomeTitle = `${greeting} ${firstName}, voici ton radar de ${monthLabel.split(" ")[0]?.toLowerCase() ?? "mois"}`;
    paragraphs.push(
      "Une présence régulière qui fait vivre TENF — merci pour ça.",
      "Les chiffres racontent une histoire ; ils ne la décident pas. Utilise cette page pour te situer, pas pour te comparer.",
    );
  }

  const insights: WelcomeInsight[] = [
    {
      id: "month",
      label: monthLabel.split(" ")[0] ?? monthLabel,
      detail: `${input.intensityScore}% intensité`,
      tone: "accent",
    },
  ];

  if (input.trackedThisMonth > 0) {
    insights.push({
      id: "events",
      label: `${input.attendedThisMonth}/${input.trackedThisMonth} événements`,
      detail: "Suivis ce mois",
      tone: input.attendedThisMonth > 0 ? "success" : "warning",
    });
  }

  if (input.raidsLive > 0) {
    insights.push({
      id: "raids",
      label: `${input.raidsLive} raid${input.raidsLive > 1 ? "s" : ""}`,
      detail: "Hub TENF ce mois",
      tone: "info",
    });
  }

  if (overview.vip?.activeThisMonth) {
    insights.push({
      id: "vip",
      label: "VIP actif",
      detail: "Ce mois-ci",
      tone: "warning",
    });
  }

  return {
    firstName,
    welcomeKicker: "Mon mois TENF",
    welcomeTitle,
    welcomeMessage: paragraphs.join("\n\n"),
    welcomeInsights: insights,
    rhythmBadge: rhythmLabel(profile),
  };
}

export function buildActivityGuidanceModel(input: {
  firstName: string;
  profile: ActivityRhythmProfile;
  upcomingCount: number;
}): ActivityGuidanceModel {
  let encouragement: string;
  if (input.profile === "quiet") {
    encouragement = `${input.firstName}, un petit pas suffit : un live TENF à raid, un événement au planning, ou un message Discord — choisis ce qui te parle.`;
  } else if (input.profile === "intense") {
    encouragement = "Bel engagement — pense à respirer entre deux actions. La commu a besoin de toi sur la durée, pas épuisé·e en une semaine.";
  } else if (input.upcomingCount > 0) {
    encouragement = `${input.upcomingCount} rendez-vous à venir : tu peux t'inscrire ou passer en présence sans te mettre la pression d'être partout.`;
  } else {
    encouragement = "Tu trouves déjà ta place dans TENF — continue à explorer raids, événements et formations à ton tempo.";
  }

  return {
    introLead: ACTIVITY_WHY.lead,
    encouragement,
    truths: ACTIVITY_GENTLE_TRUTHS,
  };
}
