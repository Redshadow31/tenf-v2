import { memberSidebarSections } from "@/lib/navigation/memberSidebar";
import type { LucideIcon } from "lucide-react";
import { BookOpen, Compass, Heart, LayoutGrid, Map, Sparkles } from "lucide-react";

export type PersonaId = "debuter" | "participer" | "progresser";

export type Persona = {
  id: PersonaId;
  titre: string;
  emoji: string;
  accroche: string;
  conseil: string;
  liens: { href: string; label: string }[];
  cardGradient: string;
  selectedRing: string;
};

export const personas: Persona[] = [
  {
    id: "debuter",
    titre: "Je débute sur l’espace membre",
    emoji: "🧭",
    accroche: "Première connexion Discord : tu veux un fil rouge clair.",
    conseil:
      "Passe par le tableau de bord, complète ton profil si demandé, puis jette un œil à l’agenda et aux notifications. Le guide pédagogique détaille chaque écran.",
    liens: [
      { href: "/member/dashboard", label: "Tableau de bord" },
      { href: "/member/profil/completer", label: "Compléter mon profil" },
      { href: "/member/notifications", label: "Tes nouvelles" },
      { href: "/rejoindre/guide-espace-membre", label: "Guide espace membre (pas à pas)" },
    ],
    cardGradient: "linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(129,140,248,0.12) 45%, transparent 72%)",
    selectedRing: "0 0 0 2px rgba(165, 180, 252, 0.55), 0 16px 40px rgba(99, 102, 241, 0.2)",
  },
  {
    id: "participer",
    titre: "Je participe (raids & événements)",
    emoji: "⚡",
    accroche: "Tu veux t’inscrire, déclarer des raids et suivre tes présences.",
    conseil:
      "Enchaîne inscriptions → présences pour les events, et historique / déclaration pour les raids. L’engagement et le score donnent du contexte sur ta régularité.",
    liens: [
      { href: "/member/evenements/inscriptions", label: "Mes inscriptions" },
      { href: "/member/evenements/presences", label: "Mes présences" },
      { href: "/member/raids/declarer", label: "Signaler un raid" },
      { href: "/member/raids/historique", label: "Historique des raids" },
      { href: "/member/engagement/score", label: "Mon score d’engagement" },
    ],
    cardGradient: "linear-gradient(135deg, rgba(245,158,11,0.28) 0%, rgba(251,191,36,0.1) 45%, transparent 72%)",
    selectedRing: "0 0 0 2px rgba(252, 211, 77, 0.55), 0 16px 40px rgba(245, 158, 11, 0.18)",
  },
  {
    id: "progresser",
    titre: "Je progresse (objectifs & Academy)",
    emoji: "🎓",
    accroche: "Formations, objectifs du mois, évaluations et paramètres.",
    conseil:
      "Alterne objectifs / activité pour le court terme, Academy et formations pour le moyen terme, puis évaluations pour le bilan. Les formations validées regroupent tes acquis.",
    liens: [
      { href: "/member/objectifs", label: "Objectifs du mois" },
      { href: "/member/academy", label: "Présentation Academy" },
      { href: "/member/formations", label: "Catalogue des formations" },
      { href: "/member/formations/validees", label: "Formations validées" },
      { href: "/member/evaluations", label: "Mon évaluation" },
      { href: "/member/parametres", label: "Paramètres du compte" },
    ],
    cardGradient: "linear-gradient(135deg, rgba(16,185,129,0.26) 0%, rgba(52,211,153,0.1) 45%, transparent 72%)",
    selectedRing: "0 0 0 2px rgba(52, 211, 153, 0.55), 0 16px 40px rgba(16, 185, 129, 0.16)",
  },
];

const SECTION_META: Record<string, { detail: string; accent: string }> = {
  "Espace membre": {
    detail:
      "Le point d’entrée quotidien : synthèse, liens utiles, agenda communautaire et centre de notifications. Pense à vérifier « Tes nouvelles » après chaque session.",
    accent: "#6366f1",
  },
  "Mon profil": {
    detail:
      "Ta fiche TENF, la complétion éventuelle (Twitch, visibilité…) et ton planning perso pour que la communauté sache quand te retrouver.",
    accent: "#8b5cf6",
  },
  "Participation TENF": {
    detail:
      "Raids (historique, stats, déclaration), événements (planning, inscriptions, présences) et engagement (score, découvertes, amis). C’est le bloc « vie active » dans TENF.",
    accent: "#f59e0b",
  },
  "Objectifs & activité": {
    detail:
      "Suivi du mois : objectifs, progression globale, activité récente et historique pour te situer dans la durée.",
    accent: "#14b8a6",
  },
  "Academy & progression": {
    detail:
      "Parcours structuré : candidature Academy, suivi, catalogue de formations et validations. Complète le tableau de bord pédagogique côté membre.",
    accent: "#22c55e",
  },
  Évaluation: {
    detail:
      "Accès à l’évaluation en cours et à l’historique des cycles passés, selon les périodes actives sur la communauté.",
    accent: "#ec4899",
  },
  Compte: {
    detail:
      "Réglages liés à ton compte et à ton expérience sur le site (notifications, préférences, sécurité selon ce qui est exposé).",
    accent: "#64748b",
  },
};

export type MemberZoneCard = {
  id: string;
  titre: string;
  detail: string;
  accent: string;
  groupes: { titre: string; liens: { href: string; label: string }[] }[];
};

