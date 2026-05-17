import type { LucideIcon } from "lucide-react";
import type { SpotlightTabPanel } from "@/lib/guides/tenf/spotlightGuidePanels";
import { CHAPTER_GOALS, tenfChapters } from "@/lib/guides/tenf/tenfChapters";
import { BookOpen, Compass, GraduationCap, Map } from "lucide-react";

export type ChapterBlock =
  | { kind: "lead"; text: string }
  | { kind: "bullets"; title?: string; items: string[] }
  | { kind: "callout"; variant: "tip" | "important"; text: string }
  | {
      kind: "table";
      title?: string;
      caption?: string;
      columns: string[];
      rows: string[][];
    }
  | {
      kind: "diagram";
      title?: string;
      variant: "flow";
      steps: { label: string; hint?: string }[];
    }
  | {
      kind: "diagram";
      title?: string;
      variant: "compare";
      left: { title: string; items: string[] };
      right: { title: string; items: string[] };
    }
  | {
      kind: "steps";
      title?: string;
      steps: { title: string; body: string }[];
    };

export type Chapter = {
  id: string;
  navLabel: string;
  emoji: string;
  titre: string;
  soustitre: string;
  accent: string;
  icon: LucideIcon;
  blocks: ChapterBlock[];
  /** Contenu onglets (ex. Spotlight viewer / streamer). */
  spotlightTabs?: SpotlightTabPanel[];
  liens?: { href: string; label: string }[];
};

export type GuideTenfChapter = Chapter & {
  slug: string;
  menuLabel: string;
  title: string;
  subtitle: string;
  readTime: string;
  goal: string;
  links?: { href: string; label: string }[];
};

export const GUIDE_TENF_BASE = "/guides/tenf";

export const chapters: Chapter[] = tenfChapters;


export type FaqItem = { id: string; q: string; a: string };

export const faqItems: FaqItem[] = [
  {
    id: "vs-fonctionnement",
    q: "Quelle différence avec les pages « Fonctionnement TENF » ?",
    a: "Ce guide = **carte narrative** pour nouveaux membres (schémas, tableaux, parcours). Les pages /fonctionnement-tenf = **référence officielle** détaillée et mise à jour. Utilise les deux : ici pour comprendre, là-bas pour le détail et les règles précises.",
  },
  {
    id: "points-detail",
    q: "Où voir le détail exact du système de points ?",
    a: "Le chapitre Points contient un **tableau synthèse**. Pour les montants à jour, les preuves et la boutique : salons Discord (🗓・bonus-journalier, 📂・preuves-suivi), annonces staff, et ton **score d’engagement** dans l’espace membre.",
  },
  {
    id: "obligations",
    q: "Suis-je obligé·e de participer à tout ?",
    a: "Non. On attend une **présence régulière et sincère**, pas une disponibilité 24/7. En revanche, rejoindre TENF pour de la pub sans jamais regarder les autres ne correspond pas à l’ADN du collectif.",
  },
  {
    id: "ordre-lecture",
    q: "Dans quel ordre lire ce guide ?",
    a: "Tu peux suivre le **parcours** (4 étapes) ou choisir un chapitre via le menu / les cartes « Tu es plutôt… ». Bienvenue → Fonctionnement → Spotlight/Points selon ton besoin → Conclusion + checklist.",
  },
  {
    id: "spotlight-manque",
    q: "Je ne comprends pas mon rôle pendant un Spotlight",
    a: "Ouvre le chapitre Spotlight : deux onglets **viewer** et **streamer** détaillent les attentes humaines. Les horaires et critères précis sont sur Discord et l’agenda.",
  },
];

export type ChecklistItem = { id: string; label: string; href: string };

export const tenfChecklist: ChecklistItem[] = [
  { id: "decouvrir", label: "Lire « Découvrir TENF » dans le fonctionnement", href: "/fonctionnement-tenf/decouvrir" },
  { id: "comment", label: "Parcourir « Comment ça marche »", href: "/fonctionnement-tenf/comment-ca-marche" },
  { id: "dashboard", label: "Ouvrir mon tableau de bord membre", href: "/member/dashboard" },
  { id: "agenda", label: "Noter un événement à venir dans l’agenda", href: "/member/evenements" },
  { id: "engagement", label: "Consulter mon score / engagement", href: "/member/engagement/score" },
  { id: "formations", label: "Repérer une formation utile cette semaine", href: "/member/formations" },
];

/** @deprecated Utiliser tenfChecklist */
export const checklistItems = tenfChecklist;

const CHAPTER_READ_TIME: Record<string, string> = {
  bienvenue: "4 min",
  "fonctionnement-global": "5 min",
  spotlight: "8 min",
  points: "10 min",
  mecaniques: "6 min",
  evenements: "4 min",
  formations: "4 min",
  role: "5 min",
  apports: "3 min",
  conclusion: "2 min",
};

export const guideTenfChapters: GuideTenfChapter[] = chapters.map((c) => ({
  ...c,
  slug: c.id,
  menuLabel: c.navLabel,
  title: c.titre,
  subtitle: c.soustitre,
  readTime: CHAPTER_READ_TIME[c.id] ?? "5 min",
  goal: CHAPTER_GOALS[c.id] ?? c.soustitre,
  links: c.liens,
}));

