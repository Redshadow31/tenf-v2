import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BookOpen,
  Calendar,
  Compass,
  GraduationCap,
  Heart,
  LayoutDashboard,
  Map,
  Shield,
  Sparkles,
  UserCircle,
  Users,
} from "lucide-react";
import { memberSidebarSections, type SidebarNavItem } from "@/lib/navigation/memberSidebar";

export type GuideMemberPageEntry = {
  href: string;
  label: string;
  description: string;
  when?: string;
  /** Connexion Discord requise pour voir tes données personnelles */
  memberAction?: boolean;
  external?: boolean;
  disabled?: boolean;
  disabledHint?: string;
};

export type GuideMemberChapter = {
  id: string;
  slug: string;
  menuLabel: string;
  title: string;
  subtitle: string;
  readTime: string;
  icon: LucideIcon;
  accent: string;
  goal: string;
  intro: string;
  recommendedPath: string[];
  pages: GuideMemberPageEntry[];
  tips: string[];
  faq: { q: string; a: string }[];
};

export const GUIDE_MEMBER_BASE = "/guides/espace-membre";

const PAGE_HELP: Record<string, { description: string; when?: string }> = {
  "/member/dashboard": {
    description:
      "Ton tableau de bord : résumé de l’activité, raccourcis vers les actions du moment et indicateurs clés. C’est la page à ouvrir en premier après connexion.",
    when: "Chaque session membre — pour voir ce qui demande ton attention aujourd’hui.",
  },
  "/member/notifications": {
    description:
      "Centre des nouvelles TENF : annonces, rappels d’événements, messages liés à ton profil ou à la communauté.",
    when: "Tu veux savoir ce qui a changé depuis ta dernière visite (badge non lu sur la sidebar).",
  },
  "/member/profil": {
    description:
      "Ta fiche membre : présentation, jeux, langues, liens Twitch, visibilité dans l’annuaire. Base de ta présence dans le collectif.",
    when: "Après intégration ou quand le staff te demande de mettre à jour ta fiche.",
  },
  "/member/profil/completer": {
    description:
      "Checklist de complétion : indique ce qu’il manque (Twitch, bio, préférences…) pour débloquer toutes les fonctions.",
    when: "Tu vois une alerte « compléter ma fiche » ou tu n’apparais pas correctement dans l’annuaire.",
  },
  "/member/planning": {
    description:
      "Planning de tes créneaux de stream : les autres membres savent quand tu es disponible pour l’entraide et les raids.",
    when: "Tu stream régulièrement et tu veux être visible dans les outils de planning communautaire.",
  },
  "/member/parametres": {
    description:
      "Réglages du compte : notifications, confidentialité, préférences d’affichage liées à ton espace membre.",
    when: "Tu veux ajuster comment TENF te contacte ou s’affiche pour toi.",
  },
  "/membres": {
    description:
      "Annuaire public des membres (même liste que sur le site public) — pratique depuis l’espace membre pour retrouver un pseudo.",
    when: "Tu cherches un membre pour un raid ou une collaboration.",
  },
  "/lives": {
    description: "Qui est en live parmi les membres TENF en ce moment, avec lien direct vers Twitch.",
    when: "Tu veux rejoindre un stream tout de suite.",
  },
  "/decouvrir-createurs": {
    description: "Clips et créateurs à découvrir — format court pour repérer de nouvelles chaînes du collectif.",
    when: "Tu veux élargir ton réseau de viewing avant de raid.",
  },
  "/member/raids/historique": {
    description:
      "Historique de tes raids (détectés via Twitch), statuts de validation, pilotage mensuel, tendances sur 12 mois et suggestions de retours.",
    when: "Tu veux vérifier qu’un raid a été compté, suivre ton rythme ou préparer un bilan.",
  },
  "/member/raids/declarer": {
    description:
      "Formulaire de secours si un raid Twitch n'apparaît pas dans ton historique — copy personnalisée, repères entraide et suivi des dossiers.",
    when: "Uniquement après avoir vérifié Mes raids et laissé quelques heures à la détection auto.",
  },
  "/member/engagement/a-decouvrir": {
    description: "Suggestions de chaînes membres à découvrir selon tes critères et l’activité du collectif.",
    when: "Tu cherches de nouveaux créateurs à suivre sans parcourir tout l’annuaire.",
  },
  "/member/engagement/amis": {
    description: "Liste de tes amis / membres suivis dans TENF pour un accès rapide à leurs profils et lives.",
    when: "Tu veux centraliser les créateurs avec qui tu interagis le plus.",
  },
  "/member/engagement/discord-activite": {
    description:
      "Ta présence sur le Discord TENF (messages et vocal) : repères personnalisés, graphiques mensuels et conseils pour nourrir l'entraide entre les streams.",
    when: "Tu veux voir ta trace sur le serveur ou comprendre pourquoi le Discord compte pour la commu.",
  },
  "/member/evenements": {
    description: "Agenda des événements TENF : dates, descriptions, accès à l’inscription depuis ton espace.",
    when: "Tu planifies ta semaine ou tu cherches un event auquel participer.",
  },
  "/member/evenements/inscriptions": {
    description: "Liste des événements auxquels tu es inscrit·e — statut, horaires, liens utiles.",
    when: "Tu veux confirmer tes inscriptions ou te préparer avant un créneau.",
  },
  "/member/evenements/presences": {
    description: "Historique de tes présences aux événements TENF — utile pour le suivi staff et ta régularité.",
    when: "Après un event, pour vérifier que ta participation a été prise en compte.",
  },
  "/member/engagement/score": {
    description:
      "Score d’engagement : synthèse de ta participation (raids, events, activité…) sur la période en cours.",
    when: "Tu veux une vue chiffrée de ton implication dans le collectif.",
  },
  "/member/objectifs": {
    description: "Objectifs du mois fixés par TENF ou par toi : défis, jalons, progression à court terme.",
    when: "Début de mois ou quand tu veux structurer ta participation.",
  },
  "/member/progression": {
    description: "Vue sur ta progression dans le parcours membre TENF (paliers, étapes validées).",
    when: "Tu veux voir où tu en es dans l’évolution au sein du collectif.",
  },
  "/member/activite": {
    description:
      "Ton radar mensuel TENF : intensité ludique, raids hub, présences événements, formations et tendance — avec un ton bienveillant, sans pression.",
    when: "Bilan rapide « qu’est-ce que j’ai fait ce mois-ci ? » ou pour te situer avant de fixer des objectifs.",
  },
  "/member/activite/historique": {
    description: "Archives des mois passés : compare ton activité dans le temps.",
    when: "Tu veux un retour arrière au-delà du mois courant.",
  },
  "/member/academy": {
    description: "Présentation du programme Academy TENF — parcours structuré pour progresser en streaming.",
    when: "Fonctionnalité en déploiement : consulte la page pour l’état actuel (peut être marquée « Bientôt »).",
  },
  "/member/academy/postuler": {
    description: "Candidature pour intégrer une promotion Academy quand les vagues sont ouvertes.",
    when: "Une campagne Academy est annoncée et tu es éligible.",
  },
  "/member/academy/parcours": {
    description: "Suivi de ton parcours Academy une fois accepté·e dans une promotion.",
    when: "Tu participes activement à une vague Academy.",
  },
  "/member/formations": {
    description:
      "Catalogue formations TENF : sessions à venir (inscription, calendrier), archive thématique et signalement d'intérêt — hero personnalisé et repères Academy sans pression.",
    when: "Tu cherches une session live, un thème déjà animé à relancer, ou tu veux proposer un sujet à l'équipe.",
  },
  "/member/formations/validees": {
    description:
      "Historique des formations validées : objectif du mois, paliers ludiques, tendance sur 6 mois et liste des présences enregistrées — sans pression ni classement.",
    when: "Tu veux voir ce que tu as déjà suivi, comparer avec ton objectif mensuel ou célébrer ta progression.",
  },
  "/member/evaluations": {
    description: "Ton évaluation en cours ou à venir : retour du staff sur ta participation et tes axes de progrès.",
    when: "Tu es dans un cycle d’évaluation ou tu attends un feedback officiel.",
  },
  "/member/evaluations/historique": {
    description: "Historique des évaluations passées — voir l’évolution des retours dans le temps.",
    when: "Tu prépares un entretien ou tu veux mesurer ta progression sur plusieurs mois.",
  },
  "/charte": {
    description: "Charte communautaire TENF (page publique) — rappel des règles de respect et d’entraide.",
    when: "Tu as un doute sur un comportement ou avant une situation délicate en stream / Discord.",
  },
  "/fonctionnement-tenf/faq": {
    description: "FAQ générale du fonctionnement TENF — questions courantes hors outil membre.",
    when: "Tu cherches une réponse rapide sans ouvrir un ticket.",
  },
  "/contact": {
    description: "Formulaire de contact staff pour les demandes qui ne passent pas par Discord.",
    when: "Sujet sensible, presse, ou besoin d’un écrit officiel.",
  },
  "/partenariats": {
    description: "Informations et demandes de partenariat avec TENF.",
    when: "Tu représentes une marque ou un projet externe.",
  },
  "/postuler": {
    description: "Candidature pour rejoindre l’équipe bénévole TENF (staff).",
    when: "Tu veux contribuer au projet au-delà du rôle « membre streamer ».",
  },
};

