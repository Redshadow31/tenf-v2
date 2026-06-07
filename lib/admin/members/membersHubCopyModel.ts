import {
  accentForTier,
  resolveAdminStaffTier,
  type AdminStaffTier,
} from "@/lib/admin/dashboard/adminDashboardModel";
import { firstNameFromDisplay, getTimeGreeting } from "@/lib/admin/account/adminAccountUtils";
import { MEMBERS_QUALITY_SCORE_EXPLAINER } from "@/lib/admin/members/membersQualityScore";
import type { MembersQualityTier } from "@/lib/admin/members/membersQualityScore";
import type { MembersHubOps, MembersHubSummary } from "@/lib/admin/members/membersHubModel";

export type MembersManagementPathsCounters = {
  profileValidationPending: number;
  incomplete: number;
  reviewOverdue: number;
  syncMissing: number;
  staffApplicationsPending: number;
  qualityScore: number;
  dataErrors: number;
};

export type MembersHubGuideStep = {
  id: string;
  kicker: string;
  title: string;
  body: string;
  footnote?: string;
  href?: string;
  hrefLabel?: string;
};

export type MembersHubPathGroupCopy = {
  id: string;
  title: string;
  description: string;
  links: { href: string; label: string; description: string }[];
};

export type MembersHubExperienceLinkCopy = {
  href: string;
  title: string;
  description: string;
};

export type MembersHubCrossLinkCopy = {
  href: string;
  title: string;
  description: string;
};

export type MembersHubWelcomeInsight = {
  id: string;
  label: string;
  detail: string;
  tone: "accent" | "success" | "warning" | "info" | "muted";
};

export type MembersHubCopyModel = {
  accent: string;
  tier: AdminStaffTier;
  tierLabel: string;
  firstName: string;
  displayName: string;
  welcomeKicker: string;
  welcomeBadge: string;
  welcomeTitle: string;
  welcomeMessage: string;
  welcomeInsights: MembersHubWelcomeInsight[];
  heroGuideLine: string;
  encouragement: string;
  guidanceKicker: string;
  guidanceTitle: string;
  guidanceIntro: string;
  guidanceSteps: string[];
  guideSteps: MembersHubGuideStep[];
  queueCtaLabel: string;
  refreshLabel: string;
  refreshBusyLabel: string;
  loadingTitle: string;
  loadingSubtitle: string;
  calmMessage: string;
  partialDataLabel: string;
  pulse: {
    kicker: string;
    title: string;
    chipUrgent: string;
    chipQueue: string;
    chipQuality: string;
    headline: string;
  };
  queue: {
    kicker: string;
    title: string;
    intro: string;
    cta: string;
    emptyTitle: string;
    emptyMessage: string;
    urgentTier: string;
    importantTier: string;
    openAction: string;
    ownerPrefix: string;
    unassigned: string;
    localView: string;
  };
  health: {
    kicker: string;
    title: string;
    intro: string;
    activeLabel: string;
    activeCaption: (validatedRate: number, total: number) => string;
    qualityLabel: string;
    qualityCaption: (score: number, tier: MembersQualityTier) => string;
    reviewLabel: string;
    reviewCaption: (overdue: number, due7d: number) => string;
    accessLabel: string;
    accessCaption: (pending: number, incomplete: number) => string;
    openAction: string;
  };
  paths: {
    kicker: string;
    title: string;
    intro: string;
    groups: MembersHubPathGroupCopy[];
  };
  weak: {
    kicker: string;
    title: string;
    intro: string;
    empty: string;
  };
  trend: {
    kicker: string;
    title: string;
    intro: string;
    queueStatLabel: string;
    queueStatHint: string;
    qualityStatLabel: string;
    qualityStatHint: string;
    cta: string;
  };
  experience: {
    kicker: string;
    title: string;
    intro: string;
    openLabel: string;
    links: MembersHubExperienceLinkCopy[];
  };
  cross: {
    kicker: string;
    title: string;
    intro: string;
    links: MembersHubCrossLinkCopy[];
  };
  aside: {
    remindersTitle: string;
    remindersIntro: string;
    pathTitle: string;
    pathSteps: string[];
    actionsTitle: string;
    fullQueue: string;
    listManage: string;
    validationProfile: string;
    linksTitle: string;
    reminders: string[];
  };
};

const QUALITY_TIER_LABEL: Record<MembersQualityTier, string> = {
  excellent: "excellent",
  ok: "stable",
  fragile: "fragile",
  critique: "critique",
};

type BuildMembersHubCopyInput = {
  displayName: string;
  roleLabel: string;
  rawRole: string | null;
  summary: MembersHubSummary;
  ops: MembersHubOps;
  pendingTotal: number;
  urgentCount: number;
  importantCount: number;
  weakSignalsCount: number;
  qualityScore: number;
  qualityTier: MembersQualityTier;
  pathCounters: MembersManagementPathsCounters;
};