function slugId(titre: string): string {
  return titre
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const memberZones: MemberZoneCard[] = memberSidebarSections
  .filter((s) => !s.adminOnly)
  .map((section) => {
    const meta = SECTION_META[section.title] ?? {
      detail: "Section de l’espace membre TENF.",
      accent: "#6366f1",
    };
    return {
      id: slugId(section.title),
      titre: section.title,
      detail: meta.detail,
      accent: meta.accent,
      groupes: section.groups.map((g) => ({
        titre: g.title,
        liens: g.items.filter((i) => !i.adminOnly).map((i) => ({ href: i.href, label: i.label })),
      })),
    };
  });

export type ParcoursEtape = {
  id: string;
  titre: string;
  duree: string;
  description: string;
  liens: { href: string; label: string }[];
};

export const parcoursEtapes: ParcoursEtape[] = [
  {
    id: "connexion",
    titre: "Se connecter avec Discord",
    duree: "1 min",
    description:
      "L’espace membre repose sur ta session Discord : sans connexion, les pages /member/* affichent une invitation à te connecter ou te redirigent.",
    liens: [{ href: "/auth/login", label: "Page de connexion" }],
  },
  {
    id: "navigation",
    titre: "Lire la barre latérale (desktop) ou le menu Compte (mobile)",
    duree: "3 min",
    description:
      "La structure du site reprend les blocs ci-dessous : Espace membre, Profil, Participation, Objectifs, Academy, Évaluation, Compte. C’est la même source que le menu officiel.",
    liens: [{ href: "#carte-sidebar", label: "Aller à la carte des sections" }],
  },
  {
    id: "profil",
    titre: "Stabiliser son profil et son planning",
    duree: "10 min",
    description:
      "Un profil à jour aide le staff, les matchings et les visibilités communautaires. Le planning de live indique quand tu es disponible pour l’entraide.",
    liens: [
      { href: "/member/profil", label: "Mon profil" },
      { href: "/member/planning", label: "Mon planning de live" },
    ],
  },
  {
    id: "pedagogie",
    titre: "Creuser avec le guide pédagogique",
    duree: "variable",
    description:
      "Cette page est une carte interactive ; le guide « Espace membre » sous /rejoindre explique écran par écran le tableau de bord, les réglages et la FAQ membre.",
    liens: [
      { href: "/rejoindre/guide-espace-membre", label: "Guide espace membre (rejoindre)" },
      { href: "/guides/partie-publique", label: "Guide partie publique du site" },
    ],
  },
];

export type FaqItem = { id: string; q: string; a: string };

export const faqItems: FaqItem[] = [
  {
    id: "public",
    q: "Cette page est-elle réservée aux membres connectés ?",
    a: "Non : tu peux la lire comme visiteur pour préparer ta navigation. En revanche, les liens vers /member/… ne montrent les données personnelles qu’une fois connecté avec Discord.",
  },
  {
    id: "diff",
    q: "Quelle différence avec le « Guide espace membre » dans Rejoindre ?",
    a: "Le guide sous /rejoindre/guide-espace-membre est pédagogique et linéaire (première connexion, écrans, FAQ). Ici, tu as une carte interactive alignée sur le menu latéral réel, des profils types et une checklist.",
  },
  {
    id: "admin",
    q: "Je suis staff / admin : où sont mes outils ?",
    a: "Les liens d’administration n’apparaissent dans la barre membre que si ton compte a les droits. Ils pointent vers /admin/… et ne sont pas détaillés dans ce guide grand public.",
  },
  {
    id: "mobile",
    q: "Sur mobile, où est le même menu ?",
    a: "Dans l’espace membre, le bandeau propose en général « Compte » pour ouvrir le panneau qui reprend les mêmes entrées que la sidebar bureau.",
  },
];

export type ChecklistItem = { id: string; label: string; href: string };

export const checklistItems: ChecklistItem[] = [
  { id: "dash", label: "Ouvrir le tableau de bord membre", href: "/member/dashboard" },
  { id: "notif", label: "Consulter tes nouvelles", href: "/member/notifications" },
  { id: "profil", label: "Vérifier / compléter ton profil", href: "/member/profil" },
  { id: "events", label: "Voir l’agenda des événements", href: "/member/evenements" },
  { id: "raids", label: "Parcourir l’historique ou déclarer un raid", href: "/member/raids/historique" },
  { id: "objectifs", label: "Regarder tes objectifs du mois", href: "/member/objectifs" },
];

export const extraRessources: {
  titre: string;
  href: string;
  description: string;
  icon: LucideIcon;
  color: string;
}[] = [
  {
    titre: "Guide espace membre (pas à pas)",
    href: "/rejoindre/guide-espace-membre",
    description: "Première connexion, dashboard, fonctionnalités, paramètres — pages pédagogiques sous Rejoindre.",
    icon: BookOpen,
    color: "#a78bfa",
  },
  {
    titre: "Guide partie publique (carte)",
    href: "/guides/partie-publique",
    description: "Même principe interactif pour tout ce qui est accessible sans connexion.",
    icon: Map,
    color: "#22d3ee",
  },
  {
    titre: "Guide public (Discord & Twitch)",
    href: "/rejoindre/guide-public",
    description: "Avant d’être à l’aise dans l’espace membre, les étapes d’activation du compte.",
    icon: Sparkles,
    color: "#f472b6",
  },
  {
    titre: "Fonctionnement TENF",
    href: "/fonctionnement-tenf/decouvrir",
    description: "Comprendre les règles et la culture TENF en parallèle des outils.",
    icon: Compass,
    color: "#fb923c",
  },
  {
    titre: "Guide TENF — nouveau membre",
    href: "/guides/tenf",
    description: "Synthèse narrative : entraide, Spotlights, points, événements, formations, ton rôle.",
    icon: Heart,
    color: "#fb7185",
  },
];