function itemToPage(item: SidebarNavItem): GuideMemberPageEntry {
  const help = PAGE_HELP[item.href];
  return {
    href: item.href,
    label: item.label,
    description:
      help?.description ??
      `Entrée du menu « ${item.label} » dans l’espace membre. Ouvre la page pour voir le détail à jour.`,
    when: help?.when ?? "Quand tu navigues via la barre latérale membre (desktop) ou le menu Compte (mobile).",
    memberAction: !item.external && item.href.startsWith("/member"),
    external: item.external,
    disabled: item.disabled,
    disabledHint: item.disabledHint,
  };
}

const CHAPTER_META: Record<
  string,
  {
    slug: string;
    menuLabel: string;
    title: string;
    subtitle: string;
    readTime: string;
    icon: LucideIcon;
    accent: string;
    goal: string;
    intro: string;
    recommendedPath: string[];
    tips: string[];
    faq: { q: string; a: string }[];
  }
> = {
  home: {
    slug: "accueil",
    menuLabel: "Accueil",
    title: "Accueil & nouvelles",
    subtitle: "Tableau de bord et notifications — par où commencer chaque visite dans l’espace membre.",
    readTime: "5 min",
    icon: LayoutDashboard,
    accent: "#6366f1",
    goal: "Tu viens de te connecter et tu veux savoir quoi regarder en premier dans l’espace membre.",
    recommendedPath: ["Tableau de bord", "Mes nouvelles", "Mon profil"],
    intro:
      "Le bloc **Accueil** de la barre latérale est ton **point d’entrée quotidien**. Le tableau de bord résume l’essentiel ; les nouvelles te signalent ce qui a changé. Commence ici avant d’explorer raids, events ou formations.",
    tips: [
      "Rituel utile : **Tableau de bord** → **Mes nouvelles** → puis la section du jour (events ou raids).",
      "Si tu n’as que 2 minutes, le dashboard suffit pour ne rien manquer d’urgent.",
    ],
    faq: [
      {
        q: "Le dashboard remplace-t-il les notifications ?",
        a: "Non. Le dashboard synthétise ; les nouvelles détaillent chaque alerte. Consulte les deux si tu reviens après une absence.",
      },
    ],
  },
  me: {
    slug: "moi",
    menuLabel: "Moi sur TENF",
    title: "Mon profil & paramètres",
    subtitle: "Fiche, complétion, planning de live et réglages — tout ce qui te représente dans le collectif.",
    readTime: "10 min",
    icon: UserCircle,
    accent: "#8b5cf6",
    goal: "Tu veux que ton profil soit à jour et que les autres membres (et le staff) te trouvent facilement.",
    recommendedPath: ["Mon profil", "Compléter ma fiche", "Mon planning de live", "Paramètres"],
    intro:
      "**Moi sur TENF** regroupe tout ce qui est **personnel** : qui tu es sur la plateforme, quand tu stream, comment tu configures ton compte. Un profil complet améliore les matchings, la visibilité et les invitations aux events.",
    tips: [
      "Fais **Compléter ma fiche** en priorité si tu viens d’être intégré·e.",
      "Le **planning** aide les autres à raid au bon moment — même quelques créneaux suffisent.",
      "Les **paramètres** contrôlent les notifications : ajuste-les si tu es submergé·e d’alertes.",
    ],
    faq: [
      {
        q: "Pourquoi ma fiche n’apparaît pas dans l’annuaire ?",
        a: "Vérifie la complétion du profil, la liaison Twitch et les options de visibilité. La page « Compléter ma fiche » liste souvent ce qui bloque.",
      },
    ],
  },
  community: {
    slug: "communaute",
    menuLabel: "Communauté & entraide",
    title: "Communauté & entraide",
    subtitle: "Annuaire, lives, raids, amis et Discord — les outils pour connecter avec les autres créateurs.",
    readTime: "15 min",
    icon: Users,
    accent: "#f59e0b",
    goal: "Tu veux participer à l’entraide : raids, découvrir des chaînes, suivre l’activité des autres membres.",
    recommendedPath: ["Signaler un raid", "Mes raids", "Lives en cours", "Mes amis"],
    intro:
      "C’est le cœur **social** de TENF. Tu y déclares tes raids, consultes ton historique, trouves qui est en live et gères ton réseau d’amis. Pense à déclarer tes raids après chaque session d’entraide — c’est ce qui alimente le score et la reconnaissance collective.",
    tips: [
      "Après un raid : passe par **Signaler un raid** le jour même.",
      "Combine **Lives en cours** (maintenant) et **À découvrir** (nouvelles chaînes).",
      "Le lien **Discord TENF** ouvre le serveur — l’activité Discord est aussi visible dans l’outil dédié.",
    ],
    faq: [
      {
        q: "Oublier de déclarer un raid, est-ce grave ?",
        a: "Déclare dès que possible via l’historique ou le formulaire. Plus c’est tôt, plus le suivi est fiable pour toi et pour la communauté.",
      },
      {
        q: "Différence entre annuaire public et outils /member ?",
        a: "L’annuaire (/membres) est la vitrine publique. Les pages /member/raids/* et /member/engagement/* sont tes données personnelles d’entraide.",
      },
    ],
  },
  activity: {
    slug: "activite",
    menuLabel: "Activité du mois",
    title: "Activité du mois",
    subtitle: "Événements, inscriptions, score, objectifs et historiques — le fil de ta participation sur la période.",
    readTime: "12 min",
    icon: Calendar,
    accent: "#14b8a6",
    goal: "Tu veux t’organiser sur le mois : events, présences, objectifs et bilan d’activité.",
    recommendedPath: ["Agenda TENF", "Mes inscriptions", "Objectifs du mois", "Mon score d’engagement"],
    intro:
      "Ce bloc suit **ton mois en cours** : ce à quoi tu t’inscris, où tu étais présent·e, tes objectifs et ton score. Idéal en début de mois pour planifier, et en fin de mois pour faire le point.",
    tips: [
      "Avant un event : **Agenda** → **Mes inscriptions**.",
      "Après un event : vérifie **Mes présences**.",
      "**Objectifs** + **Score** donnent une vue motivante sur ta régularité.",
    ],
    faq: [
      {
        q: "Je ne vois pas un event auquel je pensais m’inscrire",
        a: "Vérifie l’agenda TENF et tes inscriptions. Les créneaux peuvent être complets ou la date passée.",
      },
    ],
  },
  learning: {
    slug: "parcours-tenf",
    menuLabel: "Parcours TENF",
    title: "Formations & progression",
    subtitle: "Academy, catalogue de formations, évaluations — le cadre pour progresser en tant que streamer.",
    readTime: "12 min",
    icon: GraduationCap,
    accent: "#22c55e",
    goal: "Tu veux te former, suivre un parcours Academy ou comprendre les évaluations TENF.",
    recommendedPath: ["Explorer les formations", "Mes formations terminées", "Mon évaluation"],
    intro:
      "**Parcours TENF** regroupe l’apprentissage structuré. Academy (selon les vagues ouvertes), le catalogue de formations en autonomie, et les évaluations pour le feedback officiel. Certaines entrées Academy peuvent être marquées « Bientôt » selon les déploiements.",
    tips: [
      "Commence par le **catalogue** si tu veux apprendre tout de suite sans attendre Academy.",
      "Consulte **Formations terminées** pour ne pas refaire un module déjà validé.",
      "Les **évaluations** arrivent par cycles : surveille les nouvelles du dashboard.",
    ],
    faq: [
      {
        q: "Academy est grisée / « Bientôt »",
        a: "La fonctionnalité est en cours de déploiement. Utilise le catalogue formations et les annonces TENF pour les ouvertures de vagues.",
      },
    ],
  },
  support: {
    slug: "aide",
    menuLabel: "Aide & repères",
    title: "Aide & repères",
    subtitle: "Charte, FAQ, contact staff, partenariats et candidature équipe — quand tu as besoin d’aide ou de cadre.",
    readTime: "8 min",
    icon: Shield,
    accent: "#64748b",
    goal: "Tu as une question, un litige ou tu cherches les règles / contacts officiels.",
    recommendedPath: ["FAQ", "Charte TENF", "Contacter le staff"],
    intro:
      "Ce bloc mélange **pages publiques** (charte, FAQ) et **démarches** (contact, postuler au staff). Utile quand tu n’es pas sûr·e de la bonne marche à suivre avant d’ouvrir un ticket Discord.",
    tips: [
      "Conflit ou comportement : **Charte** d’abord, puis ticket ou contact staff.",
      "Question technique sur le site : **FAQ** puis salon d’aide Discord.",
    ],
    faq: [
      {
        q: "Dois-je être connecté·e pour lire la charte depuis ici ?",
        a: "Non pour la lecture. La connexion Discord est nécessaire pour les pages /member/* personnelles.",
      },
    ],
  },
};