function buildGuidanceSteps(
  tier: AdminStaffTier,
  firstName: string,
  pendingTotal: number,
  profileValidationPending: number,
): string[] {
  const steps: string[] = [];

  if (pendingTotal > 0) {
    steps.push(
      pendingTotal === 1
        ? `${firstName}, une action t'attend — commence par ce qui est marqué urgent.`
        : `${firstName}, ${pendingTotal} actions sont ouvertes : traite d'abord ce qui bloque un créateur aujourd'hui.`,
    );
  } else {
    steps.push(
      `${firstName}, rien d'urgent dans la file — c'est le bon moment pour accompagner un profil ou préparer la semaine.`,
    );
  }

  switch (tier) {
    case "moderator_discovery":
      steps.push("Tu ne connais pas un pseudo ? Cherche dans Liste & gestion — pas besoin de connaître tout le menu.");
      steps.push("Membre fraîchement accueilli ? Passe d'abord par Intégration, puis reviens ici pour le statut Affilié.");
      break;
    case "moderator_accompaniment":
      steps.push("Avant de valider seul·e : est-ce que ça impacte directement l'accueil du créateur ?");
      if (profileValidationPending > 0) {
        steps.push(
          `${profileValidationPending} validation${profileValidationPending > 1 ? "s" : ""} profil — chaque oui ici, c'est un créateur qui se sent reconnu.`,
        );
      }
      break;
    case "moderator_senior":
    case "coordinator":
    case "founder":
      steps.push("Les signaux faibles en bas de page ne sont pas urgents — ils t'évitent les mauvaises surprises.");
      if (profileValidationPending > 0) {
        steps.push(
          `Les validations profil (${profileValidationPending}) sont le premier contact après l'intégration — traite-les comme un message d'accueil.`,
        );
      }
      break;
    case "support":
      steps.push(
        "Un profil incomplet, c'est souvent quelqu'un qui ne sait pas quoi remplir — un petit message Discord peut suffire.",
      );
      break;
    case "moderator_paused":
      return [`${firstName}, aucune marche obligatoire — tu peux garder un œil sur la communauté si tu en as envie.`];
    default:
      steps.push("Clique une ligne de la file : le hub t'envoie directement sur la bonne page.");
  }

  return steps.slice(0, 3);
}

function buildGuideSteps(
  tier: AdminStaffTier,
  firstName: string,
  pendingTotal: number,
  profileValidationPending: number,
): MembersHubGuideStep[] {
  const queueFootnote =
    pendingTotal > 0
      ? `${pendingTotal} action${pendingTotal > 1 ? "s" : ""} ouverte${pendingTotal > 1 ? "s" : ""} — file complète dans Actions.`
      : undefined;

  return [
    {
      id: "queue",
      kicker: "1 · Priorité du jour",
      title: "La file te dit par où commencer",
      body:
        tier === "moderator_paused"
          ? "Tu peux consulter sans obligation. Urgent = créateur bloqué. Important = à traiter cette semaine."
          : "Urgent = créateur bloqué. Important = cette semaine. Clique une ligne — le hub t'envoie sur la bonne page.",
      footnote: queueFootnote,
    },
    {
      id: "search",
      kicker: "2 · Retrouver quelqu'un",
      title: "Une personne, une fiche",
      body:
        tier === "moderator_discovery"
          ? `${firstName}, pseudo Twitch ou Discord inconnu ? La barre de recherche en haut suffit — tu peux ouvrir la fiche ou ajuster le rôle.`
          : "Pseudo inconnu ? Utilise la recherche en haut de Liste & gestion pour ouvrir une fiche ou ajuster un rôle.",
      href: "/admin/membres/gestion",
      hrefLabel: "Ouvrir Liste & gestion",
    },
    {
      id: "onboarding",
      kicker: "3 · Après une session d'accueil",
      title: "De l'intégration à l'Affilié",
      body:
        tier === "support" || tier === "moderator_accompaniment"
          ? "Présences et activation d'abord, puis statut Affilié et validation profil ici."
          : "Après une session d'accueil : présences → activation → retour ici pour le statut Affilié.",
      href: "/admin/onboarding",
      hrefLabel: "Hub Intégration",
      footnote:
        profileValidationPending > 0
          ? `${profileValidationPending} validation${profileValidationPending > 1 ? "s" : ""} profil en attente`
          : undefined,
    },
  ];
}

function buildPulseHeadline(
  tier: AdminStaffTier,
  firstName: string,
  urgentCount: number,
  importantCount: number,
  weakSignalsCount: number,
): string {
  if (urgentCount > 0) {
    return `${urgentCount} action${urgentCount > 1 ? "s" : ""} bloque${urgentCount > 1 ? "nt" : ""} un ou plusieurs créateurs — commence par la file urgente.`;
  }
  if (importantCount > 0) {
    return `Pas d'urgence immédiate, mais ${importantCount} dossier${importantCount > 1 ? "s" : ""} à traiter cette semaine.`;
  }
  if (weakSignalsCount > 0) {
    return `Tout est sous contrôle. ${weakSignalsCount} signal${weakSignalsCount > 1 ? "aux" : ""} à garder en tête cette semaine.`;
  }
  if (tier === "moderator_paused") {
    return `${firstName}, la communauté est calme — tu peux simplement observer si tu le souhaites.`;
  }
  return "Tout est calme côté membres — bon moment pour valoriser un créateur ou peaufiner une fiche.";
}

