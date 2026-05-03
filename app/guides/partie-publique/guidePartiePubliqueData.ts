import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  HeartHandshake,
  LayoutGrid,
  Megaphone,
  Sparkles,
  Store,
  UserPlus,
  Users,
} from "lucide-react";

export type MenuZone = {
  id: string;
  titre: string;
  href: string;
  court: string;
  detail: string;
  sousPages: { href: string; label: string }[];
  icon: LucideIcon;
  accent: string;
};

export const menuZones: MenuZone[] = [
  {
    id: "boutique",
    titre: "Boutique",
    href: "/boutique",
    court: "Soutenir TENF avec des produits dérivés ou goodies.",
    detail:
      "La vitrine matérielle de la communauté : idées cadeaux, visibilité sur le projet, et manière concrète d’aider au-delà du live.",
    sousPages: [{ href: "/boutique", label: "Boutique principale" }],
    icon: Store,
    accent: "#f472b6",
  },
  {
    id: "communaute",
    titre: "La communauté",
    href: "/a-propos",
    court: "Histoire, valeurs, staff et transparence.",
    detail:
      "Comprendre qui porte TENF, comment les décisions sont expliquées, et ce que « entraide streamers » veut dire chez nous.",
    sousPages: [
      { href: "/a-propos", label: "À propos" },
      { href: "/fonctionnement-tenf/decouvrir", label: "Fonctionnement TENF" },
      { href: "/avis-tenf", label: "Témoignages" },
      { href: "/upa-event", label: "UPA Event" },
      { href: "/organisation-staff", label: "Organisation du staff" },
      { href: "/organisation-staff/organigramme", label: "Organigramme interactif" },
    ],
    icon: HeartHandshake,
    accent: "#a78bfa",
  },
  {
    id: "createurs",
    titre: "Découvrir les créateurs",
    href: "/membres",
    court: "Annuaire, clips, interviews et planning des lives.",
    detail:
      "Le cœur « vitrine » : trouver des chaînes à suivre, voir des extraits choisis, et ne pas rater les créneaux importants.",
    sousPages: [
      { href: "/membres", label: "Membres" },
      { href: "/decouvrir-createurs", label: "Clips à découvrir" },
      { href: "/interviews", label: "Interviews TENF" },
      { href: "/lives", label: "Lives" },
      { href: "/lives/calendrier", label: "Calendrier des lives" },
    ],
    icon: Users,
    accent: "#38bdf8",
  },
  {
    id: "evenements",
    titre: "Événements",
    href: "/events2",
    court: "Calendrier, soirées communautaires et Aventura.",
    detail:
      "Tout ce qui se joue à plusieurs : dates, formats, et parcours type « grande aventure » New Family.",
    sousPages: [
      { href: "/events2", label: "Calendrier / événements" },
      { href: "/evenements-communautaires", label: "Événements communautaires" },
      { href: "/new-family-aventura", label: "New Family Aventura" },
    ],
    icon: CalendarDays,
    accent: "#34d399",
  },
  {
    id: "rejoindre",
    titre: "Rejoindre TENF",
    href: "/rejoindre",
    court: "Intégration, guides, FAQ et soutien financier.",
    detail:
      "Le couloir d’entrée : comprendre les étapes, réserver une session, lire les guides, ou soutenir le projet.",
    sousPages: [
      { href: "/integration", label: "Intégration" },
      { href: "/rejoindre/guide-integration", label: "Guide d’intégration" },
      { href: "/rejoindre/guide-public", label: "Guide public" },
      { href: "/rejoindre/guide-espace-membre", label: "Guide espace membre" },
      { href: "/rejoindre/faq", label: "FAQ rejoindre" },
      { href: "/soutenir-tenf", label: "Soutenir TENF" },
    ],
    icon: UserPlus,
    accent: "#c084fc",
  },
];

export type PersonaId = "decouvrir" | "vitrine" | "rejoindre";