export const guideMemberChapters: GuideMemberChapter[] = memberSidebarSections.map((section) => {
  const meta = CHAPTER_META[section.id];
  const pages = section.items.filter((i) => !i.adminOnly).map(itemToPage);
  return {
    id: section.id,
    slug: meta.slug,
    menuLabel: meta.menuLabel,
    title: meta.title,
    subtitle: meta.subtitle,
    readTime: meta.readTime,
    icon: meta.icon,
    accent: meta.accent,
    goal: meta.goal,
    intro: meta.intro,
    recommendedPath: meta.recommendedPath,
    pages,
    tips: meta.tips,
    faq: meta.faq,
  };
});

export const hubQuickStart = [
  {
    step: 1,
    title: "Connecte-toi avec Discord",
    body: "Sans session Discord, les liens /member/* ne montrent pas tes données. Utilise le bouton de connexion si tu es redirigé·e.",
  },
  {
    step: 2,
    title: "Choisis ton profil membre",
    body: "Débutant, participant actif ou progression : les cartes t’orientent vers le bon bloc du menu latéral.",
  },
  {
    step: 3,
    title: "Ouvre les pages depuis le guide",
    body: "Chaque carte explique l’écran et quand l’utiliser — le bouton t’envoie sur la vraie page membre.",
  },
] as const;