function buildPathGroups(counters: MembersManagementPathsCounters): MembersHubPathGroupCopy[] {
  return [
    {
      id: "cycle",
      title: "Cycle de vie d'une fiche",
      description: "De la première validation au suivi régulier du créateur.",
      links: [
        {
          href: "/admin/membres/validation-profil",
          label: "Valider les accès",
          description:
            counters.profileValidationPending > 0
              ? `${counters.profileValidationPending} demande${counters.profileValidationPending > 1 ? "s" : ""} en attente de ton regard.`
              : "Aucune demande en attente — la file est à jour.",
        },
        {
          href: "/admin/membres/incomplets",
          label: "Profils à accompagner",
          description:
            counters.incomplete > 0
              ? `${counters.incomplete} fiche${counters.incomplete > 1 ? "s" : ""} avec des champs essentiels manquants.`
              : "Les fiches essentielles sont complètes.",
        },
        {
          href: "/admin/membres/revues",
          label: "Revues créateurs",
          description:
            counters.reviewOverdue > 0
              ? `${counters.reviewOverdue} revue${counters.reviewOverdue > 1 ? "s" : ""} en retard à relancer.`
              : "Les revues sont à jour — continue le suivi régulier.",
        },
        {
          href: "/admin/membres/historique",
          label: "Historique des changements",
          description: "Trace des décisions et modifications sur les fiches.",
        },
      ],
    },
    {
      id: "directory",
      title: "Annuaire & actions",
      description: "Trouver quelqu'un, ouvrir sa fiche, agir seul·e ou en masse.",
      links: [
        {
          href: "/admin/membres/gestion",
          label: "Liste & gestion",
          description: "Recherche, filtres, exports et actions groupées.",
        },
        {
          href: "/admin/search",
          label: "Recherche globale TENF",
          description: "Chercher un pseudo ou une info partout sur le site.",
        },
        {
          href: "/admin/membres/reconciliation",
          label: "Réconciliation",
          description: "Doublons, fusions et incohérences entre fiches.",
        },
      ],
    },
    {
      id: "quality",
      title: "Qualité & cohérence",
      description: "Diagnostic des fiches, Discord et synchronisation des données.",
      links: [
        {
          href: "/admin/membres/qualite-data",
          label: "Diagnostic qualité",
          description: `Score actuel : ${counters.qualityScore}/100 — ${MEMBERS_QUALITY_SCORE_EXPLAINER.toLowerCase()}`,
        },
        {
          href: "/admin/membres/qualite-data?onglet=discord",
          label: "Cohérence Discord",
          description: "Pseudos, identifiants et correspondance avec les fiches.",
        },
        {
          href: "/admin/membres/qualite-data?onglet=sync",
          label: "Synchronisation",
          description:
            counters.syncMissing > 0
              ? `${counters.syncMissing} écart${counters.syncMissing > 1 ? "s" : ""} entre legacy et Supabase.`
              : "Sources alignées — pas d'écart détecté.",
        },
        {
          href: "/admin/membres/incomplets?vue=erreurs",
          label: "Anomalies critiques",
          description:
            counters.dataErrors > 0
              ? `${counters.dataErrors} incohérence${counters.dataErrors > 1 ? "s" : ""} à corriger en priorité.`
              : "Aucune anomalie critique détectée.",
        },
      ],
    },
    {
      id: "recruitment",
      title: "Recrutement staff",
      description: "Postulations, entretiens et signalements sensibles.",
      links: [
        {
          href: "/admin/membres/postulations",
          label: "Postulations à instruire",
          description:
            counters.staffApplicationsPending > 0
              ? `${counters.staffApplicationsPending} candidature${counters.staffApplicationsPending > 1 ? "s" : ""} en attente de suivi.`
              : "Aucune postulation en attente.",
        },
      ],
    },
    {
      id: "recognition",
      title: "Reconnaissance",
      description: "Mettre en avant ceux qui font vivre la New Family.",
      links: [
        {
          href: "/admin/membres/badges",
          label: "Badges & distinctions",
          description: "Reconnaître un créateur par catégorie ou mérite.",
        },
        {
          href: "/admin/membres/vip",
          label: "VIP du mois",
          description: "Mise en avant mensuelle des créateurs.",
        },
        {
          href: "/admin/membres/spotlight",
          label: "Spotlight créateurs",
          description: "Programmer une mise en lumière sur le site.",
        },
      ],
    },
  ];
}

function buildAsideReminders(
  tier: AdminStaffTier,
  profileValidationPending: number,
  incomplete: number,
): string[] {
  const items: string[] = [];

  if (profileValidationPending > 0) {
    items.push(
      `${profileValidationPending} validation${profileValidationPending > 1 ? "s" : ""} profil — c'est souvent le premier « bienvenue » côté staff.`,
    );
  }

  items.push("Commence par la file « À traiter » : chaque ligne est un raccourci vers la page qui règle le problème.");
  items.push("Urgent = créateur bloqué. Important = cette semaine, sans blocage immédiat.");
  items.push("Liste & gestion sert à chercher un pseudo ou changer un rôle — ce n'est pas la file des tâches.");

  if (tier !== "moderator_paused") {
    items.push("Après une session d'accueil : hub Intégration d'abord, puis retour ici pour le statut Affilié.");
  }

  if (incomplete > 0) {
    items.push(
      `${incomplete} fiche${incomplete > 1 ? "s" : ""} incomplète${incomplete > 1 ? "s" : ""} — un message d'accompagnement vaut parfois mieux qu'une relance admin.`,
    );
  }

  return items.slice(0, tier === "moderator_paused" ? 3 : 5);
}

