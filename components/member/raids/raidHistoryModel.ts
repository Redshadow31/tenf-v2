import type { WelcomeInsight } from "@/components/member/dashboard/memberDashboardModel";
import { formatMonthLabel } from "@/components/member/raids/raidHistoryUtils";

export type RaidHistoryHeroModel = {
  firstName: string;
  welcomeKicker: string;
  welcomeTitle: string;
  welcomeMessage: string;
  welcomeInsights: WelcomeInsight[];
  monthBadge: string;
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

export function buildRaidHistoryHeroModel(input: {
  displayName?: string;
  twitchLogin?: string;
  selectedMonth: string;
  totalMonth: number;
  validatedMonth: number;
  pendingMonth: number;
  rejectedMonth: number;
  validationRate: number;
  raidsTotalAllTime?: number;
}): RaidHistoryHeroModel {
  const firstName = getFirstName(input.displayName || "", input.twitchLogin || "");
  const greeting = getTimeGreeting();
  const monthLabel = formatMonthLabel(input.selectedMonth);
  const monthShort = monthLabel.split(" ")[0] ?? monthLabel;
  const { totalMonth, validatedMonth, pendingMonth, rejectedMonth, validationRate } = input;

  let welcomeTitle: string;
  if (totalMonth === 0) {
    welcomeTitle = `${greeting} ${firstName}, ta prochaine trace d'entraide t'attend`;
  } else if (validatedMonth >= totalMonth && totalMonth > 0) {
    welcomeTitle = `${greeting} ${firstName} — belle constance ce mois-ci`;
  } else if (validatedMonth > 0) {
    welcomeTitle = `${greeting} ${firstName}, tu fais déjà la différence`;
  } else if (pendingMonth > 0) {
    welcomeTitle = `${greeting} ${firstName}, tes raids sont en route`;
  } else {
    welcomeTitle = `${greeting} ${firstName}, voici tes envois de ${monthShort}`;
  }

  const paragraphs: string[] = [];

  if (totalMonth === 0) {
    paragraphs.push(
      `Sur ${monthLabel}, aucun raid n'est encore enregistré à ton nom — et ce n'est pas un échec, juste une page blanche.`,
      `Passe sur un live TENF, envoie un raid avec bienveillance : Twitch le détecte tout seul et ta trace apparaît ici. Chaque petit geste compte pour quelqu'un.`,
    );
  } else if (validatedMonth === 0 && pendingMonth > 0) {
    paragraphs.push(
      `Tu as déjà tendu la main ${totalMonth} fois en ${monthShort} — merci pour ça.`,
      `${pendingMonth} envoi${pendingMonth > 1 ? "s sont" : " est"} encore en vérification. Pas d'inquiétude : dès que c'est validé, tu le verras ici sans rien faire.`,
    );
  } else if (validationRate >= 80 && validatedMonth > 0) {
    paragraphs.push(
      `${validatedMonth} raid${validatedMonth > 1 ? "s validés" : " validé"} sur ${totalMonth} en ${monthShort} — tu entretiens vraiment l'entraide TENF.`,
      `Ce journal garde la mémoire de tes passages : qui tu as soutenu·e, quand, et comment ça a été compté. Continue à ton rythme, sans te mettre la pression.`,
    );
  } else if (rejectedMonth > 0 && validatedMonth > 0) {
    paragraphs.push(
      `${validatedMonth} raid${validatedMonth > 1 ? "s comptent" : " compte"} pour toi ce mois — c'est déjà une belle énergie partagée.`,
      `${rejectedMonth} envoi${rejectedMonth > 1 ? "s n'ont" : " n'a"} pas été retenu${rejectedMonth > 1 ? "s" : ""} : regarde le détail plus bas si tu veux comprendre, sans culpabiliser.`,
    );
  } else {
    paragraphs.push(
      `Voici ce que tu as envoyé comme soutien en ${monthShort} — dates, chaînes cibles et statut, mois par mois.`,
      `Les raids Twitch sont détectés automatiquement. Si un passage manque, le formulaire de secours reste là, sans drama.`,
    );
  }

  const insights: WelcomeInsight[] = [];

  insights.push({
    id: "auto-twitch",
    label: "Détection auto Twitch",
    detail: "Pas besoin de déclarer à la main",
    tone: "info",
  });

  if (totalMonth > 0) {
    insights.push({
      id: "month-total",
      label: `${totalMonth} envoi${totalMonth > 1 ? "s" : ""} ce mois`,
      detail: monthLabel,
      tone: "accent",
    });
  }

  if (pendingMonth > 0) {
    insights.push({
      id: "pending",
      label: `${pendingMonth} en vérification`,
      detail: "Validation en cours côté TENF",
      tone: "warning",
    });
  }

  if (validatedMonth > 0) {
    insights.push({
      id: "validated",
      label: `${validationRate}% validés`,
      detail: `${validatedMonth} raid${validatedMonth > 1 ? "s" : ""} compté${validatedMonth > 1 ? "s" : ""}`,
      tone: "success",
    });
  }

  if ((input.raidsTotalAllTime ?? 0) > totalMonth) {
    const allTime = input.raidsTotalAllTime ?? 0;
    insights.push({
      id: "all-time",
      label: `${allTime} raid${allTime > 1 ? "s" : ""} au total`,
      detail: "Depuis ton arrivée dans la famille",
      tone: "muted",
    });
  }

  const monthBadge =
    totalMonth === 0
      ? `${monthShort} · à écrire`
      : `${totalMonth} raid${totalMonth > 1 ? "s" : ""} en ${monthShort}`;

  return {
    firstName,
    welcomeKicker: "Tes raids",
    welcomeTitle,
    welcomeMessage: paragraphs.join(" "),
    welcomeInsights: insights.slice(0, 4),
    monthBadge,
  };
}
