import { normalizeAdminRole, type AdminRole } from "@/lib/adminRoles";
import type {
  AdminDashboardAggregate,
  AdminDashboardUser,
  AdminOpsQueueItem,
} from "@/lib/admin/dashboard/adminDashboardTypes";

export type AdminStaffTier =
  | "founder"
  | "coordinator"
  | "moderator_senior"
  | "moderator_accompaniment"
  | "moderator_discovery"
  | "moderator_paused"
  | "support"
  | "contributor"
  | "general";

export type AdminDashboardAction = {
  id: string;
  label: string;
  href: string;
  detail: string;
  tone: "primary" | "support" | "soft";
};

export type AdminPulseIndicator = {
  id: string;
  label: string;
  value: string;
  hint: string;
  href: string;
  tone: string;
};

export type AdminWelcomeInsight = {
  id: string;
  label: string;
  detail?: string;
  tone: "accent" | "success" | "warning" | "info" | "muted";
};

export type AdminRoleGuideBlock = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  cta?: { label: string; href: string };
};

export type AdminQuickLink = {
  href: string;
  label: string;
  sub: string;
  tone: string;
};

export type AdminDashboardModel = {
  accent: string;
  tier: AdminStaffTier;
  tierLabel: string;
  firstName: string;
  displayName: string;
  roleLabel: string;
  dateLabel: string;
  monthLabel: string;
  welcomeKicker: string;
  welcomeTitle: string;
  welcomeMessage: string;
  welcomeInsights: AdminWelcomeInsight[];
  encouragement: string;
  showDiscoveryGuide: boolean;
  roleGuide: AdminRoleGuideBlock;
  roleGuideKicker: string;
  pulseIndicators: AdminPulseIndicator[];
  pulseSummary: string;
  pulseTitle: string;
  primaryAction: AdminDashboardAction;
  nextActionKicker: string;
  nextActionTitle: string;
  secondaryActions: AdminDashboardAction[];
  secondaryEmptyTitle: string;
  secondaryEmptyMessage: string;
  opsQueue: AdminOpsQueueItem[];
  opsIntro: string;
  opsKicker: string;
  opsTitle: string;
  opsEmptyMessage: string;
  quickLinks: AdminQuickLink[];
  quickLinksKicker: string;
  quickLinksTitle: string;
  quickLinksIntro: string;
  alerts: Array<{ id: string; message: string; href?: string }>;
  alertsIntro: string;
  showOpsQueue: boolean;
  showMemberPreview: boolean;
  showRoleGuide: boolean;
  meetingLabel: string;
  meetingDateLabel: string;
  meetingRegistrations: string;
  meetingRegistrationsHint: string;
  heroMeetingKicker: string;
  heroExtendedLabel: string;
  heroExtendedHref: string;
  heroExtendedHint: string;
  agendaKicker: string;
  agendaTitle: string;
  agendaIntro: string;
  activityKicker: string;
  activityTitle: string;
  activityEmptyMessage: string;
  memberPreviewTitle: string;
  memberPreviewMessage: string;
  nextEventLabel: string;
  nextEventRegistrations: number;
  upcomingSpotlights: number;
};