function buildAsidePathSteps(tier: AdminStaffTier): string[] {
  if (tier === "moderator_paused") {
    return [
      "Lis le pouls du jour sans obligation d'agir.",
      "Explore Liste & gestion si tu veux retrouver quelqu'un.",
      "Les signaux faibles restent informatifs — pas de file à vider.",
    ];
  }
  return [
    "Lis la phrase du jour et repère la file « À traiter ».",
    "Traite les lignes urgentes — ou ouvre Actions pour tout voir.",
    "Cherche ou mets à jour un créateur dans Liste & gestion.",
    "Nouveau après session ? Intégration d'abord, puis retour ici.",
    "Signaux faibles = à surveiller, pas forcément urgent.",
  ];
}

function buildMembersHubWelcome(input: BuildMembersHubCopyInput): Pick<
  MembersHubCopyModel,
  | "welcomeKicker"
  | "welcomeBadge"
  | "welcomeTitle"
  | "welcomeMessage"
  | "welcomeInsights"
  | "heroGuideLine"
  | "encouragement"
  | "queueCtaLabel"
> {
  const tier = resolveAdminStaffTier(input.rawRole);
  const firstName = firstNameFromDisplay(input.displayName);
  const greeting = getTimeGreeting();
  const { pendingTotal, ops, summary, urgentCount, importantCount, qualityScore } = input;

  const queueCta =
    pendingTotal > 0
      ? tier === "founder" || tier === "coordinator"
        ? `Voir les ${pendingTotal} actions pour la famille`
        : `Ouvrir la file (${pendingTotal})`
      : "Parcourir la file";

  switch (tier) {
    case "moderator_discovery":
      return {
        welcomeKicker: `${firstName} · membres · découverte`,
        welcomeBadge: "Tu observes, on t'accompagne",
        welcomeTitle: `${greeting} ${firstName} — découvre la communauté sans te presser`,
        welcomeMessage: [
          `${firstName}, ce hub te montre ce qui attend les créateurs — validations, profils, qualité des fiches.`,
          pendingTotal > 0
            ? `${pendingTotal} action(s) ouverte(s) : observe-les avec ton référent avant d'agir — c'est un apprentissage, pas un examen.`
            : "Rien de bloquant dans la file — profite-en pour explorer Liste & gestion et voir comment une fiche est construite.",
          summary.total > 0 ? `${summary.total} créateurs actifs comptent sur une équipe sereine.` : null,
        ]
          .filter(Boolean)
          .join(" "),
        welcomeInsights: [
          { id: "mode", label: "Ton mode", detail: "Observation guidée", tone: "info" },
          {
            id: "file",
            label: "File ouverte",
            detail: String(pendingTotal),
            tone: pendingTotal > 0 ? "warning" : "success",
          },
          {
            id: "validations",
            label: "Validations profil",
            detail: String(ops.profileValidationPendingCount),
            tone: ops.profileValidationPendingCount > 0 ? "accent" : "muted",
          },
        ],
        heroGuideLine:
          pendingTotal > 0
            ? "Commence par lire la file du jour avec ton référent — une ligne à la fois suffit."
            : "Explore une fiche dans Liste & gestion pour voir TENF du côté admin.",
        encouragement: `${firstName}, personne ne te demande d'être parfait·e ici. Curiosité et bienveillance — c'est exactement ce qu'on cherche.`,
        queueCtaLabel: queueCta,
      };

    case "moderator_accompaniment":
      return {
        welcomeKicker: `${firstName} · membres · accompagnement`,
        welcomeBadge: "Tu peux agir, avec un filet",
        welcomeTitle: `${greeting} ${firstName} — accompagne les créateurs, pas à pas`,
        welcomeMessage: [
          `Tu montes en autonomie, ${firstName}. Ici tu vois ce qui bloque un membre — validation, profil incomplet, revue.`,
          urgentCount > 0
            ? `${urgentCount} action(s) urgente(s) : un créateur attend une réponse concrète de l'équipe.`
            : importantCount > 0
              ? `${importantCount} dossier(s) important(s) cette semaine — sans urgence immédiate.`
              : "La file est calme — bon moment pour consolider tes réflexes sur une validation profil.",
          ops.profileValidationPendingCount > 0
            ? `${ops.profileValidationPendingCount} validation(s) profil — chaque oui, c'est un « bienvenue » tangible.`
            : null,
        ]
          .filter(Boolean)
          .join(" "),
        welcomeInsights: [
          {
            id: "urgent",
            label: "Urgent",
            detail: String(urgentCount),
            tone: urgentCount > 0 ? "warning" : "success",
          },
          {
            id: "validations",
            label: "Validations",
            detail: String(ops.profileValidationPendingCount),
            tone: ops.profileValidationPendingCount > 0 ? "accent" : "muted",
          },
          {
            id: "quality",
            label: "Qualité fiches",
            detail: `${qualityScore}/100`,
            tone: qualityScore >= 80 ? "success" : "warning",
          },
        ],
        heroGuideLine:
          urgentCount > 0
            ? "Ouvre la première ligne urgente — si tu doutes, demande un retour à ton référent avant de valider."
            : "Passe par Validation profil ou Profils incomplets : c'est ton terrain naturel en accompagnement.",
        encouragement:
          "Chaque hésitation remontée à l'équipe est une preuve de maturité. Traiter proprement vaut mieux que traiter vite.",
        queueCtaLabel: queueCta,
      };

    case "moderator_senior":
      return {
        welcomeKicker: `${firstName} · membres · confirmé(e)`,
        welcomeBadge: "La communauté compte sur toi",
        welcomeTitle: `${greeting} ${firstName} — tiens le cap côté créateurs`,
        welcomeMessage: [
          `${firstName}, tu connais le terrain : ce hub condense ce qui bloque les membres et où agir sans ouvrir dix pages.`,
          pendingTotal > 0
            ? `${pendingTotal} action(s) en file — priorise ce qui empêche un créateur de se sentir accueilli.`
            : `Belle respiration sur les files — ${summary.total} créateurs actifs, tu peux renforcer la qualité des fiches.`,
          summary.reviewOverdue > 0
            ? `${summary.reviewOverdue} revue(s) en retard — un rappel bienveillant relance souvent la dynamique.`
            : null,
        ]
          .filter(Boolean)
          .join(" "),
        welcomeInsights: [
          {
            id: "file",
            label: "File",
            detail: String(pendingTotal),
            tone: pendingTotal > 0 ? "warning" : "success",
          },
          {
            id: "revues",
            label: "Revues retard",
            detail: String(summary.reviewOverdue),
            tone: summary.reviewOverdue > 0 ? "warning" : "success",
          },
          {
            id: "incomplete",
            label: "Profils à compléter",
            detail: String(summary.incomplete),
            tone: summary.incomplete > 0 ? "accent" : "muted",
          },
        ],
        heroGuideLine:
          pendingTotal > 0
            ? "Vide la file urgente d'abord — tu libères un créateur à chaque ligne traitée."
            : "Regarde les signaux faibles : anticiper évite qu'un petit oubli devienne un blocage.",
        encouragement:
          "Un mot à un modérateur en découverte vaut parfois plus qu'une file entière traitée seul·e. Merci de tenir le fort.",
        queueCtaLabel: queueCta,
      };

    case "moderator_paused":
      return {
        welcomeKicker: `${firstName} · membres · sans obligation`,
        welcomeBadge: "Ta place est gardée",
        welcomeTitle: `${greeting} ${firstName} — observe si tu en as envie`,
        welcomeMessage: `${firstName}, tu n'as rien à traiter ici. Ce hub reste lisible pour suivre l'état de la communauté — sans culpabilité, sans compte à rendre.`,
        welcomeInsights: [
          { id: "mode", label: "Statut", detail: "Pause active", tone: "info" },
          { id: "members", label: "Créateurs actifs", detail: String(summary.total), tone: "muted" },
          { id: "file", label: "File", detail: String(pendingTotal), tone: "muted" },
        ],
        heroGuideLine: "Aucune marche obligatoire — tu peux fermer cette page ou simplement garder un œil sur le pouls du jour.",
        encouragement: "Revenir quand tu seras prêt·e, c'est toujours possible. La New Family ne t'oublie pas.",
        queueCtaLabel: "Consulter la file",
      };

    case "coordinator":
      return {
        welcomeKicker: `${firstName} · coordination · membres`,
        welcomeBadge: "Tu fais le lien pour eux",
        welcomeTitle: `${greeting} ${firstName} — orchestrons l'accueil des créateurs`,
        welcomeMessage: [
          `${firstName}, tu es souvent celui ou celle qu'on regarde quand un membre coince. Ce hub centralise validations, revues et qualité data.`,
          summary.incomplete > 0
            ? `${summary.incomplete} fiche(s) incomplète(s) freinent l'expérience côté créateurs — un accompagnement doux peut suffire.`
            : "Les fiches sont globalement propres — belle base pour l'équipe.",
          ops.staffApplicationsPendingCount > 0
            ? `${ops.staffApplicationsPendingCount} postulation(s) staff à instruire — ne laisse pas traîner un dossier sensible.`
            : null,
          pendingTotal > 0 ? `${pendingTotal} action(s) membres ouvertes — délègue ce qui peut l'être.` : null,
        ]
          .filter(Boolean)
          .join(" "),
        welcomeInsights: [
          {
            id: "validations",
            label: "Validations profil",
            detail: String(ops.profileValidationPendingCount),
            tone: ops.profileValidationPendingCount > 0 ? "warning" : "success",
          },
          {
            id: "staff",
            label: "Postulations",
            detail: String(ops.staffApplicationsPendingCount),
            tone: ops.staffApplicationsPendingCount > 0 ? "warning" : "info",
          },
          {
            id: "quality",
            label: "Qualité data",
            detail: `${qualityScore}/100`,
            tone: qualityScore >= 75 ? "success" : "warning",
          },
        ],
        heroGuideLine:
          ops.profileValidationPendingCount > 0
            ? `Commence par les ${ops.profileValidationPendingCount} validation(s) profil — c'est le premier contact après l'intégration.`
            : pendingTotal > 0
              ? "Priorise la file urgente, puis répartis le reste — coordonner, ce n'est pas tout porter seul·e."
              : "Profite du calme pour préparer la semaine ou relancer une revue en douceur.",
        encouragement: `${firstName}, ton regard transversal évite que la charge se concentre sur les fondateur·rices. Merci pour ce rôle de lien.`,
        queueCtaLabel: queueCta,
      };

    case "founder":
      return {
        welcomeKicker: `${firstName} · fondateur·rice · New Family`,
        welcomeBadge: "Les racines que tu as plantées",
        welcomeTitle: `${greeting} ${firstName} — chaque créateur compte, ici tu le vois`,
        welcomeMessage: [
          `${firstName}, tu as fait naître cette famille. Ce hub te montre, sans bruit, qui attend encore ton attention — avant qu'un membre ne se sente oublié.`,
          summary.total > 0
            ? `${summary.total} créateurs actifs, complétude moyenne ${summary.avgCompletion}% — le pouls réel de la communauté.`
            : null,
          pendingTotal > 0
            ? `${pendingTotal} action(s) en file — tu n'as pas à tout faire seul·e, mais tu vois où ça coince.`
            : "Aucune file bloquante — la communauté respire. C'est le moment de valoriser quelqu'un ou de préparer la suite.",
          ops.staffApplicationsRedFlagCount > 0
            ? `${ops.staffApplicationsRedFlagCount} candidature(s) signalée(s) sensible(s) — à traiter avec attention.`
            : ops.profileValidationPendingCount > 0
              ? `${ops.profileValidationPendingCount} validation(s) profil en attente — le premier « bienvenue » côté staff.`
              : summary.reviewOverdue > 0
                ? `${summary.reviewOverdue} revue(s) en retard — impact direct sur le sentiment d'être suivi.`
                : null,
        ]
          .filter(Boolean)
          .join(" "),
        welcomeInsights: [
          {
            id: "community",
            label: "Créateurs actifs",
            detail: String(summary.total),
            tone: "accent",
          },
          {
            id: "file",
            label: "File membres",
            detail: String(pendingTotal),
            tone: pendingTotal > 0 ? "warning" : "success",
          },
          {
            id: "validations",
            label: "Validations",
            detail: String(ops.profileValidationPendingCount),
            tone: ops.profileValidationPendingCount > 0 ? "warning" : "success",
          },
        ],
        heroGuideLine:
          urgentCount > 0
            ? `${urgentCount} urgent(s) — commence par là : un créateur bloqué, c'est une faille dans la promesse TENF.`
            : ops.profileValidationPendingCount > 0
              ? `Les ${ops.profileValidationPendingCount} validation(s) profil, c'est l'accueil concret — délègue ou traite une première ligne.`
              : pendingTotal === 0
                ? "Tout est calme — regarde les signaux faibles ou passe par VIP / Spotlight pour faire briller un créateur."
                : "Ouvre la file : tu gardes le cap sans micro-gérer chaque fiche.",
        encouragement: `${firstName}, tu as bâti cet écosystème — ce cockpit te libère du bruit pour protéger l'essentiel : que personne ne se sente invisible dans la famille.`,
        queueCtaLabel: queueCta,
      };

    case "support":
      return {
        welcomeKicker: `${firstName} · soutien · accueil membres`,
        welcomeBadge: "La main tendue des coulisses",
        welcomeTitle: `${greeting} ${firstName} — tu facilites leur arrivée`,
        welcomeMessage: [
          `${firstName}, souvent tu es la première personne « admin » qu'un membre croise, sans le savoir.`,
          ops.profileValidationPendingCount > 0
            ? `${ops.profileValidationPendingCount} validation(s) profil attendent — impact direct sur leur sentiment d'être accueilli.`
            : summary.incomplete > 0
              ? `${summary.incomplete} profil(s) incomplet(s) — parfois un simple message Discord débloque tout.`
              : "Les accès sont à jour — tu peux accompagner en douceur ou préparer la suite.",
          pendingTotal > 0 ? `${pendingTotal} action(s) ouverte(s) au total.` : null,
        ]
          .filter(Boolean)
          .join(" "),
        welcomeInsights: [
          {
            id: "validations",
            label: "Validations",
            detail: String(ops.profileValidationPendingCount),
            tone: ops.profileValidationPendingCount > 0 ? "warning" : "success",
          },
          {
            id: "incomplete",
            label: "À accompagner",
            detail: String(summary.incomplete),
            tone: summary.incomplete > 0 ? "accent" : "muted",
          },
          {
            id: "file",
            label: "File",
            detail: String(pendingTotal),
            tone: pendingTotal > 0 ? "warning" : "success",
          },
        ],
        heroGuideLine:
          ops.profileValidationPendingCount > 0
            ? "Ouvre Validation profil — une fiche validée, c'est un créateur qui se sent reconnu dès le départ."
            : summary.incomplete > 0
              ? "Passe par Profils incomplets : une relance personnalisée vaut mieux qu'un rappel automatique."
              : "Parcours Liste & gestion pour vérifier qu'aucune fiche ne traîne dans l'ombre.",
        encouragement:
          "Un profil accueilli, un pseudo corrigé — parfois c'est ça, la modération invisible qui compte. Merci pour ta bienveillance.",
        queueCtaLabel: queueCta,
      };

    default:
      return {
        welcomeKicker: `${firstName} · gestion membres`,
        welcomeBadge: "Hub communauté TENF",
        welcomeTitle: `${greeting} ${firstName} — la New Family sous tes yeux`,
        welcomeMessage: [
          `${firstName}, ce hub répond à trois questions : qu'est-ce qui bloque, où en est la communauté, où agir.`,
          pendingTotal > 0
            ? `${pendingTotal} action(s) ouverte(s) — la file du jour te guide pas à pas.`
            : "Rien de bloquant — bon moment pour explorer les parcours d'action ci-dessous.",
        ].join(" "),
        welcomeInsights: [
          { id: "file", label: "File", detail: String(pendingTotal), tone: pendingTotal > 0 ? "warning" : "success" },
          { id: "members", label: "Actifs", detail: String(summary.total), tone: "info" },
          { id: "quality", label: "Qualité", detail: `${qualityScore}/100`, tone: "accent" },
        ],
        heroGuideLine: "Commence par la file « À traiter » — chaque ligne t'envoie sur la bonne page.",
        encouragement: "Chaque action ici rapproche un créateur de la sensation d'être chez lui dans TENF. Merci d'être là.",
        queueCtaLabel: queueCta,
      };
  }
}

