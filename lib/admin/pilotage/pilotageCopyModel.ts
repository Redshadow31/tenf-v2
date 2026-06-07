import {
  accentForTier,
  resolveAdminStaffTier,
  type AdminStaffTier,
} from "@/lib/admin/dashboard/adminDashboardModel";
import { firstNameFromDisplay, getTimeGreeting } from "@/lib/admin/account/adminAccountUtils";

export type PilotageKpiCounts = {
  totalMembers: number;
  avgCompletion: number;
  raidsPending: number;
  tasksInView: number;
  incomplete: number;
  profileValidationPending: number;
  staffApplicationsPending: number;
};

export type PilotageWelcomeInsight = {
  id: string;
  label: string;
  detail: string;
  tone: "accent" | "success" | "warning" | "info" | "muted";
};

export type PilotageGuideStep = {
  id: string;
  kicker: string;
  title: string;
  body: string;
};

export type PilotagePillarCopy = {
  id: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

export type PilotageCopyModel = {
  accent: string;
  tier: AdminStaffTier;
  tierLabel: string;
  firstName: string;
  displayName: string;
  dateLabel: string;
  welcomeKicker: string;
  welcomeBadge: string;
  welcomeTitle: string;
  welcomeMessage: string;
  welcomeInsights: PilotageWelcomeInsight[];
  pageMission: string;
  heroGuideLine: string;
  encouragement: string;
  guidanceKicker: string;
  guidanceTitle: string;
  guidanceIntro: string;
  guideSteps: PilotageGuideStep[];
  pillars: PilotagePillarCopy[];
  kpi: {
    totalMembers: { label: string; hint: string };
    avgCompletion: { label: string; hint: string };
    raidsPending: { label: string; hint: string };
    tasksInView: { label: string; hint: string };
  };
  aside: {
    dashboardLabel: string;
    dashboardIntro: string;
    opsTitle: string;
    toolsTitle: string;
    meetingHint: string;
  };
  tabs: {
    cockpit: { label: string; desc: string };
    vitals: { label: string; desc: string };
    evenements: { label: string; desc: string };
  };
  sections: {
    alerts: { title: string; intro: string };
    ops: { title: string; intro: string; empty: string; assignHint: string };
    vitals: {
      alertsTitle: string;
      alertsIntro: string;
      agendaTitle: string;
      agendaIntro: string;
      activityTitle: string;
      activityIntro: string;
    };
    workflow: { title: string; intro: string; detailHint: string };
    recentActivity: { title: string; intro: string; empty: string };
    events: { title: string; intro: string; loading: string; empty: string };
  };
};

type BuildPilotageCopyInput = {
  displayName: string;
  roleLabel: string;
  rawRole: string | null;
  counts: PilotageKpiCounts;
  dateLabel: string;
};

function buildGuideSteps(tier: AdminStaffTier, firstName: string, counts: PilotageKpiCounts): PilotageGuideStep[] {
  const urgent = counts.raidsPending + counts.profileValidationPending + counts.staffApplicationsPending;

  return [
    {
      id: "priorise",
      kicker: "1 · Prioriser",
      title: urgent > 0 ? "Commence par ce qui bloque l'entraide" : "Repère le calme avant d'avancer",
      body:
        urgent > 0
          ? `${counts.raidsPending} raid(s), ${counts.profileValidationPending} validation(s) profil, ${counts.staffApplicationsPending} postulation(s) — la file « Cockpit » te dit par où commencer.`
          : "Rien d'urgent dans les files : bon moment pour consolider les fiches ou préparer la prochaine réunion staff.",
    },
    {
      id: "comprendre",
      kicker: "2 · Comprendre",
      title: "Lis le pouls de la communauté",
      body:
        tier === "founder" || tier === "coordinator"
          ? `${firstName}, onglet « Pouls communauté » : Discord, raids, graphiques — tu vois si l'entraide vit ou si quelque chose décroche.`
          : "Onglet « Pouls communauté » : messages, vocaux, raids — comprends l'ambiance avant de répondre sur Discord.",
    },
    {
      id: "responsabiliser",
      kicker: "3 · Assumer",
      title: "Prends ownership sur une action",
      body:
        tier === "moderator_discovery"
          ? "Observe une ligne de la file avec ton référent — assigne-toi mentalement une tâche pour apprendre le rythme."
          : counts.tasksInView > 0
            ? `${counts.tasksInView} tâche(s) dans ta vue active : clique « Traiter », assigne-toi, ferme la boucle — la communauté sent quand on suit.`
            : "Choisis une action concrète cette semaine (validation, relance profil, présence événement) et tiens-la.",
    },
  ];
}

function buildPillars(tier: AdminStaffTier): PilotagePillarCopy[] {
  return [
    {
      id: "members",
      title: "Membres & parcours",
      body:
        tier === "moderator_discovery"
          ? "Fiches, validations, intégration : observe comment chaque créateur est accueilli dans la famille."
          : "Fiches, validations, formations : chaque correction ici améliore ce que vit le créateur sur le site et Discord.",
      href: "/admin/membres",
      cta: "Hub membres",
    },
    {
      id: "moderation",
      title: "Modération & live",
      body:
        tier === "support"
          ? "Raids, points Discord, présences : le rythme du serveur d'entraide repose sur ces files tenues à jour."
          : "Raids, points Discord, événements : ce qui se passe en live sur l'entraide se reflète ici.",
      href: "/admin/engagement/raids-a-valider",
      cta: "Files modération",
    },
    {
      id: "admin",
      title: "Pilotage & gouvernance",
      body:
        tier === "founder"
          ? "Control center, backlog, data health : tu tiens le cadre pour que l'équipe staff avance sereinement."
          : "Communauté, audits, readiness : le cadre qui permet à l'entraide de rester sain et prévisible.",
      href: "/admin/communaute",
      cta: "Hub communauté",
    },
  ];
}

function buildWelcome(input: BuildPilotageCopyInput): Pick<
  PilotageCopyModel,
  | "welcomeKicker"
  | "welcomeBadge"
  | "welcomeTitle"
  | "welcomeMessage"
  | "welcomeInsights"
  | "pageMission"
  | "heroGuideLine"
  | "encouragement"
> {
  const tier = resolveAdminStaffTier(input.rawRole);
  const firstName = firstNameFromDisplay(input.displayName);
  const greeting = getTimeGreeting();
  const { counts } = input;

  const insights: PilotageWelcomeInsight[] = [
    {
      id: "membres",
      label: "Communauté",
      detail: String(counts.totalMembers),
      tone: "muted",
    },
    {
      id: "raids",
      label: "Raids",
      detail: String(counts.raidsPending),
      tone: counts.raidsPending > 0 ? "warning" : "success",
    },
    {
      id: "file",
      label: "Ta file",
      detail: String(counts.tasksInView),
      tone: counts.tasksInView > 0 ? "accent" : "success",
    },
  ];

  switch (tier) {
    case "founder":
      return {
        welcomeKicker: `${firstName} · pilotage serveur · fondateur`,
        welcomeBadge: "Cadre & responsabilité",
        welcomeTitle: `${greeting} ${firstName} — tu portes le rythme de l'entraide`,
        pageMission:
          "Le Discord d'entraide TENF vit grâce à des files tenues, des données justes et une équipe qui assume — ce cockpit te montre où agir.",
        welcomeMessage: [
          `${firstName}, trois mondes ici : le parcours créateur, la modération live et la gouvernance serveur.`,
          counts.raidsPending > 0
            ? `${counts.raidsPending} raid(s) en attente — chaque validation, c'est un membre qui se sent reconnu sur l'entraide.`
            : counts.tasksInView > 0
              ? `${counts.tasksInView} tâche(s) dans ta vue — prends-en une et ferme la boucle aujourd'hui.`
              : "Les signaux critiques sont calmes — moment idéal pour auditer ou préparer la semaine.",
        ].join(" "),
        welcomeInsights: insights,
        heroGuideLine:
          "Onglet Cockpit pour la file, Pouls pour Discord/raids, Événements pour les recaps — tu ne navigues plus à l'aveugle.",
        encouragement: `${firstName}, l'entraide compte sur toi pour tenir le cap — merci de garder ce cockpit vivant et lisible pour toute l'équipe.`,
      };

    case "coordinator":
    case "moderator_senior":
      return {
        welcomeKicker: `${firstName} · pilotage · confirmé(e)`,
        welcomeBadge: "Tu tiens l'équipe",
        welcomeTitle: `${greeting} ${firstName} — pilote l'entraide avec clarté`,
        pageMission: "Relie ce que tu vis sur Discord aux files admin : priorise, assigne, suis jusqu'au bout.",
        welcomeMessage: [
          `${firstName}, KPI, files et graphiques : tout converge ici pour que l'entraide reste accueillante et réactive.`,
          counts.incomplete > 0
            ? `${counts.incomplete} fiche(s) incomplète(s) — la qualité des données protège l'expérience côté créateur.`
            : "Les bases sont solides — concentre-toi sur les files P1.",
        ].join(" "),
        welcomeInsights: insights,
        heroGuideLine: "Assigne-toi sur une ligne de la file — montrer l'exemple responsabilise toute l'équipe staff.",
        encouragement: "Chaque action fermée ici, c'est une promesse tenue envers la communauté.",
      };

    case "moderator_accompaniment":
      return {
        welcomeKicker: `${firstName} · pilotage · accompagnement`,
        welcomeBadge: "Tu peux agir, pas à pas",
        welcomeTitle: `${greeting} ${firstName} — comprends l'état du serveur`,
        pageMission: "Quand l'entraide s'emballe, ce cockpit te dit où regarder avant de répondre.",
        welcomeMessage: [
          `${firstName}, commence par l'onglet Cockpit : raids et validations profil sont souvent la première urgence.`,
          counts.profileValidationPending > 0
            ? `${counts.profileValidationPending} validation(s) profil — chaque oui, c'est un « bienvenue » tangible.`
            : "La file est gérable — bon moment pour explorer le Pouls communauté.",
        ].join(" "),
        welcomeInsights: insights,
        heroGuideLine: "Une tâche à la fois : ouvre, traite, informe sur Discord si besoin — l'équipe est là si tu hésites.",
        encouragement: "Traiter proprement vaut mieux que traiter vite — ta rigueur protège les créateurs.",
      };

    case "moderator_discovery":
      return {
        welcomeKicker: `${firstName} · pilotage · découverte`,
        welcomeBadge: "Observe sans te presser",
        welcomeTitle: `${greeting} ${firstName} — découvre le cockpit staff`,
        pageMission: "Le Discord d'entraide a un moteur admin — cette page te montre comment l'équipe le pilote.",
        welcomeMessage: [
          `${firstName}, explore les trois onglets avec ton référent : Cockpit (files), Pouls (activité), Événements (recaps).`,
          "Aucune urgence ne t'incombe seul·e — c'est un apprentissage, pas un examen.",
        ].join(" "),
        welcomeInsights: insights,
        heroGuideLine: "Note les pastilles KPI et les priorités P1/P2 — tu apprendras le vocabulaire de l'équipe.",
        encouragement: `${firstName}, curiosité et bienveillance : exactement ce qu'on attend du staff d'entraide.`,
      };

    case "moderator_paused":
      return {
        welcomeKicker: `${firstName} · pilotage · pause`,
        welcomeBadge: "Consultation libre",
        welcomeTitle: `${greeting} ${firstName} — parcours sans obligation`,
        pageMission: "Tu peux consulter l'état du serveur sans action attendue.",
        welcomeMessage: "Les files et graphiques expliquent comment l'entraide est pilotée — observe si tu en as envie.",
        welcomeInsights: insights,
        heroGuideLine: "Aucune file ne t'attend — prends le temps qu'il te faut.",
        encouragement: "La communauté sait que tu es en pause — merci de rester en lien si tu le souhaites.",
      };

    case "support":
      return {
        welcomeKicker: `${firstName} · pilotage · soutien`,
        welcomeBadge: "Repérage & orientation",
        welcomeTitle: `${greeting} ${firstName} — vois où l'entraide a besoin d'un coup de main`,
        pageMission: "Oriente les créateurs en sachant ce qui bloque côté admin.",
        welcomeMessage: [
          `${firstName}, les profils incomplets (${counts.incomplete}) et les validations en attente (${counts.profileValidationPending}) sont souvent la source de questions sur Discord.`,
          "Utilise ce cockpit pour répondre avec justesse sur l'entraide.",
        ].join(" "),
        welcomeInsights: insights,
        heroGuideLine: "Hub membres pour une fiche, Cockpit pour une file — deux clics pour une réponse fiable.",
        encouragement: "Ton regard bienveillant sur l'entraide compte autant qu'une action technique.",
      };

    default:
      return {
        welcomeKicker: `${firstName} · pilotage serveur TENF`,
        welcomeBadge: "Staff entraide",
        welcomeTitle: `${greeting} ${firstName} — pilote la communauté`,
        pageMission: "Membres, modération, administration : trois angles pour servir l'entraide Discord.",
        welcomeMessage: [
          `${firstName}, files à traiter, pouls communauté et événements — tout est regroupé ici.`,
          counts.tasksInView > 0 ? `${counts.tasksInView} tâche(s) dans ta vue active.` : "",
        ]
          .filter(Boolean)
          .join(" "),
        welcomeInsights: insights,
        heroGuideLine: "Choisis un onglet, une tâche, et assume-la jusqu'au bout.",
        encouragement: "Une équipe staff responsable, c'est une communauté qui se sent en sécurité.",
      };
  }
}

function buildAsideIntro(tier: AdminStaffTier, firstName: string): string {
  switch (tier) {
    case "founder":
      return `${firstName}, retour au tableau de bord quotidien quand tu veux un rythme plus léger.`;
    case "moderator_discovery":
      return "Vue quotidienne — idéale pour apprendre le rythme staff sans pression.";
    case "moderator_paused":
      return "Consultation libre — aucun raccourci ne t'engage.";
    case "support":
      return "Repère vite où orienter un créateur sur le Discord d'entraide.";
    default:
      return "Vue quotidienne modération et accompagnement — complète ce cockpit étendu.";
  }
}

function buildSections(
  tier: AdminStaffTier,
  firstName: string,
  counts: PilotageKpiCounts
): PilotageCopyModel["sections"] {
  const urgentTotal =
    counts.raidsPending + counts.profileValidationPending + counts.staffApplicationsPending;

  const opsIntroFallback = "File partagée staff — priorité, SLA et assignation selon ta vue enregistrée.";
  const opsIntroByTier: Partial<Record<AdminStaffTier, string>> = {
    founder: `${firstName}, cette file est le battement de cœur de l'entraide — chaque ligne non traitée, c'est un créateur qui attend en silence.`,
    coordinator: "Priorité, SLA, assignation : tu montres l'exemple en prenant une ligne et en la menant jusqu'au bout.",
    moderator_senior: "File partagée modération / admin — filtre selon ton rôle, assigne-toi, informe sur Discord si besoin.",
    moderator_accompaniment: `${firstName}, commence par P1 : une tâche bien fermée vaut mieux que trois entamées. L'équipe est là si tu hésites.`,
    moderator_discovery: "Observe les priorités P1/P2 avec ton référent — pas d'assignation solo sur le sensible pour l'instant.",
    moderator_paused: "Consultation libre : rien ne t'est demandé sur cette file tant que tu es en pause.",
    support: "Repère ce qui bloque côté admin pour orienter les créateurs avec justesse sur le Discord d'entraide.",
  };

  const alertsIntro =
    urgentTotal > 0
      ? `${firstName}, ${urgentTotal} signal(s) critique(s) — derrière chaque chiffre, un membre ou une décision staff en attente.`
      : "Les signaux critiques sont calmes — garde un œil dessus avant la prochaine vague sur l'entraide.";

  return {
    alerts: {
      title: urgentTotal > 0 ? "L'entraide a besoin de toi maintenant" : "Veille active · signaux critiques",
      intro: alertsIntro,
    },
    ops: {
      title: counts.tasksInView > 0 ? "À traiter maintenant — ta responsabilité" : "File calme — consolide ou prépare",
      intro: opsIntroByTier[tier] ?? opsIntroFallback,
      empty:
        tier === "moderator_discovery"
          ? "Rien d'urgent dans cette vue — parfait pour observer le rythme de l'équipe avec ton référent."
          : "Rien d'urgent selon cette vue — bon moment pour relancer une fiche ou préparer la réunion staff.",
      assignHint:
        tier === "moderator_discovery"
          ? "Demande à ton référent avant de t'assigner une ligne sensible."
          : "Assigne-toi, traite, informe sur Discord — la communauté sent quand on suit.",
    },
    vitals: {
      alertsTitle: "Alertes immédiates",
      alertsIntro:
        tier === "support"
          ? "Ce qui génère le plus de questions sur l'entraide — utile pour répondre avec confiance."
          : "Impact direct sur les créateurs ; priorité modération et administration des comptes.",
      agendaTitle: "Prévisions & agenda",
      agendaIntro:
        tier === "founder"
          ? "Ce qui arrive pour les membres et la modération événementielle — anticipe avant que Discord s'emballe."
          : "Ce qui arrive pour les membres et la modération événementielle sur l'entraide.",
      activityTitle: "Activité & raids",
      activityIntro:
        counts.raidsPending > 0
          ? `${counts.raidsPending} raid(s) en attente — l'entraide vit quand on reconnaît chaque passage de relais.`
          : "Le pouls des raids ce mois-ci — reconnaître les efforts, c'est entretenir la confiance.",
    },
    workflow: {
      title: "Workflow mensuel · cadre staff",
      intro:
        tier === "founder"
          ? "Tu tiens le rythme mensuel pour que l'équipe avance sans se disperser — touche une carte pour le détail."
          : "La plupart des étapes concernent l'administration ; certaines sont partagées avec la modération — une carte à la fois.",
      detailHint: "Ouvre la page dédiée et assume l'étape — le serveur d'entraide avance pas à pas.",
    },
    recentActivity: {
      title: "Activité récente (24–48 h)",
      intro: "Ce qui s'est passé sur le site — repère les mouvements avant de répondre sur Discord.",
      empty: "Calme récent — l'entraide respire, profites-en pour consolider.",
    },
    events: {
      title: "Suivi événements · promesses tenues",
      intro:
        tier === "moderator_accompaniment" || tier === "moderator_discovery"
          ? "Inscriptions, présences, taux — chaque événement, c'est une soirée d'entraide promise aux créateurs."
          : "Tableaux recap : vérifie que ce qu'on a annoncé sur Discord correspond à la réalité.",
      loading: "Chargement des recaps événements…",
      empty: "Aucune donnée pour ce filtre — vérifie le mois ou prépare le prochain événement staff.",
    },
  };
}

function buildGuidance(tier: AdminStaffTier, firstName: string): Pick<
  PilotageCopyModel,
  "guidanceKicker" | "guidanceTitle" | "guidanceIntro"
> {
  switch (tier) {
    case "founder":
      return {
        guidanceKicker: "Marche staff · entraide",
        guidanceTitle: `${firstName}, ton rythme sur ce cockpit`,
        guidanceIntro: "Prioriser, comprendre, assumer — le cycle qui maintient l'entraide saine.",
      };
    case "moderator_discovery":
      return {
        guidanceKicker: "Découverte guidée",
        guidanceTitle: "Trois repères pour apprendre",
        guidanceIntro: `${firstName}, parcours ces étapes avec ton référent — pas d'action solo sur le sensible.`,
      };
    default:
      return {
        guidanceKicker: "Marche staff · entraide",
        guidanceTitle: "Ta boussole sur ce cockpit",
        guidanceIntro: `${firstName}, du Discord aux files admin : trois gestes pour rester aligné·e avec l'équipe.`,
      };
  }
}

export function buildPilotageCopyModel(input: BuildPilotageCopyInput): PilotageCopyModel {
  const tier = resolveAdminStaffTier(input.rawRole);
  const firstName = firstNameFromDisplay(input.displayName);
  const welcome = buildWelcome(input);
  const guidance = buildGuidance(tier, firstName);

  return {
    accent: accentForTier(tier),
    tier,
    tierLabel: input.roleLabel || "Staff TENF",
    firstName,
    displayName: input.displayName,
    dateLabel: input.dateLabel,
    ...welcome,
    ...guidance,
    guideSteps: buildGuideSteps(tier, firstName, input.counts),
    pillars: buildPillars(tier),
    kpi: {
      totalMembers: { label: "Membres actifs", hint: "Annuaire TENF" },
      avgCompletion: { label: "Complétude moy.", hint: "Qualité des fiches" },
      raidsPending: { label: "Raids à traiter", hint: "File modération" },
      tasksInView: { label: "Tâches (vue active)", hint: "Selon ton filtre rôle" },
    },
    aside: {
      dashboardLabel: "Tableau de bord staff",
      dashboardIntro: buildAsideIntro(tier, firstName),
      opsTitle: "Pilotage ops",
      toolsTitle: "Outils serveur",
      meetingHint:
        tier === "moderator_discovery"
          ? "Observe qui s'inscrit — tu verras le rythme de l'équipe staff."
          : tier === "founder"
            ? `${firstName}, ta présence à la réunion donne le ton à toute l'entraide.`
            : "Inscris-toi si tu peux — la synchro staff évite les malentendus sur Discord.",
    },
    tabs: {
      cockpit: { label: "Cockpit & actions", desc: "Files, workflow, flux" },
      vitals: { label: "Pouls communauté", desc: "Discord, raids, graphiques" },
      evenements: { label: "Événements", desc: "Recaps & anomalies" },
    },
    sections: buildSections(tier, firstName, input.counts),
  };
}