export type HubMemberPersona = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  accent: string;
};

export const hubMemberPersonas: HubMemberPersona[] = [
  {
    id: "debuter",
    emoji: "🧭",
    title: "Je débute sur l’espace membre",
    description: "Première connexion : je veux un fil rouge clair entre dashboard, profil et notifications.",
    href: `${GUIDE_MEMBER_BASE}/accueil`,
    cta: "Chapitre Accueil",
    accent: "#6366f1",
  },
  {
    id: "participer",
    emoji: "⚡",
    title: "Je participe (raids & events)",
    description: "Je veux m’inscrire aux events, déclarer mes raids et suivre mon score.",
    href: `${GUIDE_MEMBER_BASE}/communaute`,
    cta: "Communauté & entraide",
    accent: "#f59e0b",
  },
  {
    id: "progresser",
    emoji: "🎓",
    title: "Je progresse (formations)",
    description: "Formations, objectifs du mois, évaluations et paramètres avancés.",
    href: `${GUIDE_MEMBER_BASE}/parcours-tenf`,
    cta: "Parcours TENF",
    accent: "#22c55e",
  },
  {
    id: "carte",
    emoji: "🗺️",
    title: "Je cherche une page précise",
    description: "Je connais le menu latéral et je veux la liste complète par section.",
    href: `${GUIDE_MEMBER_BASE}/moi`,
    cta: "Parcourir les chapitres",
    accent: "#8b5cf6",
  },
];