export function buildMembersHubCopyModel(input: BuildMembersHubCopyInput): MembersHubCopyModel {
  const tier = resolveAdminStaffTier(input.rawRole);
  const accent = accentForTier(tier);
  const firstName = firstNameFromDisplay(input.displayName);
  const tierLabel = input.roleLabel.trim() || "Staff TENF";
  const { pendingTotal, ops, summary, pathCounters } = input;
  const welcome = buildMembersHubWelcome(input);

  let guidanceIntro: string;
  let calmMessage: string;

  switch (tier) {
    case "moderator_discovery":
      guidanceIntro = "Trois repères simples pour avancer sans te perdre dans le menu admin.";
      calmMessage = "Un « 0 » ou « tout est calme » veut dire qu'il n'y a rien de bloquant — ce n'est pas une erreur.";
      break;
    case "moderator_accompaniment":
      guidanceIntro = "La file te montre l'ordre des priorités. Une action urgente, c'est un créateur qui attend une réponse concrète.";
      calmMessage = "Les compteurs viennent de la base réelle. Calme apparent = espace pour accompagner ou préparer.";
      break;
    case "moderator_senior":
      guidanceIntro = "Priorise l'accueil direct. Les signaux faibles t'aident à anticiper sans stress.";
      calmMessage = "Zéro urgent ne veut pas dire inactivité — c'est le moment de renforcer la qualité des fiches.";
      break;
    case "coordinator":
      guidanceIntro = "Commence par la file urgente, puis les validations profil. Les chiffres reflètent la base réelle.";
      calmMessage = "Données partielles = une source a échoué. Actualise avant de conclure.";
      break;
    case "founder":
      guidanceIntro = "Tu vois l'essentiel sans micro-gérer — délègue les files du quotidien quand tu peux.";
      calmMessage = "Données partielles = une source a échoué. Actualise avant de conclure.";
      break;
    case "support":
      guidanceIntro = "Validations profil et fiches incomplètes : ton terrain naturel. Clique une ligne pour agir.";
      calmMessage = "Rien en file ? Parcours les signaux faibles pour un accompagnement en douceur.";
      break;
    case "moderator_paused":
      guidanceIntro = "Les sections restent lisibles pour te repérer — aucune action n'est attendue.";
      calmMessage = "Les chiffres sont informatifs. Tu n'as pas de file à vider.";
      break;
    default:
      guidanceIntro = "Suis la file du jour, puis ouvre la page indiquée en cliquant sur chaque ligne.";
      calmMessage = "Un « 0 » signifie qu'il n'y a rien de bloquant — ce n'est pas une erreur d'affichage.";
  }

  return {
    accent,
    tier,
    tierLabel,
    firstName,
    displayName: input.displayName,
    ...welcome,
    guidanceKicker: "Repères staff",
    guidanceTitle:
      tier === "moderator_discovery"
        ? "Par où commencer (sans être expert TENF)"
        : tier === "moderator_paused"
          ? "Te repérer, sans obligation"
          : "Trois repères pour aujourd'hui",
    guidanceIntro,
    guidanceSteps: buildGuidanceSteps(tier, firstName, pendingTotal, ops.profileValidationPendingCount),
    guideSteps: buildGuideSteps(tier, firstName, pendingTotal, ops.profileValidationPendingCount),
    refreshLabel: "Actualiser",
    refreshBusyLabel: "Actualisation…",
    loadingTitle: "Chargement du hub membres",
    loadingSubtitle: "On rassemble les files, le pouls communauté et les signaux qualité…",
    calmMessage,
    partialDataLabel: "Données partielles",
    pulse: {
      kicker: "Pouls du jour",
      title: "Où en est la communauté",
      chipUrgent: "urgents",
      chipQueue: "en file",
      chipQuality: "qualité fiches",
      headline: buildPulseHeadline(tier, firstName, input.urgentCount, input.importantCount, input.weakSignalsCount),
    },
    queue: {
      kicker: "File du jour",
      title: "Ce qui débloque les créateurs",
      intro:
        "Les actions à plus fort impact : ouvrir un profil, valider un dossier, clore une revue. La file complète reste dans Actions.",
      cta: "Voir toute la file",
      emptyTitle: "Rien d'urgent — bravo",
      emptyMessage:
        "Aucun créateur bloqué côté validation, postulation ou data. C'est le bon moment pour mettre quelqu'un en avant.",
      urgentTier: "Urgent · à ouvrir en premier",
      importantTier: "Important · cette semaine",
      openAction: "Traiter",
      ownerPrefix: "Assigné à",
      unassigned: "Non assigné",
      localView: "vue locale",
    },
    health: {
      kicker: "Santé communauté",
      title: "Les créateurs TENF en chiffres",
      intro: "Quatre indicateurs pour sentir l'état des fiches — clique une carte pour agir.",
      activeLabel: "Créateurs actifs",
      activeCaption: (rate, total) =>
        total > 0 ? `${rate}% de fiches validées par l'équipe` : "Aucun créateur en base pour l'instant",
      qualityLabel: "Qualité des fiches",
      qualityCaption: (score, qTier) =>
        `Score ${QUALITY_TIER_LABEL[qTier]} — ${MEMBERS_QUALITY_SCORE_EXPLAINER.toLowerCase()}`,
      reviewLabel: "Suivi & revues",
      reviewCaption: (overdue, due7d) =>
        overdue === 0
          ? `Revues à jour · ${due7d} prévue${due7d > 1 ? "s" : ""} cette semaine`
          : `${overdue} en retard · ${due7d} à venir cette semaine`,
      accessLabel: "Accès en attente",
      accessCaption: (pending, incomplete) => {
        if (pending > 0) {
          return `${pending} validation${pending > 1 ? "s" : ""} + ${incomplete} profil${incomplete > 1 ? "s" : ""} à accompagner`;
        }
        if (incomplete > 0) {
          return `${incomplete} profil${incomplete > 1 ? "s" : ""} à accompagner — une relance douce peut suffire`;
        }
        return "Aucun créateur en attente d'accès";
      },
      openAction: "Voir le détail",
    },
    paths: {
      kicker: "Parcours d'action",
      title: "Cinq chemins, un seul objectif",
      intro: "Chaque parcours regroupe les pages d'un même geste. Les descriptions reflètent l'état actuel des compteurs.",
      groups: buildPathGroups(pathCounters),
    },
    weak: {
      kicker: "Anticipation",
      title: "Signaux à surveiller",
      intro: "Pas urgent, mais utile cette semaine pour éviter qu'un petit oubli devienne un blocage.",
      empty: "Aucun signal faible détecté. Tu peux te concentrer sur le pilotage long terme ou la reconnaissance.",
    },
    trend: {
      kicker: "Repère dans le temps",
      title: "Comparer semaine après semaine",
      intro:
        "Snapshot à date — compare la file ouverte et le score qualité d'une semaine à l'autre. L'historique détaille les événements créateurs.",
      queueStatLabel: "File ouverte",
      queueStatHint: "Actions à traiter aujourd'hui",
      qualityStatLabel: "Score qualité",
      qualityStatHint: "À comparer chaque semaine",
      cta: "Ouvrir l'historique membres",
    },
    experience: {
      kicker: "Regard créateur",
      title: "Voir TENF comme eux le voient",
      intro:
        "Avant un message ou une décision admin, jette un œil au rendu réel — tu modères et accompagnes mieux quand tu ressens ce qu'ils ressentent.",
      openLabel: "Ouvrir dans un nouvel onglet",
      links: [
        {
          href: "/member/dashboard",
          title: "Espace créateur",
          description: "Le tableau de bord tel qu'un membre TENF connecté le voit.",
        },
        {
          href: "/rejoindre/guide-public/presentation-rapide",
          title: "Parcours public",
          description: "Ce qu'un visiteur découvre avant d'envisager de nous rejoindre.",
        },
        {
          href: "/member/evenements",
          title: "Événements côté membre",
          description: "Inscriptions et rendez-vous tels qu'ils apparaissent pour les créateurs.",
        },
      ],
    },
    cross: {
      kicker: "Écosystème TENF",
      title: "La gestion membres ne vit pas seule",
      intro: "Mêmes créateurs, mêmes événements, même équipe — garde ces hubs dans ton radar.",
      links: [
        {
          href: "/admin/onboarding",
          title: "Intégration",
          description: "Sessions d'accueil et parcours des nouveaux membres.",
        },
        {
          href: "/admin/moderation",
          title: "Modération",
          description: "Charte, équipe et outils de modération staff.",
        },
        {
          href: "/admin/communaute",
          title: "Communauté",
          description: "Animations, raids et vie de la New Family.",
        },
        {
          href: "/admin/communaute/evenements",
          title: "Événements",
          description: "Programmation des rendez-vous TENF.",
        },
        {
          href: "/admin/communaute/evenements/spotlight",
          title: "Spotlight animation",
          description: "Programmation côté animation communauté.",
        },
      ],
    },
    aside: {
      remindersTitle: "Rappels rapides",
      remindersIntro: "Les règles essentielles — sans avoir tout le site en tête.",
      pathTitle: "Parcours conseillé",
      pathSteps: buildAsidePathSteps(tier),
      actionsTitle: "Agir maintenant",
      fullQueue: "File complète",
      listManage: "Liste & gestion",
      validationProfile: "Validation profil",
      linksTitle: "Liens utiles",
      reminders: buildAsideReminders(tier, ops.profileValidationPendingCount, summary.incomplete),
    },
  };
}

export const MEMBERS_HUB_LOADING_COPY: Pick<MembersHubCopyModel, "loadingTitle" | "loadingSubtitle"> = {
  loadingTitle: "Chargement du hub membres",
  loadingSubtitle: "On rassemble les files, le pouls communauté et les signaux qualité…",
};
