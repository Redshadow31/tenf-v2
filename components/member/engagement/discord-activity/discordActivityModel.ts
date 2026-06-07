import type { WelcomeInsight } from "@/components/member/dashboard/memberDashboardModel";
import type { MemberOverview } from "@/components/member/hooks/useMemberOverview";
import {
  DISCORD_GENTLE_TRUTHS,
  DISCORD_PRACTICAL_TIPS,
  DISCORD_WHY_INTRO,
} from "@/components/member/engagement/discord-activity/discordActivityContent";
import type {
  DiscordActivityLoadState,
  DiscordActivityTotals,
  DiscordMonthRow,
} from "@/components/member/engagement/discord-activity/discordActivityUtils";
import { formatMonthShort, formatVocalSummary } from "@/components/member/engagement/discord-activity/discordActivityUtils";

export type DiscordPresenceProfile = "quiet" | "writer" | "vocalist" | "balanced" | "anchor";

export type DiscordActivityHeroModel = {
  firstName: string;
  welcomeKicker: string;
  welcomeTitle: string;
  welcomeMessage: string;
  welcomeInsights: WelcomeInsight[];
  profileBadge: string;
};

export type DiscordActivityGuidanceModel = {
  introLead: string;
  encouragement: string;
  truths: typeof DISCORD_GENTLE_TRUTHS;
  tips: string[];
  tipsTitle: string;
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

function getRecentMonthRow(months: DiscordMonthRow[]): DiscordMonthRow | null {
  return [...months].sort((a, b) => b.month.localeCompare(a.month)).find((row) => row.messages > 0 || row.vocalMinutes > 0) || null;
}

export function resolvePresenceProfile(totals: DiscordActivityTotals, recent: DiscordMonthRow | null): DiscordPresenceProfile {
  if (totals.activeMonthCount <= 1 && totals.totalMessages + totals.totalVocalMinutes < 30) return "quiet";
  if (!recent) return "balanced";

  const msgScore = recent.messages;
  const vocalScore = recent.vocalMinutes / 20;
  if (msgScore >= 80 || (msgScore > vocalScore * 2 && msgScore >= 25)) return "writer";
  if (vocalScore >= 8 || (vocalScore > msgScore && recent.vocalMinutes >= 120)) return "vocalist";
  if (totals.activeMonthCount >= 4 && totals.totalMessages + totals.totalVocalMinutes / 2 >= 120) return "anchor";
  return "balanced";
}

function profileLabel(profile: DiscordPresenceProfile): string {
  if (profile === "quiet") return "Présence légère";
  if (profile === "writer") return "Voix écrite";
  if (profile === "vocalist") return "Présence vocale";
  if (profile === "anchor") return "Pilier du salon";
  return "Présence régulière";
}

export function buildDiscordActivityHeroModel(input: {
  overview?: MemberOverview | null;
  displayName: string;
  twitchLogin: string;
  loadState: DiscordActivityLoadState;
  totals: DiscordActivityTotals;
  months: DiscordMonthRow[];
}): DiscordActivityHeroModel {
  const firstName = getFirstName(input.displayName, input.twitchLogin);
  const greeting = getTimeGreeting();
  const recent = getRecentMonthRow(input.months);
  const profile = resolvePresenceProfile(input.totals, recent);
  const paragraphs: string[] = [];
  const insights: WelcomeInsight[] = [];

  let welcomeTitle: string;
  if (input.loadState === "empty") {
    welcomeTitle = `${greeting} ${firstName}, ta trace Discord arrive bientôt`;
    paragraphs.push(
      "Dès que l'équipe aura importé les prochains exports du serveur TENF, tes messages et ton temps vocal apparaîtront ici — mois par mois.",
      "En attendant, le Discord reste ouvert : un simple passage pour souhaiter bon live à quelqu'un, c'est déjà de l'entraide.",
    );
  } else if (input.loadState === "unmatched") {
    welcomeTitle = `${greeting} ${firstName}, on te cherche encore dans les exports`;
    paragraphs.push(
      "Des mois sont bien enregistrés côté TENF, mais aucune ligne ne correspond encore à ton profil dans ces fichiers.",
      "Vérifie que ton pseudo Twitch sur ta fiche membre est identique aux classements Discord, ou que ton compte Discord est bien relié — sans drama, juste un réglage.",
    );
  } else if (input.loadState === "error") {
    welcomeTitle = `${greeting} ${firstName}, petit souci de chargement`;
    paragraphs.push(
      "Impossible d'afficher tes stats pour le moment. Recharge la page dans un instant — tes données n'ont pas disparu.",
      "Le Discord TENF, lui, continue de tourner : tu peux y passer même si ce tableau met une minute à revenir.",
    );
  } else if (profile === "quiet") {
    welcomeTitle = `${greeting} ${firstName} — chaque petit passage compte`;
    paragraphs.push(
      "Ta présence Discord est discrète pour l'instant, et ce n'est pas un échec : beaucoup de membres lisent plus qu'ils n'écrivent.",
      "Si tu as envie de renforcer le lien, un message de temps en temps dans les salons entraide ou annonces suffit — pas besoin d'être partout.",
    );
  } else if (profile === "writer") {
    welcomeTitle = `${greeting} ${firstName}, tu fais vivre le fil écrit`;
    paragraphs.push(
      "Tu participes surtout par les messages — c'est précieux pour coordonner raids, lives et coups de main rapides.",
      "Merci de garder ce fil chaleureux : derrière chaque ligne, il y a souvent quelqu'un qui hésitait à demander de l'aide.",
    );
  } else if (profile === "vocalist") {
    welcomeTitle = `${greeting} ${firstName}, tu crées du lien en vocal`;
    paragraphs.push(
      "Tu passes du temps en vocal — c'est l'une des façons les plus directes de tisser l'entraide TENF entre deux streams.",
      "Continue à ton rythme : accueillir, écouter, orienter vers un live ou un raid, ça compte autant que les chiffres.",
    );
  } else if (profile === "anchor") {
    welcomeTitle = `${greeting} ${firstName} — belle constance sur le serveur`;
    paragraphs.push(
      `Sur ${input.totals.activeMonthCount} mois actifs, tu as tissé une vraie présence — messages, vocal, régularité.`,
      "Ce type d'engagement invisible retient les nouveaux·elles et donne de l'énergie à toute la commu. Merci pour ça.",
    );
  } else {
    welcomeTitle = `${greeting} ${firstName}, tu es bien là pour la commu`;
    paragraphs.push(
      "Tu mixes messages et vocal sur plusieurs mois — une présence équilibrée qui aide le serveur à rester vivant.",
      "Cette page te montre ta trace pour te situer, pas pour te mettre la pression : l'entraide TENF, c'est aussi le long terme.",
    );
  }

  if (input.loadState === "ready") {
    insights.push({
      id: "messages-total",
      label: `${input.totals.totalMessages.toLocaleString("fr-FR")} messages`,
      detail: "Tous mois confondus",
      tone: "info",
    });
    insights.push({
      id: "vocal-total",
      label: `${input.totals.totalVocalHours} h vocal`,
      detail: formatVocalSummary(input.totals.totalVocalMinutes),
      tone: "accent",
    });
    if (input.totals.activeMonthCount > 0) {
      insights.push({
        id: "active-months",
        label: `${input.totals.activeMonthCount} mois actifs`,
        detail: `sur ${input.totals.trackedMonthCount} suivis`,
        tone: "success",
      });
    }
    if (input.totals.bestMonth) {
      insights.push({
        id: "best-month",
        label: `Pic : ${formatMonthShort(input.totals.bestMonth.month)}`,
        detail: `${input.totals.bestMonth.messages} msg · ${formatVocalSummary(input.totals.bestMonth.vocalMinutes)}`,
        tone: "warning",
      });
    }
  } else if (input.loadState === "unmatched") {
    insights.push({
      id: "check-profile",
      label: "Profil à vérifier",
      detail: "Pseudo Twitch / lien Discord",
      tone: "warning",
    });
  }

  return {
    firstName,
    welcomeKicker: "Discord TENF · entraide",
    welcomeTitle,
    welcomeMessage: paragraphs.join("\n\n"),
    welcomeInsights: insights,
    profileBadge: profileLabel(profile),
  };
}

export function buildDiscordActivityGuidanceModel(input: {
  profile: DiscordPresenceProfile;
  loadState: DiscordActivityLoadState;
  firstName: string;
}): DiscordActivityGuidanceModel {
  let encouragement: string;
  let tips = [...DISCORD_PRACTICAL_TIPS];
  let tipsTitle = "Petites actions utiles";

  if (input.loadState === "unmatched") {
    encouragement =
      `${input.firstName}, sans profil bien rattaché, la commu ne peut pas te « voir » dans ces stats — mais tu peux quand même participer sur Discord dès maintenant.`;
    tips = [
      "Ouvre ta fiche membre TENF et vérifie ton pseudo Twitch.",
      "Assure-toi que ton Discord est bien celui lié à ton compte TENF.",
      "Passe dire bonjour dans un salon accueil ou annonces — un message suffit pour commencer.",
      ...tips.slice(2),
    ];
  } else if (input.profile === "quiet") {
    encouragement =
      "Tu n'as pas besoin d'être hyperactif·ve : observer, réagir parfois, passer en vocal quand tu te sens prêt·e — c'est déjà nourrir l'entraide.";
    tipsTitle = "Par où commencer doucement";
    tips = [
      "Repère le salon des annonces lives TENF : un emoji ou un « bon live » suffit.",
      "Quand tu vois un·e nouveau·elle hésiter, un message d'accueil change la journée.",
      "Le vocal n'est pas obligatoire : tu peux rester en écoute si tu préfères.",
      ...tips.slice(1),
    ];
  } else if (input.profile === "writer") {
    encouragement =
      "Tes messages aident à coordonner l'entraide — pense à garder un ton bienveillant, surtout quand quelqu'un demande de l'aide pour la première fois.";
  } else if (input.profile === "vocalist") {
    encouragement =
      "En vocal, tu crées de la proximité : pense à laisser de la place aux voix timides et à orienter vers les lives TENF quand c'est pertinent.";
  } else if (input.profile === "anchor") {
    encouragement =
      "Ta régularité fait office de repère pour les autres — continue sans t'épuiser : l'entraide durable bat la performance sur un mois.";
  } else {
    encouragement =
      "Tu mixes écrit et vocal : c'est l'idéal pour rester connecté·e à la commu sans tout miser sur un seul format.";
  }

  return {
    introLead: DISCORD_WHY_INTRO.lead,
    encouragement,
    truths: DISCORD_GENTLE_TRUTHS,
    tips,
    tipsTitle,
  };
}

export function resolveProfileFromData(
  totals: DiscordActivityTotals,
  months: DiscordMonthRow[],
): DiscordPresenceProfile {
  return resolvePresenceProfile(totals, getRecentMonthRow(months));
}