export const guideMemberParcoursSteps = [
  {
    id: "connexion",
    title: "Connexion Discord",
    duration: "1 min",
    body: "Connecte-toi via Discord : c’est la clé d’accès à tout l’espace /member/. Garde cette page guide ouverte pour la suite.",
    links: [{ href: "/auth/login", label: "Connexion" }],
    chapterSlug: "accueil",
  },
  {
    id: "dashboard",
    title: "Premier tour du dashboard",
    duration: "5 min",
    body: "Ouvre le tableau de bord et les nouvelles. Note les alertes (profil incomplet, event à venir…) et clique sur ce qui est prioritaire.",
    links: [
      { href: "/member/dashboard", label: "Dashboard" },
      { href: "/member/notifications", label: "Nouvelles" },
    ],
    chapterSlug: "accueil",
  },
  {
    id: "profil",
    title: "Stabiliser profil & planning",
    duration: "10 min",
    body: "Complète ta fiche, vérifie Twitch, ajoute des créneaux au planning. Tu seras visible et « prêt·e » pour l’entraide.",
    links: [
      { href: "/member/profil/completer", label: "Compléter ma fiche" },
      { href: "/member/planning", label: "Planning" },
    ],
    chapterSlug: "moi",
  },
  {
    id: "suite",
    title: "Aller plus loin",
    duration: "Variable",
    body: "Selon ton objectif : raids/events (Communauté + Activité) ou formations (Parcours TENF). Le guide pas à pas sous /rejoindre reste utile écran par écran.",
    links: [
      { href: "/rejoindre/guide-espace-membre", label: "Guide pas à pas" },
      { href: "/guides/partie-publique", label: "Guide site public" },
    ],
    chapterSlug: "communaute",
  },
];