export type Persona = {
  id: PersonaId;
  titre: string;
  emoji: string;
  accroche: string;
  conseil: string;
  liens: { href: string; label: string; hint?: string }[];
  /** Dégradé de fond (carte) — évite les classes Tailwind dynamiques (purge). */
  cardGradient: string;
  /** Anneau sélectionné (box-shadow). */
  selectedRing: string;
};

export const personas: Persona[] = [
  {
    id: "decouvrir",
    titre: "Je découvre TENF",
    emoji: "✨",
    accroche: "Tu veux comprendre les règles du jeu avant de t’engager.",
    conseil: "Enchaîne : À propos → Fonctionnement → FAQ. Prends 10 minutes, tu verras si l’ADN colle.",
    liens: [
      { href: "/a-propos", label: "À propos de TENF" },
      { href: "/fonctionnement-tenf/decouvrir", label: "Fonctionnement (découvrir)" },
      { href: "/fonctionnement-tenf/faq", label: "FAQ fonctionnement" },
      { href: "/avis-tenf", label: "Témoignages membres" },
    ],
    cardGradient: "linear-gradient(135deg, rgba(6,182,212,0.28) 0%, rgba(14,165,233,0.1) 42%, transparent 72%)",
    selectedRing: "0 0 0 2px rgba(34, 211, 238, 0.55), 0 16px 40px rgba(6, 182, 212, 0.18)",
  },
  {
    id: "vitrine",
    titre: "J’explore les créateurs",
    emoji: "🎬",
    accroche: "Tu cherches des chaînes, des clips, ou un créneau live.",
    conseil: "Commence par l’annuaire, puis clips ou calendrier selon que tu veux du « qui » ou du « quand ».",
    liens: [
      { href: "/membres", label: "Annuaire des membres" },
      { href: "/decouvrir-createurs", label: "Clips à découvrir" },
      { href: "/interviews", label: "Interviews" },
      { href: "/lives/calendrier", label: "Calendrier des lives" },
    ],
    cardGradient: "linear-gradient(135deg, rgba(217,70,239,0.26) 0%, rgba(139,92,246,0.12) 45%, transparent 72%)",
    selectedRing: "0 0 0 2px rgba(232, 121, 249, 0.55), 0 16px 40px rgba(168, 85, 247, 0.16)",
  },
  {
    id: "rejoindre",
    titre: "Je veux rejoindre / m’intégrer",
    emoji: "🚪",
    accroche: "Tu es prêt·e à passer le cap ou à booker une session.",
    conseil: "Le hub Rejoindre centralise FAQ et guides ; l’intégration affiche le calendrier des créneaux.",
    liens: [
      { href: "/rejoindre", label: "Hub Rejoindre TENF" },
      { href: "/rejoindre/guide-public", label: "Guide public (Discord, Twitch)" },
      { href: "/integration", label: "Calendrier d’intégration" },
      { href: "/rejoindre/faq", label: "FAQ comment rejoindre" },
    ],
    cardGradient: "linear-gradient(135deg, rgba(139,92,246,0.28) 0%, rgba(99,102,241,0.12) 45%, transparent 72%)",
    selectedRing: "0 0 0 2px rgba(167, 139, 250, 0.55), 0 16px 40px rgba(124, 58, 237, 0.18)",
  },
];

export type ParcoursEtape = {
  id: string;
  titre: string;
  duree: string;
  description: string;
  liens: { href: string; label: string }[];
};