function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatLongFrenchDate(value: Date): string {
  return value.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMonthLabel(date = new Date()): string {
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function formatMeetingDateTime(value?: string): string {
  if (!value) return "Date à confirmer";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date à confirmer";
  return date.toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function firstNameFromDisplay(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return "toi";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function getTimeGreeting(): "Bonjour" | "Bon après-midi" | "Bonsoir" {
  const hour = new Date().getHours();
  if (hour >= 18) return "Bonsoir";
  if (hour >= 12) return "Bon après-midi";
  return "Bonjour";
}

function isAutonomyModerator(rawRole: string | null): boolean {
  return parseRoleFromLabel(rawRole) === "MODERATEUR_AUTONOMIE";
}

function formatFollowOverdueHint(names: string[], firstName: string): string | null {
  if (names.length === 0) return null;
  if (names.length === 1) return `${names[0]} n’a pas encore validé son suivi — ${firstName}, un petit rappel peut débloquer la situation.`;
  if (names.length <= 3) return `${names.join(", ")} ont des suivis en retard — à relancer en douceur si tu es coordinateur·rice.`;
  return `${names.length} suivis staff en retard ce mois — la coordination peut relancer l’équipe modération.`;
}

function meetingRegistrationsCopy(count: number, tier: AdminStaffTier, firstName: string): { value: string; hint: string } {
  if (count === 0) {
    return {
      value: "—",
      hint:
        tier === "moderator_discovery" || tier === "moderator_paused"
          ? "Pas d’inscription pour l’instant — normal si tu observes seulement."
          : `${firstName}, la prochaine réunion staff se remplira au fil des jours.`,
    };
  }
  if (count === 1) {
    return { value: "1", hint: "personne inscrite pour l’instant" };
  }
  return { value: String(count), hint: "personnes déjà inscrites" };
}

function parseRoleFromLabel(label: string | null): AdminRole | null {
  if (!label) return null;
  const direct = normalizeAdminRole(label);
  if (direct) return direct;

  const u = label
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (u.includes("FONDATEUR") || u.includes("FOUNDER")) return "FONDATEUR";
  if (u.includes("COORDINATEUR") || u.includes("ADMIN ADJOINT")) return "ADMIN_COORDINATEUR";
  if (u.includes("AUTONOMIE")) return "MODERATEUR_AUTONOMIE";
  if (u.includes("ACCOMPAGNEMENT") || u.includes("FORMATION") || u.includes("JUNIOR")) {
    return "MODERATEUR_ACCOMPAGNEMENT";
  }
  if (u.includes("DECOUVERTE")) return "MODERATEUR_DECOUVERTE";
  if (u.includes("PAUSE")) return "MODERATEUR_EN_PAUSE";
  if (u.includes("SOUTIEN")) return "SOUTIEN_TENF";
  if (u.includes("CONTRIBUTEUR")) return "CONTRIBUTEUR_INVITE";
  if (u.includes("MODERATEUR") || u.includes("MODO")) return "MODERATEUR";
  if (u.includes("ADMIN")) return "ADMIN_COORDINATEUR";
  return null;
}

export function resolveAdminStaffTier(rawRole: string | null): AdminStaffTier {
  const role = parseRoleFromLabel(rawRole);
  switch (role) {
    case "FONDATEUR":
      return "founder";
    case "ADMIN_COORDINATEUR":
      return "coordinator";
    case "MODERATEUR":
    case "MODERATEUR_AUTONOMIE":
      return "moderator_senior";
    case "MODERATEUR_ACCOMPAGNEMENT":
      return "moderator_accompaniment";
    case "MODERATEUR_DECOUVERTE":
      return "moderator_discovery";
    case "MODERATEUR_EN_PAUSE":
      return "moderator_paused";
    case "SOUTIEN_TENF":
      return "support";
    case "CONTRIBUTEUR_INVITE":
      return "contributor";
    default:
      return "general";
  }
}

function tierLabel(tier: AdminStaffTier): string {
  switch (tier) {
    case "founder":
      return "Fondateur·rice TENF";
    case "coordinator":
      return "Admin coordinateur·rice";
    case "moderator_senior":
      return "Modérateur·rice confirmé(e)";
    case "moderator_accompaniment":
      return "Modérateur·rice en accompagnement";
    case "moderator_discovery":
      return "Modérateur·rice en découverte";
    case "moderator_paused":
      return "Modérateur·rice en pause";
    case "support":
      return "Soutien TENF";
    case "contributor":
      return "Contributeur·rice invité(e)";
    default:
      return "Staff TENF";
  }
}

export function accentForTier(tier: AdminStaffTier): string {
  switch (tier) {
    case "founder":
      return "#c4b5fd";
    case "coordinator":
      return "#818cf8";
    case "moderator_senior":
      return "#7c3aed";
    case "moderator_accompaniment":
      return "#6366f1";
    case "moderator_discovery":
      return "#a78bfa";
    case "moderator_paused":
      return "#94a3b8";
    case "support":
      return "#34d399";
    default:
      return "#8b5cf6";
  }
}

function buildRoleGuide(tier: AdminStaffTier, firstName: string, rawRole: string | null): AdminRoleGuideBlock {
  switch (tier) {
    case "moderator_discovery":
      return {
        title: `${firstName}, ton espace est pensé pour apprendre sans pression`,
        paragraphs: [
          "En phase découverte, tu n’es pas seul·e : tu observes, tu poses des questions, et tu ne tranches jamais une situation sensible sans validation.",
          "Ce tableau de bord te montre surtout ce qui t’aide à comprendre le rythme TENF — pas tout ce qu’un modérateur confirmé doit piloter.",
        ],
        bullets: [
          "Lis la charte modération article par article — c’est ta base de confiance.",
          "Repère les files « raids » et « points Discord » : observe d’abord, interviens seulement quand ton référent te l’a dit.",
          "En cas de doute, tu remontes au staff : ce n’est pas un échec, c’est le bon réflexe.",
          "Prends le temps de voir l’espace membre : tu comprendras mieux ce que vivent les créateurs.",
        ],
        cta: {
          label: "Ouvrir la charte modération",
          href: "/admin/moderation/staff/charte",
        },
      };
    case "moderator_accompaniment":
      return {
        title: `${firstName}, tu progresses avec un filet de sécurité`,
        paragraphs: [
          "L’accompagnement, ce n’est pas une punition : c’est la phase où l’équipe te coache pour gagner en assurance.",
          "Tu peux traiter plus de files qu’en découverte, mais les cas lourds se valident toujours avec un référent.",
        ],
        bullets: [
          "Priorise les raids et validations profil quand ton référent te l’a confirmé.",
          "Note tes questions après chaque session — elles enrichissent ta montée en compétence.",
          "Garde un œil sur les présences événements : c’est un bon entraînement modération + communauté.",
        ],
        cta: {
          label: "Mon questionnaire staff",
          href: "/admin/moderation/my-questionnaire",
        },
      };
    case "moderator_senior":
      if (isAutonomyModerator(rawRole)) {
        return {
          title: `${firstName}, tu es en autonomie — fais confiance à ton jugement`,
          paragraphs: [
            "Le statut autonomie reconnaît ta régularité : tu traites les files sans filet, tout en gardant la charte comme boussole.",
            "Ce cockpit te montre où l’équipe a besoin de toi — pas pour tout porter seul·e, mais pour débloquer ce qui traîne.",
          ],
          bullets: [
            "Commence par les P1 si tu n’as qu’une demi-heure devant toi.",
            "Signale les cas ambigus dans le canal staff plutôt que de trancher seul·e.",
            "Un modérateur en découverte peut t’observer : montre-lui le réflexe « lire, comprendre, agir ».",
          ],
          cta: {
            label: "Files raids à valider",
            href: "/admin/engagement/raids-a-valider",
          },
        };
      }
      return {
        title: `${firstName}, tu peux enchaîner avec autonomie`,
        paragraphs: [
          "Tu maîtrises les files modération et tu fais avancer la communauté au quotidien.",
          "Ce cockpit te propose les priorités du moment — à toi de choisir où mettre ton énergie, sans culpabiliser si une file attend demain.",
        ],
        bullets: [
          "Commence par les P1 (raids, profils) si la file monte.",
          "Aide les modérateurs en découverte en partageant tes retours — sans les précipiter.",
          "Pense à ton espace membre aussi : tu fais partie de la famille, pas seulement des coulisses.",
        ],
        cta: {
          label: "Files raids à valider",
          href: "/admin/engagement/raids-a-valider",
        },
      };
    case "moderator_paused":
      return {
        title: `${firstName}, repose-toi — l’équipe tient le fort`,
        paragraphs: [
          "En pause, tu n’as pas à traiter de files modération. Ce tableau reste disponible pour te tenir informé·e, sans obligation.",
        ],
        bullets: [
          "Préviens un coordinateur si ta pause change de durée.",
          "Tu peux consulter l’espace membre pour rester connecté·e à la communauté.",
        ],
      };
    case "founder":
      return {
        title: `${firstName}, vue d’ensemble sans micro-gestion`,
        paragraphs: [
          "Tu as accès à tout le pilotage TENF. Ce tableau te donne les signaux faibles et les files qui impactent la communauté — pas besoin de tout ouvrir chaque matin.",
          `${firstName}, délègue les files P2/P3 aux coordinateurs et modérateurs autonomes : ton énergie vaut mieux sur la vision et les cas sensibles.`,
        ],
        bullets: [
          "Surveille les alertes critiques et les postulations signalées.",
          "Garde un œil sur les anomalies données et le recrutement staff.",
          "Pense aussi à ton espace membre : tu fais partie de la famille.",
        ],
        cta: {
          label: "Pilotage complet",
          href: "/admin/pilotage",
        },
      };
    case "coordinator":
      return {
        title: `${firstName}, tu fluidifies l’organisation`,
        paragraphs: [
          "Tu vois les signaux opérationnels et tu évites que la charge retombe uniquement sur les fondateur·rices.",
          "Ce dashboard regroupe files, données membres et agenda — pour décider vite et bien, sans noyer l’équipe modération.",
        ],
        bullets: [
          "Surveille les alertes critiques et les postulations sensibles.",
          "Répartis les files quand plusieurs modérateurs sont disponibles.",
          "Relance en douceur les suivis staff en retard si besoin.",
        ],
        cta: {
          label: "Control center",
          href: "/admin/control-center",
        },
      };
    case "support":
      return {
        title: `${firstName}, tu fais avancer le quotidien des membres`,
        paragraphs: [
          "Ton rôle : aider, orienter, signaler — pas sanctionner seul·e. Les créateurs te voient souvent avant de voir un modérateur.",
          "Les fiches membres, validations profil et sync Discord sont tes terrains naturels — chaque correction rend l’accueil plus chaleureux.",
        ],
        bullets: [
          "Priorise les profils en attente : derrière chaque demande, quelqu’un attend d’être reconnu.",
          "Les fiches incomplètes freinent l’expérience — même un champ Discord manquant peut bloquer un suivi.",
          "Quand tu doutes d’une modération, tu remontes — c’est le bon réflexe.",
        ],
        cta: {
          label: "Gestion membres",
          href: "/admin/membres/gestion",
        },
      };
    case "contributor":
      return {
        title: `${firstName}, merci pour ta contribution ponctuelle`,
        paragraphs: [
          "Tu interviens sur des sujets ciblés sans porter toute la charge staff — ce tableau te montre l’essentiel sans t’engluer dans l’opérationnel.",
          "Si tu vois une anomalie sur les fiches membres, signale-la à un coordinateur plutôt que de corriger seul·e sans contexte.",
        ],
        bullets: [
          "Consulte les fiches incomplètes si tu aides à la data.",
          "L’espace membre reste ta meilleure boussole pour comprendre ce que vivent les créateurs.",
        ],
        cta: {
          label: "Voir l’espace membre",
          href: "/member/dashboard",
        },
      };
    default:
      return {
        title: `${firstName}, bienvenue sur le cockpit staff`,
        paragraphs: [
          "Les cartes ci-dessous s’adaptent à ton rôle. Commence par l’action principale proposée à gauche.",
        ],
      };
  }
}

function buildWelcomeCopy(
  tier: AdminStaffTier,
  firstName: string,
  rawRole: string | null,
  data: AdminDashboardAggregate,
): Pick<
  AdminDashboardModel,
  "welcomeKicker" | "welcomeTitle" | "welcomeMessage" | "welcomeInsights" | "encouragement"
> {
  const { ops, summary, upcoming } = data;
  const greeting = getTimeGreeting();
  const pendingTotal =
    ops.raidsPendingCount +
    ops.profileValidationPendingCount +
    ops.discordPointsPendingCount;
  const followHint = formatFollowOverdueHint(ops.followOverdueStaffNames, firstName);
  const monthShort = formatMonthLabel().split(" ")[0] ?? "ce mois";

  switch (tier) {
    case "moderator_discovery":
      return {
        welcomeKicker: `${firstName} · parcours modération · découverte`,
        welcomeTitle: `${greeting} ${firstName} — prends le temps de comprendre, c’est exactement ce qu’on attend`,
        welcomeMessage: [
          `Ici, ${firstName}, tu vois ce qui bouge sur TENF sans obligation de tout traiter.`,
          pendingTotal > 0
            ? `${pendingTotal} élément(s) en file modération : observe-les avec ton référent avant d’agir — c’est un entraînement, pas un test.`
            : "Les files sont calmes — profite-en pour lire la charte et explorer l’espace membre comme le ferait un créateur.",
          upcoming.nextMeetingDateIso
            ? `Prochaine réunion staff le ${formatMeetingDateTime(upcoming.nextMeetingDateIso)} — tu peux t’y inscrire pour poser tes questions en direct.`
            : null,
        ]
          .filter(Boolean)
          .join(" "),
        welcomeInsights: [
          { id: "observe", label: "Mode observation", detail: "Pas de sanction solo", tone: "info" },
          { id: "charte", label: "Charte en cours", detail: "Valide article par article", tone: "accent" },
          { id: "referent", label: "Référent staff", detail: "Ton filet de sécurité", tone: "success" },
        ],
        encouragement: `${firstName}, tu es au bon endroit pour apprendre. La confiance se construit étape par étape — l’équipe est là pour t’accompagner, pas pour te juger.`,
      };
    case "moderator_accompaniment":
      return {
        welcomeKicker: `${firstName} · modération · accompagnement`,
        welcomeTitle: `${greeting} ${firstName} — tu avances, et on reste à tes côtés`,
        welcomeMessage: [
          `Tu peux commencer à traiter certaines files, ${firstName}, toujours avec un référent pour les cas sensibles.`,
          ops.raidsPendingCount > 0
            ? `${ops.raidsPendingCount} raid(s) attendent une validation — bon exercice si ton référent te l’a confirmé.`
            : "Les files raids sont calmes : c’est le moment idéal pour consolider tes bases et relire la charte.",
          ops.discordPointsPendingCount > 0
            ? `${ops.discordPointsPendingCount} point(s) Discord en attente — observe comment l’équipe les traite avant d’intervenir.`
            : null,
        ]
          .filter(Boolean)
          .join(" "),
        welcomeInsights: [
          { id: "progress", label: "Progression", detail: "Plus d’autonomie qu’en découverte", tone: "accent" },
          {
            id: "raids",
            label: "Raids en attente",
            detail: String(ops.raidsPendingCount),
            tone: ops.raidsPendingCount > 0 ? "warning" : "success",
          },
          {
            id: "questionnaire",
            label: "Questionnaire staff",
            detail: "À compléter si besoin",
            tone: "info",
          },
        ],
        encouragement:
          "Chaque file traitée proprement te rapproche de l’autonomie. N’hésite pas à demander un retour après une session — c’est comme ça qu’on monte en compétence.",
      };
    case "moderator_senior": {
      const autonomy = isAutonomyModerator(rawRole);
      return {
        welcomeKicker: autonomy
          ? `${firstName} · modération · autonomie confirmée`
          : `${firstName} · modération · confirmé(e)`,
        welcomeTitle: autonomy
          ? `${greeting} ${firstName} — l’équipe compte sur ton jugement`
          : `${greeting} ${firstName} — la communauté compte sur ton rythme`,
        welcomeMessage: [
          pendingTotal > 0
            ? `${pendingTotal} tâche(s) modération te concernent directement en ${monthShort}.`
            : `Belle respiration sur les files, ${firstName} — tu peux aider un modérateur en découverte ou vérifier les présences événements.`,
          upcoming.pendingEventValidations > 0
            ? `${upcoming.pendingEventValidations} événement(s) passé(s) attendent une clôture de présences.`
            : null,
          followHint,
        ]
          .filter(Boolean)
          .join(" "),
        welcomeInsights: [
          {
            id: "p1",
            label: "Priorité P1",
            detail: String(ops.raidsPendingCount + ops.profileValidationPendingCount),
            tone: pendingTotal > 0 ? "warning" : "success",
          },
          { id: "members", label: "Membres actifs", detail: String(summary.total), tone: "info" },
          ...(ops.raidsIgnoredToProcessCount > 0
            ? [
                {
                  id: "ignored",
                  label: "Raids ignorés",
                  detail: String(ops.raidsIgnoredToProcessCount),
                  tone: "warning" as const,
                },
              ]
            : []),
        ],
        encouragement: autonomy
          ? "Tu fais partie des piliers du Discord live. Un raid validé à temps, c’est un créateur rassuré — merci pour ta fiabilité."
          : "Tu fais partie des piliers du Discord live. Un raid validé à temps, c’est un créateur rassuré.",
      };
    }
    case "moderator_paused":
      return {
        welcomeKicker: `${firstName} · pause modération`,
        welcomeTitle: `${greeting} ${firstName} — prends soin de toi`,
        welcomeMessage: `Aucune action n’est attendue de toi sur les files, ${firstName}. Ce tableau reste informatif — reviens quand tu te sentiras prêt·e, l’équipe t’accueillera sans jugement. Tu peux quand même suivre les lives ou l’espace membre si ça te fait du bien.`,
        welcomeInsights: [{ id: "pause", label: "Activité réduite", detail: "Sans obligation", tone: "muted" }],
        encouragement: `${firstName}, ta santé passe avant tout. TENF te remercie pour le temps déjà donné à la communauté.`,
      };
    case "coordinator":
      return {
        welcomeKicker: `${firstName} · coordination staff`,
        welcomeTitle: `${greeting} ${firstName} — orchestrons la semaine ensemble`,
        welcomeMessage: [
          summary.incomplete > 0
            ? `${summary.incomplete} fiche(s) membre incomplète(s) freinent l’expérience côté créateurs.`
            : `Les fiches membres sont globalement propres — belle base pour ${monthShort}.`,
          ops.staffApplicationsPendingCount > 0
            ? `${ops.staffApplicationsPendingCount} candidature(s) staff attendent un suivi.`
            : "Recrutement staff sous contrôle pour l’instant.",
          ops.finalNotesCount > 0
            ? `${ops.finalNotesCount} note(s) finale(s) d’évaluation déjà saisies ce cycle.`
            : null,
          followHint,
        ]
          .filter(Boolean)
          .join(" "),
        welcomeInsights: [
          {
            id: "incomplete",
            label: "Fiches à corriger",
            detail: String(summary.incomplete),
            tone: summary.incomplete > 0 ? "warning" : "success",
          },
          {
            id: "staff",
            label: "Recrutement",
            detail: String(ops.staffApplicationsPendingCount),
            tone: ops.staffApplicationsPendingCount > 0 ? "warning" : "info",
          },
          {
            id: "vip",
            label: "VIP du mois",
            detail: String(ops.vipMonthCount),
            tone: "accent",
          },
        ],
        encouragement: `${firstName}, ton regard transversal évite que la charge se concentre sur les fondateur·rices. Merci pour ce rôle de lien.`,
      };
    case "founder":
      return {
        welcomeKicker: `${firstName} · pilotage TENF`,
        welcomeTitle: `${greeting} ${firstName} — l’essentiel en un coup d’œil`,
        welcomeMessage: [
          `Communauté : ${summary.total} membres actifs, complétude moyenne ${summary.avgCompletion}%.`,
          ops.staffApplicationsRedFlagCount > 0
            ? `${ops.staffApplicationsRedFlagCount} candidature(s) signalée(s) sensible(s) — à traiter en priorité.`
            : "Recrutement staff sous contrôle.",
          summary.reviewOverdue > 0
            ? `${summary.reviewOverdue} revue(s) membre en retard — impact direct sur les évaluations.`
            : null,
          followHint,
        ]
          .filter(Boolean)
          .join(" "),
        welcomeInsights: [
          { id: "health", label: "Santé données", detail: `${summary.avgCompletion}%`, tone: "accent" },
          {
            id: "alerts",
            label: "Revues en retard",
            detail: String(summary.reviewOverdue),
            tone: summary.reviewOverdue > 0 ? "warning" : "success",
          },
          {
            id: "community",
            label: "Activité mois",
            detail: String(summary.communityMonthCount),
            tone: "info",
          },
        ],
        encouragement: `${firstName}, tu as bâti cet écosystème — ce cockpit te libère du bruit pour te concentrer sur l’essentiel, pas sur la micro-gestion.`,
      };
    case "support":
      return {
        welcomeKicker: `${firstName} · soutien membres`,
        welcomeTitle: `${greeting} ${firstName} — tu facilites le quotidien des créateurs`,
        welcomeMessage: [
          ops.profileValidationPendingCount > 0
            ? `${ops.profileValidationPendingCount} profil(s) attendent une validation — impact direct sur leur accueil.`
            : "Les validations profil sont à jour — merci pour le suivi.",
          `Les fiches incomplètes (${summary.incomplete}) restent ton radar principal en ${monthShort}.`,
          summary.missingDiscord > 0
            ? `${summary.missingDiscord} membre(s) sans ID Discord — à corriger pour le suivi communautaire.`
            : null,
        ]
          .filter(Boolean)
          .join(" "),
        welcomeInsights: [
          {
            id: "validation",
            label: "Profils",
            detail: String(ops.profileValidationPendingCount),
            tone: ops.profileValidationPendingCount > 0 ? "warning" : "success",
          },
          {
            id: "incomplete",
            label: "Incomplets",
            detail: String(summary.incomplete),
            tone: summary.incomplete > 0 ? "warning" : "success",
          },
        ],
        encouragement: `${firstName}, chaque fiche corrigée, c’est un membre qui se sent reconnu. Merci pour ta bienveillance.`,
      };
    case "contributor":
      return {
        welcomeKicker: `${firstName} · contributeur·rice invité(e)`,
        welcomeTitle: `${greeting} ${firstName} — merci pour ton aide ciblée`,
        welcomeMessage: `Tu interviens ponctuellement sur TENF, ${firstName}. Ce tableau te montre les signaux utiles sans t’engager sur toute la charge staff — si tu vois une anomalie, remonte-la à un coordinateur.`,
        welcomeInsights: [
          {
            id: "incomplete",
            label: "Fiches incomplètes",
            detail: String(summary.incomplete),
            tone: "info",
          },
        ],
        encouragement: "Chaque contribution compte, même courte. Merci de prêter main-forte à la New Family.",
      };
    default:
      return {
        welcomeKicker: `${firstName} · espace staff TENF`,
        welcomeTitle: `${greeting} ${firstName}`,
        welcomeMessage: `Ce tableau regroupe les signaux utiles à ton rôle, ${firstName}. Commence par l’action principale proposée ci-dessous — les raccourcis à droite s’adaptent à ton périmètre.`,
        welcomeInsights: [],
        encouragement: "Merci de contribuer à la vie de TENF.",
      };
  }
}

function personalizeOpsHelper(
  tier: AdminStaffTier,
  itemId: string,
  firstName: string,
  count: number,
  base: string,
): string {
  if (count === 0) return base;
  switch (itemId) {
    case "raids":
      if (tier === "moderator_discovery") return `${count} raid(s) à observer avec ton référent — ${firstName}, note les patterns sans trancher seul·e.`;
      if (tier === "moderator_accompaniment") return `${count} raid(s) — bon terrain d’entraînement si ton référent valide ta lecture.`;
      return `${count} créateur(s) attendent souvent une réponse rapide — ${base.toLowerCase()}`;
    case "profiles":
      return tier === "support"
        ? `${count} membre(s) derrière ces demandes — ${firstName}, tu es souvent leur premier contact staff.`
        : base;
    case "staff":
      return tier === "founder" || tier === "coordinator"
        ? `${count} candidature(s) — ${firstName}, une réponse même courte change l’expérience du candidat.`
        : base;
    default:
      return base;
  }
}

function buildOpsQueue(tier: AdminStaffTier, data: AdminDashboardAggregate, firstName: string): AdminOpsQueueItem[] {
  const { ops, upcoming, summary } = data;
  const all: AdminOpsQueueItem[] = [
    {
      id: "raids",
      title: "Raids à valider",
      href: "/admin/engagement/raids-a-valider",
      count: ops.raidsPendingCount,
      priority: "P1",
      slaHours: 12,
      helper: "Impact direct sur la reconnaissance des créateurs",
    },
    {
      id: "profiles",
      title: "Validations profil",
      href: "/admin/membres/validation-profil",
      count: ops.profileValidationPendingCount,
      priority: "P1",
      slaHours: 24,
      helper: "Un membre attend souvent derrière chaque demande",
    },
    {
      id: "points",
      title: "Points Discord",
      href: "/admin/engagement/points-discord",
      count: ops.discordPointsPendingCount,
      priority: "P2",
      slaHours: 48,
      helper: "Récompenses raids-sub à valider",
    },
    {
      id: "presence",
      title: "Présences événements",
      href: "/admin/events/presence",
      count: upcoming.pendingEventValidations,
      priority: "P2",
      slaHours: 72,
      helper: "Formations et événements sans présence validée",
    },
    {
      id: "incomplete",
      title: "Fiches incomplètes",
      href: "/admin/membres/incomplets",
      count: summary.incomplete,
      priority: "P2",
      slaHours: 96,
      helper: "Données manquantes côté espace membre",
    },
    {
      id: "staff",
      title: "Postulations staff",
      href: "/admin/membres/postulations",
      count: ops.staffApplicationsPendingCount,
      priority: "P1",
      slaHours: 48,
      helper: "Candidatures en attente de réponse",
    },
  ];

  const allowedByTier: Record<AdminStaffTier, string[]> = {
    founder: all.map((i) => i.id),
    coordinator: all.map((i) => i.id),
    moderator_senior: ["raids", "points", "presence", "profiles"],
    moderator_accompaniment: ["raids", "points", "presence"],
    moderator_discovery: ["raids", "points"],
    moderator_paused: [],
    support: ["profiles", "incomplete"],
    contributor: ["incomplete"],
    general: ["raids", "profiles", "incomplete"],
  };

  const allowed = new Set(allowedByTier[tier]);
  return all
    .filter((item) => allowed.has(item.id))
    .filter((item) => item.count > 0 || tier === "founder" || tier === "coordinator")
    .map((item) => ({
      ...item,
      helper: personalizeOpsHelper(tier, item.id, firstName, item.count, item.helper),
    }))
    .sort((a, b) => {
      const p = { P1: 1, P2: 2, P3: 3 } as const;
      if (p[a.priority] !== p[b.priority]) return p[a.priority] - p[b.priority];
      return b.count - a.count;
    });
}

function buildPrimaryAction(
  tier: AdminStaffTier,
  firstName: string,
  data: AdminDashboardAggregate,
): AdminDashboardAction {
  const { ops } = data;

  if (tier === "moderator_discovery") {
    return {
      id: "charte",
      label: "Continuer la charte modération",
      href: "/admin/moderation/staff/charte",
      detail: `${firstName}, c’est ta première étape concrète : lis, coche « J’ai lu », pose tes questions au staff.`,
      tone: "primary",
    };
  }

  if (tier === "moderator_paused") {
    return {
      id: "member",
      label: "Voir l’espace membre",
      href: "/member/dashboard",
      detail: `${firstName}, reste connecté·e à la communauté sans obligation modération.`,
      tone: "soft",
    };
  }

  if (tier === "moderator_accompaniment" && ops.raidsPendingCount > 0) {
    return {
      id: "raids",
      label: "Observer les raids en attente",
      href: "/admin/engagement/raids-a-valider",
      detail: `${ops.raidsPendingCount} raid(s) à étudier — fais-le avec ton référent si tu n’es pas sûr·e.`,
      tone: "primary",
    };
  }

  if (ops.raidsPendingCount > 0 && ["moderator_senior", "coordinator", "founder", "general"].includes(tier)) {
    return {
      id: "raids",
      label: "Traiter les raids en attente",
      href: "/admin/engagement/raids-a-valider",
      detail: `${ops.raidsPendingCount} raid(s) — les créateurs attendent souvent une validation rapide.`,
      tone: "primary",
    };
  }

  if (ops.profileValidationPendingCount > 0 && ["support", "coordinator", "founder"].includes(tier)) {
    return {
      id: "profiles",
      label: "Valider les profils en attente",
      href: "/admin/membres/validation-profil",
      detail: `${ops.profileValidationPendingCount} demande(s) — accueil direct pour les nouveaux membres.`,
      tone: "primary",
    };
  }

  if (data.summary.incomplete > 0 && ["support", "coordinator", "founder"].includes(tier)) {
    return {
      id: "incomplete",
      label: "Corriger les fiches incomplètes",
      href: "/admin/membres/incomplets",
      detail: `${data.summary.incomplete} fiche(s) — meilleure expérience côté espace membre.`,
      tone: "primary",
    };
  }

  return {
    id: "pilotage",
    label: tier === "founder" ? "Ouvrir le pilotage" : "Explorer le control center",
    href: tier === "founder" ? "/admin/pilotage" : "/admin/control-center",
    detail: "Les files sont calmes — bon moment pour prendre du recul sur la semaine.",
    tone: "soft",
  };
}

function buildSecondaryActions(tier: AdminStaffTier, data: AdminDashboardAggregate): AdminDashboardAction[] {
  const actions: AdminDashboardAction[] = [];

  if (tier !== "moderator_paused") {
    actions.push({
      id: "member-view",
      label: "Voir comme un membre",
      href: "/member/dashboard",
      detail: "Comprendre ce que vivent les créateurs après une action staff.",
      tone: "support",
    });
  }

  if (["moderator_discovery", "moderator_accompaniment"].includes(tier)) {
    actions.push({
      id: "guide",
      label: "Guide espace membre",
      href: "/rejoindre/guide-espace-membre/tableau-de-bord",
      detail: "Le parcours expliqué aux nouveaux — utile pour modérer avec empathie.",
      tone: "soft",
    });
  }

  if (data.ops.discordPointsPendingCount > 0 && tier !== "moderator_discovery" && tier !== "moderator_paused") {
    actions.push({
      id: "points",
      label: "Points Discord",
      href: "/admin/engagement/points-discord",
      detail: `${data.ops.discordPointsPendingCount} en attente`,
      tone: "support",
    });
  }

  return actions.slice(0, 2);
}

function buildPulseIndicators(
  tier: AdminStaffTier,
  firstName: string,
  rawRole: string | null,
  data: AdminDashboardAggregate,
): AdminPulseIndicator[] {
  const { summary, ops, upcoming } = data;
  const base: AdminPulseIndicator[] = [];
  const autonomy = isAutonomyModerator(rawRole);

  if (tier !== "moderator_paused") {
    base.push({
      id: "raids",
      label: "Raids à valider",
      value: String(ops.raidsPendingCount),
      hint:
        tier === "moderator_discovery"
          ? `${firstName}, observe avec un référent`
          : tier === "moderator_accompaniment"
            ? "File modération — avec validation"
            : "File modération live",
      href: "/admin/engagement/raids-a-valider",
      tone: "#f59e0b",
    });
  }

  if (["founder", "coordinator", "support", "moderator_senior"].includes(tier)) {
    base.push({
      id: "profiles",
      label: "Profils en attente",
      value: String(ops.profileValidationPendingCount),
      hint: tier === "support" ? "Ton impact direct sur l’accueil" : "Accueil des nouveaux membres",
      href: "/admin/membres/validation-profil",
      tone: "#38bdf8",
    });
  }

  if (["founder", "coordinator", "support"].includes(tier)) {
    base.push({
      id: "incomplete",
      label: "Fiches incomplètes",
      value: String(summary.incomplete),
      hint: tier === "support" ? `${firstName}, ta zone de confort data` : "Qualité des données membres",
      href: "/admin/membres/incomplets",
      tone: "#a78bfa",
    });
  }

  if (tier === "moderator_discovery" || tier === "moderator_accompaniment") {
    base.push({
      id: "points",
      label: "Points Discord",
      value: String(ops.discordPointsPendingCount),
      hint: "File secondaire — observation",
      href: "/admin/engagement/points-discord",
      tone: "#6366f1",
    });
  }

  if (["founder", "coordinator", "moderator_senior"].includes(tier)) {
    base.push({
      id: "events",
      label: "Présences à valider",
      value: String(upcoming.pendingEventValidations),
      hint: autonomy ? "Clôture rapide = créateurs rassurés" : "Événements passés sans clôture",
      href: "/admin/events/presence",
      tone: "#34d399",
    });
  }

  return base.slice(0, tier === "moderator_discovery" ? 3 : 4);
}

function buildQuickLinks(tier: AdminStaffTier): AdminQuickLink[] {
  const modLinks: AdminQuickLink[] = [
    { href: "/admin/engagement/raids-a-valider", label: "Raids à valider", sub: "File modération", tone: "#f59e0b" },
    { href: "/admin/engagement/points-discord", label: "Points Discord", sub: "Récompenses raids-sub", tone: "#818cf8" },
    { href: "/admin/events/presence", label: "Présences", sub: "Événements & formations", tone: "#34d399" },
    { href: "/admin/moderation/staff/charte", label: "Charte modération", sub: "Cadre & éthique", tone: "#c4b5fd" },
  ];
  const adminLinks: AdminQuickLink[] = [
    { href: "/admin/membres/gestion", label: "Gestion membres", sub: "Fiches & données", tone: "#818cf8" },
    { href: "/admin/membres/postulations", label: "Postulations", sub: "Recrutement staff", tone: "#a78bfa" },
    { href: "/admin/control-center", label: "Control center", sub: "Pilotage global", tone: "#fbbf24" },
    { href: "/admin/pilotage", label: "Pilotage", sub: "Vue étendue", tone: "#6366f1" },
  ];
  const discoveryLinks: AdminQuickLink[] = [
    { href: "/admin/moderation/staff/charte", label: "Charte modération", sub: "Étape prioritaire", tone: "#c4b5fd" },
    { href: "/rejoindre/guide-espace-membre/tableau-de-bord", label: "Guide membre", sub: "Comprendre le parcours", tone: "#34d399" },
    { href: "/member/dashboard", label: "Espace membre", sub: "Voir comme un créateur", tone: "#38bdf8" },
    { href: "/admin/moderation/my-questionnaire", label: "Mon questionnaire", sub: "Intégration staff", tone: "#818cf8" },
  ];

  switch (tier) {
    case "moderator_discovery":
      return discoveryLinks;
    case "moderator_accompaniment":
      return [...discoveryLinks.slice(0, 2), ...modLinks.slice(0, 2)];
    case "moderator_paused":
      return [
        { href: "/member/dashboard", label: "Espace membre", sub: "Sans obligation", tone: "#38bdf8" },
        { href: "/lives", label: "Lives TENF", sub: "Reste connecté·e", tone: "#ef4444" },
      ];
    case "founder":
    case "coordinator":
      return [...adminLinks.slice(0, 2), ...modLinks.slice(0, 2)];
    case "support":
      return [
        { href: "/admin/membres/gestion", label: "Gestion membres", sub: "Quotidien", tone: "#818cf8" },
        { href: "/admin/membres/validation-profil", label: "Validations profil", sub: "Accueil", tone: "#38bdf8" },
        { href: "/admin/membres/incomplets", label: "Fiches incomplètes", sub: "Qualité data", tone: "#a78bfa" },
        { href: "/member/dashboard", label: "Espace membre", sub: "Vue créateur", tone: "#34d399" },
      ];
    default:
      return modLinks;
  }
}

function buildAlerts(tier: AdminStaffTier, firstName: string, data: AdminDashboardAggregate): AdminDashboardModel["alerts"] {
  const { summary, ops } = data;
  const alerts: AdminDashboardModel["alerts"] = [];

  const canSeeReviews = ["founder", "coordinator", "moderator_senior"].includes(tier);
  const canSeeStaffFlags = ["founder", "coordinator"].includes(tier);
  const canSeeDiscordGaps = ["founder", "coordinator", "support"].includes(tier);

  if (canSeeReviews && summary.reviewOverdue > 0) {
    alerts.push({
      id: "reviews",
      message: `${firstName}, ${summary.reviewOverdue} revue(s) membre en retard — impact direct sur les évaluations.`,
      href: "/admin/evaluation/d",
    });
  }
  if (canSeeStaffFlags && ops.staffApplicationsRedFlagCount > 0) {
    alerts.push({
      id: "redflag",
      message: `${ops.staffApplicationsRedFlagCount} candidature(s) staff signalée(s) sensible(s) — à traiter avec prudence.`,
      href: "/admin/membres/postulations",
    });
  }
  if (canSeeDiscordGaps && summary.missingDiscord > 0) {
    alerts.push({
      id: "discord",
      message: `${summary.missingDiscord} membre(s) sans ID Discord — ${tier === "support" ? "ton terrain habituel" : "à corriger pour le suivi"}.`,
      href: "/admin/membres/incomplets",
    });
  }
  if (["founder", "coordinator"].includes(tier) && ops.followOverdueStaffNames.length > 0) {
    alerts.push({
      id: "follow",
      message: formatFollowOverdueHint(ops.followOverdueStaffNames, firstName) || "Suivis staff en retard.",
      href: "/admin/follow",
    });
  }

  return alerts;
}

type AdminCardCopy = Pick<
  AdminDashboardModel,
  | "nextActionKicker"
  | "nextActionTitle"
  | "secondaryEmptyTitle"
  | "secondaryEmptyMessage"
  | "opsKicker"
  | "opsTitle"
  | "opsIntro"
  | "opsEmptyMessage"
  | "pulseSummary"
  | "pulseTitle"
  | "quickLinksKicker"
  | "quickLinksTitle"
  | "quickLinksIntro"
  | "agendaKicker"
  | "agendaTitle"
  | "agendaIntro"
  | "activityKicker"
  | "activityTitle"
  | "activityEmptyMessage"
  | "alertsIntro"
  | "roleGuideKicker"
  | "heroMeetingKicker"
  | "heroExtendedLabel"
  | "heroExtendedHref"
  | "heroExtendedHint"
  | "memberPreviewTitle"
  | "memberPreviewMessage"
>;

function buildCardCopy(
  tier: AdminStaffTier,
  firstName: string,
  rawRole: string | null,
  data: AdminDashboardAggregate,
): AdminCardCopy {
  const autonomy = isAutonomyModerator(rawRole);
  const hasOps = data.ops.raidsPendingCount + data.ops.profileValidationPendingCount > 0;

  const heroExtended =
    tier === "founder"
      ? { label: "Pilotage complet", href: "/admin/pilotage", hint: "Vue étendue & signaux faibles" }
      : tier === "coordinator"
        ? { label: "Control center", href: "/admin/control-center", hint: "Orchestration de la semaine" }
        : tier === "moderator_discovery" || tier === "moderator_accompaniment"
          ? { label: "Charte modération", href: "/admin/moderation/staff/charte", hint: "Ta boussole au quotidien" }
          : tier === "support"
            ? { label: "Gestion membres", href: "/admin/membres/gestion", hint: "Ton terrain principal" }
            : { label: "Control center", href: "/admin/control-center", hint: "Vue transversale" };

  const roleGuideKicker =
    tier === "moderator_discovery"
      ? `Guide ${firstName} · découverte`
      : tier === "moderator_accompaniment"
        ? `Accompagnement · ${firstName}`
        : tier === "moderator_paused"
          ? "Pause · sans obligation"
          : tier === "founder"
            ? `Vision · ${firstName}`
            : tier === "coordinator"
              ? `Coordination · ${firstName}`
              : tier === "support"
                ? `Soutien · ${firstName}`
                : tier === "contributor"
                  ? "Contribution ciblée"
                  : "Repères staff";

  return {
    nextActionKicker:
      tier === "moderator_discovery"
        ? `${firstName} · une étape à la fois`
        : tier === "moderator_paused"
          ? "Sans pression"
          : `${firstName} · ta priorité`,
    nextActionTitle:
      tier === "moderator_discovery"
        ? "Prochaine marche de ton parcours"
        : tier === "moderator_paused"
          ? "Reste connecté·e à ta façon"
          : hasOps
            ? "Ce qui compte maintenant"
            : "Profite de cette respiration",
    secondaryEmptyTitle:
      tier === "moderator_discovery" ? "Tu es au bon rythme" : "Tu es à jour sur l’essentiel",
    secondaryEmptyMessage:
      tier === "moderator_discovery"
        ? `${firstName}, explore la charte ou l’espace membre — pas besoin de tout faire aujourd’hui.`
        : `${firstName}, explore les raccourcis ou prends du recul sur la semaine.`,
    opsKicker: tier === "moderator_paused" ? "Pause active" : `${firstName} · files partagées`,
    opsTitle:
      tier === "moderator_discovery"
        ? "Files visibles pour t’entraîner"
        : tier === "moderator_paused"
          ? "Aucune file assignée"
          : "À traiter selon ton rôle",
    opsIntro:
      tier === "moderator_discovery"
        ? `${firstName}, ces files t’aident à lire les priorités — demande validation avant d’agir.`
        : tier === "moderator_paused"
          ? "Pendant ta pause, l’équipe couvre les files modération. Reviens quand tu le souhaites."
          : tier === "support"
            ? `${firstName}, concentre-toi sur profils et fiches — les files raids peuvent attendre un modérateur.`
            : "Ce qui attend l’équipe — commence par les P1 si tu peux.",
    opsEmptyMessage:
      tier === "moderator_discovery"
        ? `${firstName}, rien d’urgent dans ton périmètre d’observation — continue la charte.`
        : `${firstName}, rien d’urgent dans ton périmètre — belle respiration pour l’équipe.`,
    pulseSummary:
      tier === "moderator_discovery"
        ? "Lecture seule recommandée"
        : tier === "moderator_paused"
          ? "Informatif seulement"
          : autonomy
            ? "Tes signaux autonomie"
            : "Signaux du mois",
    pulseTitle:
      tier === "founder" || tier === "coordinator"
        ? "Pulse communauté"
        : tier === "moderator_discovery"
          ? "Repères modération"
          : "Signaux du moment",
    quickLinksKicker: `${firstName} · raccourcis`,
    quickLinksTitle:
      tier === "moderator_discovery"
        ? "Tes accès d’apprentissage"
        : tier === "founder"
          ? "Pilotage & modération"
          : "Accès directs",
    quickLinksIntro:
      tier === "moderator_discovery"
        ? "Commence par la charte, puis explore l’espace membre."
        : tier === "support"
          ? "Les outils membres que tu utilises le plus souvent."
          : "Raccourcis adaptés à ton périmètre staff.",
    agendaKicker: tier === "moderator_paused" ? "Agenda · informatif" : `${firstName} · agenda`,
    agendaTitle:
      tier === "coordinator" || tier === "founder"
        ? "Ce qui mobilise l’équipe"
        : tier === "moderator_discovery"
          ? "Dates à connaître"
          : "Ce qui arrive",
    agendaIntro:
      tier === "moderator_discovery"
        ? `${firstName}, inscris-toi aux réunions staff pour poser tes questions — ce n’est pas obligatoire en découverte.`
        : upcomingHasContent(data)
          ? `${firstName}, voici les prochains rendez-vous qui structurent la semaine staff.`
          : `${firstName}, le calendrier est léger — bon moment pour traiter les files en attente.`,
    activityKicker: "Flux plateforme",
    activityTitle:
      tier === "founder" || tier === "coordinator"
        ? "Dernières traces membres"
        : "Activité récente (48 h)",
    activityEmptyMessage:
      tier === "moderator_paused"
        ? "Calme sur la plateforme — profite de ta pause."
        : `${firstName}, aucune activité récente — calme relatif, bon moment pour les files en attente.`,
    alertsIntro: `${firstName}, voici ce qui mérite ton attention en priorité :`,
    roleGuideKicker,
    heroMeetingKicker:
      tier === "moderator_discovery" ? "Réunion staff · optionnelle" : "Ta prochaine réunion staff",
    heroExtendedLabel: heroExtended.label,
    heroExtendedHref: heroExtended.href,
    heroExtendedHint: heroExtended.hint,
    memberPreviewTitle:
      tier === "moderator_discovery"
        ? `${firstName}, vois comme un créateur`
        : tier === "support"
          ? "L’expérience côté membre"
          : "Voir comme un créateur",
    memberPreviewMessage:
      tier === "moderator_discovery"
        ? `${firstName}, comprendre le parcours membre t’aide à modérer avec empathie — explore sans pression.`
        : tier === "moderator_accompaniment"
          ? "Après une action staff, vérifie ce que le membre voit — ça affine ton jugement."
          : tier === "support"
            ? "Chaque correction admin se ressent ici — un passage régulier évite les décalages."
            : tier === "moderator_paused"
              ? "Reste dans la peau d’un membre si ça te fait du bien — sans obligation modération."
              : `${firstName}, vérifie ce que vivent les membres après une action staff.`,
  };
}

function upcomingHasContent(data: AdminDashboardAggregate): boolean {
  return (
    Boolean(data.upcoming.nextMeetingDateIso) ||
    data.upcoming.nextEventRegistrations > 0 ||
    data.upcoming.upcomingSpotlights > 0
  );
}

export function buildAdminDashboardModel(
  user: AdminDashboardUser,
  data: AdminDashboardAggregate,
): AdminDashboardModel {
  const tier = resolveAdminStaffTier(user.rawRole);
  const firstName = firstNameFromDisplay(user.displayName);
  const welcome = buildWelcomeCopy(tier, firstName, user.rawRole, data);
  const cards = buildCardCopy(tier, firstName, user.rawRole, data);
  const meetingCopy = meetingRegistrationsCopy(data.upcoming.nextMeetingRegistrations, tier, firstName);
  const accent = accentForTier(tier);
  const now = new Date();

  return {
    accent,
    tier,
    tierLabel: tierLabel(tier),
    firstName,
    displayName: user.displayName,
    roleLabel: user.roleLabel || tierLabel(tier),
    dateLabel: formatLongFrenchDate(now),
    monthLabel: formatMonthLabel(now),
    ...welcome,
    ...cards,
  showDiscoveryGuide:
      tier === "moderator_discovery" ||
      tier === "moderator_accompaniment" ||
      tier === "moderator_paused",
    showRoleGuide:
      tier === "moderator_discovery" ||
      tier === "moderator_accompaniment" ||
      tier === "moderator_paused" ||
      tier === "coordinator" ||
      tier === "founder" ||
      tier === "support" ||
      tier === "contributor",
    roleGuide: buildRoleGuide(tier, firstName, user.rawRole),
    pulseIndicators: buildPulseIndicators(tier, firstName, user.rawRole, data),
    primaryAction: buildPrimaryAction(tier, firstName, data),
    secondaryActions: buildSecondaryActions(tier, data),
    opsQueue: buildOpsQueue(tier, data, firstName),
    quickLinks: buildQuickLinks(tier),
    alerts: buildAlerts(tier, firstName, data),
    showOpsQueue: tier !== "moderator_paused",
    showMemberPreview: true,
    meetingLabel: data.upcoming.nextMeetingLabel || "Prochaine réunion staff",
    meetingDateLabel: formatMeetingDateTime(data.upcoming.nextMeetingDateIso),
    meetingRegistrations: meetingCopy.value,
    meetingRegistrationsHint: meetingCopy.hint,
    nextEventLabel: data.upcoming.nextEventLabel || "Aucun événement planifié",
    nextEventRegistrations: data.upcoming.nextEventRegistrations,
    upcomingSpotlights: data.upcoming.upcomingSpotlights,
  };
}

export function monthKeyForDashboard(date = new Date()): string {
  return monthKey(date);
}

export function previousMonthKeyForDashboard(date = new Date()): string {
  return monthKey(new Date(date.getFullYear(), date.getMonth() - 1, 1));
}