export const hubMemberFaq = [
  {
    q: "Faut-il être connecté·e pour lire ce guide ?",
    a: "Non pour lire ce guide. Oui pour voir tes données sur les liens /member/* (dashboard, raids, inscriptions…).",
  },
  {
    q: "Différence avec /rejoindre/guide-espace-membre ?",
    a: "Ce guide = carte alignée sur le menu latéral réel (où cliquer, quand). Le guide Rejoindre = tutoriel linéaire écran par écran pour la première prise en main.",
  },
  {
    q: "Où est le menu sur mobile ?",
    a: "Dans l’espace membre, ouvre le menu « Compte » : tu y retrouves les mêmes entrées que la sidebar desktop.",
  },
  {
    q: "Je suis staff : où sont les outils admin ?",
    a: "Les liens /admin/* apparaissent dans ta sidebar uniquement si ton compte a les droits. Ils ne sont pas détaillés dans ce guide membre.",
  },
  {
    q: "Une entrée est grisée « Bientôt »",
    a: "La fonctionnalité n’est pas encore active pour tous. Surveille les nouvelles TENF ou le changelog pour l’ouverture.",
  },
];

export const relatedMemberGuides = [
  {
    href: "/rejoindre/guide-espace-membre",
    label: "Guide pas à pas (Rejoindre)",
    description: "Première connexion, écrans détaillés, FAQ membre linéaire.",
    icon: BookOpen,
    color: "#a78bfa",
  },
  {
    href: "/guides/partie-publique",
    label: "Guide site public",
    description: "Toutes les pages accessibles sans connexion.",
    icon: Map,
    color: "#22d3ee",
  },
  {
    href: "/guides/tenf",
    label: "Guide nouveau membre",
    description: "Culture TENF : Spotlights, entraide, rituels.",
    icon: Heart,
    color: "#fb7185",
  },
  {
    href: "/rejoindre/guide-public",
    label: "Guide Discord / Twitch",
    description: "Activer le compte et lier sa chaîne.",
    icon: Sparkles,
    color: "#f472b6",
  },
  {
    href: "/fonctionnement-tenf/decouvrir",
    label: "Fonctionnement TENF",
    description: "Règles et vision du collectif.",
    icon: Compass,
    color: "#fb923c",
  },
] as const;

export const memberChecklist = [
  { id: "dash", label: "Ouvrir le tableau de bord", href: "/member/dashboard" },
  { id: "notif", label: "Lire tes nouvelles", href: "/member/notifications" },
  { id: "profil", label: "Compléter / vérifier ton profil", href: "/member/profil/completer" },
  { id: "events", label: "Consulter l’agenda des événements", href: "/member/evenements" },
  { id: "raids", label: "Soutenir un membre en live", href: "/lives" },
  { id: "objectifs", label: "Regarder tes objectifs du mois", href: "/member/objectifs" },
];

export function getGuideMemberStats() {
  const menuPages = guideMemberChapters.reduce((n, c) => n + c.pages.length, 0);
  return {
    chapters: guideMemberChapters.length,
    menuPages,
    sections: guideMemberChapters.length,
  };
}

export function getMemberChapterBySlug(slug: string): GuideMemberChapter | undefined {
  return guideMemberChapters.find((c) => c.slug === slug);
}

export function getMemberChapterNavIndex(slug: string): number {
  return guideMemberChapters.findIndex((c) => c.slug === slug);
}
