import type { WelcomeInsight } from "@/components/member/dashboard/memberDashboardModel";
import type { MemberOverview } from "@/components/member/hooks/useMemberOverview";
import {
  RAID_DECLARE_GENTLE_RULES,
  RAID_DECLARE_STEPS,
  RAID_DECLARE_WHY,
} from "@/components/member/raids/declare/raidDeclareContent";
import type { DeclaredRaidRow } from "@/components/member/raids/declare/raidDeclareUtils";

export type RaidDeclareHeroModel = {
  firstName: string;
  welcomeKicker: string;
  welcomeTitle: string;
  welcomeMessage: string;
  welcomeInsights: WelcomeInsight[];
  statusBadge: string;
};

export type RaidDeclareGuidanceModel = {
  introLead: string;
  encouragement: string;
  steps: typeof RAID_DECLARE_STEPS;
  rules: readonly string[];
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

export function buildRaidDeclareHeroModel(input: {
  overview?: MemberOverview | null;
  declarations: DeclaredRaidRow[];
  cibleFromUrl: string;
  backendEnabled: boolean;
}): RaidDeclareHeroModel {
  const displayName = input.overview?.member.displayName || input.overview?.member.twitchLogin || "";
  const twitchLogin = input.overview?.member.twitchLogin || "";
  const firstName = getFirstName(displayName, twitchLogin);
  const greeting = getTimeGreeting();

  const pending = input.declarations.filter((row) => row.status === "processing" || row.status === "to_study").length;
  const validated = input.declarations.filter((row) => row.status === "validated").length;
  const rejected = input.declarations.filter((row) => row.status === "rejected").length;

  let welcomeTitle: string;
  const paragraphs: string[] = [];

  if (!input.backendEnabled) {
    welcomeTitle = `${greeting} ${firstName}, le secours est en pause technique`;
    paragraphs.push(
      "Le module de déclaration n'est pas actif sur cette instance pour le moment. Tes raids Twitch continuent d'être détectés automatiquement quand le système tourne.",
      "Reviens un peu plus tard ou passe par le Discord TENF si un raid urgent doit être signalé à l'équipe.",
    );
  } else if (input.cibleFromUrl) {
    welcomeTitle = `${greeting} ${firstName}, tu veux rendre la pareille ?`;
    paragraphs.push(
      `Tu arrives avec une cible déjà suggérée (@${input.cibleFromUrl}) — vérifie quand même dans Mes raids que ce passage n'y figure pas déjà.`,
      "Si tout est bon, complète la date du live et envoie : la modération croisera avec les données TENF, sans te juger.",
    );
  } else if (input.declarations.length === 0) {
    welcomeTitle = `${greeting} ${firstName}, ce formulaire est le filet de secours`;
    paragraphs.push(
      "La plupart du temps, tu n'en auras pas besoin : Twitch remonte tes raids tout seul dans ton historique membre.",
      "Si un soutien vers un·e membre TENF manque encore après quelques heures, décris-le ici calmement — date, cible, contexte.",
    );
  } else if (pending > 0) {
    welcomeTitle = `${greeting} ${firstName}, ${pending} dossier${pending > 1 ? "s" : ""} en cours`;
    paragraphs.push(
      "La modération traite les déclarations avec soin — pas besoin de renvoyer la même chose, ça ralentirait tout le monde.",
      "Tu peux suivre l'avancement dans la liste plus bas. Merci de ta patience, c'est aussi de l'entraide envers le staff.",
    );
  } else if (rejected > 0 && validated === 0) {
    welcomeTitle = `${greeting} ${firstName}, on t'aide à viser juste`;
    paragraphs.push(
      "Certaines déclarations n'ont pas été retenues — souvent cible hors TENF, doublon ou délai trop court après le live.",
      "Relis les repères à droite avant un nouvel envoi : une cible membre, un moment cohérent, une note honnête.",
    );
  } else {
    welcomeTitle = `${greeting} ${firstName}, merci de garder la trace à jour`;
    paragraphs.push(
      `${validated} déclaration${validated > 1 ? "s validées" : " validée"} — tu aides l'équipe à refléter ton entraide réelle.`,
      "N'utilise ce formulaire que si l'historique auto ne suffit pas : chaque dossier en moins, c'est plus de temps pour accueillir les nouveaux·elles.",
    );
  }

  const insights: WelcomeInsight[] = [
    {
      id: "auto-twitch",
      label: "Détection auto",
      detail: "Prioritaire sur ce formulaire",
      tone: "info",
    },
  ];

  if (pending > 0) {
    insights.push({
      id: "pending",
      label: `${pending} en traitement`,
      detail: "Patience côté modération",
      tone: "warning",
    });
  }
  if (validated > 0) {
    insights.push({
      id: "validated",
      label: `${validated} validé${validated > 1 ? "s" : ""}`,
      detail: "Dossiers acceptés",
      tone: "success",
    });
  }
  if (input.cibleFromUrl) {
    insights.push({
      id: "prefill",
      label: "Cible préremplie",
      detail: `@${input.cibleFromUrl}`,
      tone: "accent",
    });
  }

  return {
    firstName,
    welcomeKicker: "Déclaration secours",
    welcomeTitle,
    welcomeMessage: paragraphs.join("\n\n"),
    welcomeInsights: insights,
    statusBadge: input.backendEnabled ? "Formulaire actif" : "Module indisponible",
  };
}

export function buildRaidDeclareGuidanceModel(input: {
  firstName: string;
  backendEnabled: boolean;
  hasDeclarations: boolean;
}): RaidDeclareGuidanceModel {
  let encouragement: string;
  if (!input.backendEnabled) {
    encouragement = `${input.firstName}, le secours est temporairement indisponible ici — tes raids comptent quand même via la détection Twitch dès que le service revient.`;
  } else if (!input.hasDeclarations) {
    encouragement =
      "Avant ton premier envoi : ouvre Mes raids, attends un peu, puis reviens seulement si le passage manque vraiment. Tu fais gagner du temps à toute la commu.";
  } else {
    encouragement =
      "Chaque dossier honnête protège la confiance dans l'entraide TENF — merci de rester factuel·le et bienveillant·e envers la modération.";
  }

  return {
    introLead: RAID_DECLARE_WHY.lead,
    encouragement,
    steps: RAID_DECLARE_STEPS,
    rules: RAID_DECLARE_GENTLE_RULES,
  };
}