export const parcoursEtapes: ParcoursEtape[] = [
  {
    id: "carte",
    titre: "Lire la carte du site",
    duree: "2 min",
    description: "Repère où vivent les contenus publics : communauté, créateurs, événements, rejoindre.",
    liens: [{ href: "#carte-menu", label: "Aller à la carte du menu" }],
  },
  {
    id: "preuve",
    titre: "Voir la communauté en action",
    duree: "10–20 min",
    description: "Témoignages, interviews et clips donnent une preuve sociale plus forte que n’importe quelle landing.",
    liens: [
      { href: "/avis-tenf", label: "Témoignages" },
      { href: "/interviews", label: "Interviews" },
    ],
  },
  {
    id: "calendrier",
    titre: "Synchroniser avec les lives / events",
    duree: "5 min",
    description: "Ajoute mentalement une étape « calendrier » pour ne pas rater ce qui t’intéresse.",
    liens: [
      { href: "/lives/calendrier", label: "Calendrier des lives" },
      { href: "/events2", label: "Calendrier événements" },
    ],
  },
  {
    id: "suite",
    titre: "Choisir la suite : rester spectateur·rice ou passer membre",
    duree: "variable",
    description: "La partie publique s’arrête là où ton compte Discord ouvre l’espace perso (dashboard, raids, inscriptions…).",
    liens: [
      { href: "/rejoindre/guide-espace-membre", label: "Lire le guide espace membre (public)" },
      { href: "/auth/login", label: "Se connecter avec Discord" },
    ],
  },
];

export type FaqItem = { id: string; q: string; a: string };

export const faqItems: FaqItem[] = [
  {
    id: "sans-compte",
    q: "Que puis-je faire sans compte ?",
    a: "Consulter les pages vitrine : présentation, annuaire, lives, événements, guides en lecture seule, boutique, soutien, etc. Les actions liées à ton profil (inscription raid, fiche perso) demandent la connexion.",
  },
  {
    id: "difference",
    q: "Quelle différence entre « guide public » et cette page ?",
    a: "Le guide public est un tutoriel pas à pas (Discord, Twitch, FAQ). Ici, on décrit la carte du site : où cliquer dans le menu, et quels parcours selon ton intention.",
  },
  {
    id: "membre",
    q: "Je suis déjà membre : cette page me sert encore ?",
    a: "Oui, pour partager un lien « grand public » à quelqu’un qui découvre TENF, ou pour retrouver rapidement une URL sans passer par le menu.",
  },
  {
    id: "academy",
    q: "L’Academy est-elle entièrement publique ?",
    a: "Les pages promotion et certaines ressources sont ouvertes ; selon les périodes, certains formulaires ou espaces peuvent exiger d’être connecté.",
  },
];

export type ChecklistItem = { id: string; label: string; href?: string };

export const checklistItems: ChecklistItem[] = [
  { id: "apropos", label: "Lire la page À propos", href: "/a-propos" },
  { id: "fonctionnement", label: "Parcourir le fonctionnement TENF", href: "/fonctionnement-tenf/decouvrir" },
  { id: "membres", label: "Ouvrir l’annuaire des membres", href: "/membres" },
  { id: "lives", label: "Consulter le calendrier des lives", href: "/lives/calendrier" },
  { id: "events", label: "Voir le calendrier des événements", href: "/events2" },
  { id: "rejoindre", label: "Lire le hub Rejoindre / FAQ", href: "/rejoindre" },
];

export const extraRessources = [
  {
    titre: "Guide public (parcours)",
    href: "/rejoindre/guide-public",
    description: "Création de compte, liaison Twitch, FAQ avant d’être actif·ve.",
    icon: BookOpen,
    color: "#22d3ee",
  },
  {
    titre: "Guide espace membre",
    href: "/rejoindre/guide-espace-membre",
    description: "Pages pédagogiques sur le tableau de bord, les raids, les réglages — lisibles sans connexion.",
    icon: LayoutGrid,
    color: "#a78bfa",
  },
  {
    titre: "Academy",
    href: "/academy",
    description: "Formations et promotions ; certaines actions peuvent demander une session.",
    icon: GraduationCap,
    color: "#fb923c",
  },
  {
    titre: "VIP · Soutenir · Postuler",
    href: "/vip",
    description: "Contenus VIP, soutien au projet, candidatures staff ou bénévolat.",
    icon: Megaphone,
    color: "#f472b6",
  },
] as const;