export const hubQuickStart = [
  {
    step: 1,
    title: "Choisis ton point d’entrée",
    body: "Cartes « Tu es plutôt… » ou parcours guidé : pas besoin de tout lire d’un trait.",
  },
  {
    step: 2,
    title: "Lis avec les schémas et tableaux",
    body: "Chaque chapitre mélange explications, **fil rouge visuel** et liens vers le site réel.",
  },
  {
    step: 3,
    title: "Passe à l’action sur le site",
    body: "Checklist en bas de page : 6 actions concrètes (fonctionnement, dashboard, agenda…).",
  },
] as const;

export const hubTenfPersonas = [
  {
    id: "nouveau",
    emoji: "👋",
    title: "Je découvre TENF",
    description: "ADN du collectif, ce que ce n’est pas, et par où commencer sans te perdre.",
    href: `${GUIDE_TENF_BASE}/bienvenue`,
    cta: "Chapitre Bienvenue",
    accent: "#a78bfa",
  },
  {
    id: "spotlight",
    emoji: "⭐",
    title: "Un Spotlight est prévu",
    description: "Tableau viewer/streamer + onglets détaillés pour savoir quoi faire le jour J.",
    href: `${GUIDE_TENF_BASE}/spotlight`,
    cta: "Chapitre Spotlight",
    accent: "#fbbf24",
  },
  {
    id: "points",
    emoji: "💎",
    title: "Les points, je ne comprends pas",
    description: "Tableau des sources de points, logique « reconnaissance » et pas « farm ».",
    href: `${GUIDE_TENF_BASE}/points`,
    cta: "Chapitre Points",
    accent: "#34d399",
  },
  {
    id: "carte",
    emoji: "🗺️",
    title: "Je veux la vue d’ensemble",
    description: "Boucle d’entraide, mécaniques, events, formations et ton rôle — le fil complet.",
    href: `${GUIDE_TENF_BASE}/fonctionnement-global`,
    cta: "Fonctionnement global",
    accent: "#38bdf8",
  },
] as const;

export const guideTenfParcoursSteps = [
  {
    id: "bienvenue",
    title: "Comprendre l’ADN TENF",
    duration: "~8 min",
    body: "Schéma du parcours membre, tableau « ce que TENF n’est pas », et 3 premières actions. Tu poses le cadre avant de t’engager.",
    links: [{ href: `${GUIDE_TENF_BASE}/bienvenue`, label: "Lire le chapitre" }],
    chapterSlug: "bienvenue",
  },
  {
    id: "fonctionnement",
    title: "La boucle d’entraide",
    duration: "~7 min",
    body: "Fil visuel Regarder → Participer → Progresser → Être soutenu·e, plus un tableau « que faire au quotidien ».",
    links: [{ href: `${GUIDE_TENF_BASE}/fonctionnement-global`, label: "Lire le chapitre" }],
    chapterSlug: "fonctionnement-global",
  },
  {
    id: "spotlight",
    title: "Spotlights & points",
    duration: "~15 min",
    body: "Deux chapitres clés : mises en avant collectives (onglets viewer/streamer) et logique des points (tableau synthèse).",
    links: [
      { href: `${GUIDE_TENF_BASE}/spotlight`, label: "Spotlight" },
      { href: `${GUIDE_TENF_BASE}/points`, label: "Points" },
    ],
    chapterSlug: "spotlight",
  },
  {
    id: "suite",
    title: "Ton rôle & passage à l’action",
    duration: "~10 min",
    body: "Compare ce qui est attendu vs ce qui fragilise le groupe, puis checklist + dashboard pour t’installer.",
    links: [
      { href: `${GUIDE_TENF_BASE}/role`, label: "Ton rôle" },
      { href: `${GUIDE_TENF_BASE}/conclusion`, label: "Conclusion" },
    ],
    chapterSlug: "conclusion",
  },
];

export const hubTenfFaq = faqItems;

export const relatedTenfGuides = [
  {
    href: "/fonctionnement-tenf/decouvrir",
    label: "Fonctionnement — Découvrir",
    description: "Référence officielle et pérenne du collectif.",
    icon: Compass,
    color: "#fb923c",
  },
  {
    href: "/guides/espace-membre",
    label: "Carte espace membre",
    description: "Menu /member : où cliquer une fois connecté·e.",
    icon: Map,
    color: "#818cf8",
  },
  {
    href: "/guides/partie-publique",
    label: "Guide site public",
    description: "Pages accessibles sans connexion.",
    icon: BookOpen,
    color: "#22d3ee",
  },
  {
    href: "/rejoindre/guide-espace-membre",
    label: "Guide pas à pas membre",
    description: "Première connexion écran par écran.",
    icon: GraduationCap,
    color: "#a78bfa",
  },
] as const;

export function getGuideTenfStats() {
  return {
    chapters: guideTenfChapters.length,
    withSpotlight: guideTenfChapters.filter((c) => c.spotlightTabs?.length).length,
  };
}

export function getTenfChapterBySlug(slug: string): GuideTenfChapter | undefined {
  return guideTenfChapters.find((c) => c.slug === slug);
}

export function getTenfChapterNavIndex(slug: string): number {
  return guideTenfChapters.findIndex((c) => c.slug === slug);
}
