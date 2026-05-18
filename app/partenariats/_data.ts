import type { LucideIcon } from "lucide-react";
import {
  Award,
  CalendarHeart,
  Compass,
  HeartHandshake,
  HeartPulse,
  Megaphone,
  Server,
  Sparkles,
  Target,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";
import { DISCORD_INVITE_URL } from "@/lib/socialLinks";

export { DISCORD_INVITE_URL };

/** ─── 1. Hero ─────────────────────────────────────────────────────────── */
export const hero = {
  chip: "Partenariats TENF · sérieux, humain, aligné",
  title: "Partenariats TENF",
  lead: "Des collaborations utiles, humaines et alignées avec l'esprit d'entraide de la New Family.",
  body: "On ne fait pas tous les partenariats. On choisit ceux qui ont du sens pour notre communauté et pour la cause portée — et on les fait sérieusement, sans bullshit.",
  primaryCta: { label: "Proposer un partenariat", href: "#proposer" },
  secondaryCta: { label: "Découvrir la communauté", href: "/a-propos" },
} as const;

/** ─── 2. Pourquoi TENF fait des partenariats ──────────────────────────── */
export const whyPartner: ReadonlyArray<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Collaborer, pas faire de la pub",
    description:
      "Un partenariat TENF n'est jamais de la publicité sauvage. C'est une collaboration construite, utile, encadrée, où chacun gagne quelque chose de réel.",
    icon: HeartHandshake,
  },
  {
    title: "Soutenir des causes concrètes",
    description:
      "On préfère travailler avec des projets qui défendent une vraie cause — santé, social, éducation, solidarité — plutôt que d'enchaîner les opérations marketing.",
    icon: HeartPulse,
  },
  {
    title: "Construire des ponts entre communautés",
    description:
      "Associations, événements caritatifs, serveurs d'entraide, outils utiles aux streamers, créateurs ou collectifs qui partagent nos valeurs : on ouvre des portes plutôt que de fermer notre porte.",
    icon: Users,
  },
];

/** ─── 3. Ce que TENF peut apporter ────────────────────────────────────── */
export const whatTenfOffers: ReadonlyArray<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Une communauté active de streamers Twitch",
    description: "Des créateurs francophones réellement présents, qui suivent, interagissent et participent — pas des chiffres morts.",
    icon: Users,
  },
  {
    title: "Une visibilité encadrée et respectueuse",
    description: "Mise en avant éditoriale ciblée (post Discord, article, page dédiée si pertinent), jamais de spam ni de pop-ups intrusifs.",
    icon: Megaphone,
  },
  {
    title: "Des événements communautaires",
    description: "Lives coordonnés, raids organisés, soirées thématiques, formats spéciaux : TENF sait fédérer autour d'un moment précis.",
    icon: CalendarHeart,
  },
  {
    title: "Une capacité de mobilisation",
    description: "Quand TENF s'engage sur une cause, la communauté répond. L'édition UPA × Ligue contre le cancer en est l'illustration concrète.",
    icon: Trophy,
  },
  {
    title: "Une expérience d'organisation",
    description: "Coordination de lives, raids, calendriers, modération, communication : le staff TENF sait orchestrer un projet du début à la fin.",
    icon: Compass,
  },
  {
    title: "Une culture de l'entraide et du soutien",
    description: "L'ADN TENF, c'est l'entraide sincère entre streamers. Tout partenariat est pensé pour rester aligné avec cette culture.",
    icon: HeartHandshake,
  },
  {
    title: "Un cadre staff structuré",
    description: "Un staff dédié, des process clairs, une charte publique. Tu travailles avec une équipe organisée, pas avec un Discord brouillon.",
    icon: Award,
  },
];

/** ─── 4. Ce que TENF recherche ────────────────────────────────────────── */
export const whatTenfLooksFor: ReadonlyArray<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Partenariats caritatifs",
    description: "Causes solidaires, associations sérieuses, collectes encadrées — comme l'édition TENF × UPA au profit de la Ligue contre le cancer.",
    icon: HeartPulse,
  },
  {
    title: "Événements intercommunautés",
    description: "Soirées thématiques, lives coordonnés, raids communs, tournois bienveillants : tout ce qui crée du lien entre serveurs.",
    icon: CalendarHeart,
  },
  {
    title: "Serveurs d'entraide sérieux",
    description: "D'autres communautés Discord alliées qui placent l'humain avant la stat — on aime tisser des ponts entre nous.",
    icon: Server,
  },
  {
    title: "Outils ou services utiles aux streamers",
    description: "Solutions techniques, plateformes, ressources qui aident vraiment les créateurs francophones à avancer.",
    icon: Wrench,
  },
  {
    title: "Projets créatifs ou communautaires",
    description: "Initiatives portées par des créateurs ou collectifs qui partagent une culture proche : exigence, bienveillance, transparence.",
    icon: Sparkles,
  },
  {
    title: "Initiatives autour du streaming, santé, inclusion, solidarité",
    description: "Tout projet qui touche au bien-être des créateurs, à la santé mentale, à l'inclusion ou à la solidarité a une oreille attentive ici.",
    icon: Target,
  },
];

/** ─── 5. Ce que TENF refuse ───────────────────────────────────────────── */
export const whatTenfRefuses: ReadonlyArray<{
  title: string;
  description: string;
}> = [
  {
    title: "Publicité agressive",
    description: "Pop-ups, spam de DM, automatisations intrusives, harcèlement publicitaire : non, jamais.",
  },
  {
    title: "Partenariats opportunistes",
    description: "Demandes envoyées en masse, sans intérêt pour TENF, juste pour gratter de la visibilité.",
  },
  {
    title: "Échange de visibilité sans valeur réelle",
    description: "Un \"on se mentionne mutuellement\" sans projet derrière, ça n'a pas d'intérêt pour nos membres.",
  },
  {
    title: "Systèmes de follow / sub forcés",
    description: "Aucune manipulation des stats Twitch : pas de fermes à follows, pas de raids artificiels, pas d'obligation d'abonnement.",
  },
  {
    title: "Projets toxiques ou discriminants",
    description: "Discours de haine, contenus discriminatoires, escroquerie, NFT spéculatifs, jeux d'argent : refus immédiat.",
  },
  {
    title: "Démarchage massif des membres",
    description: "TENF refuse toute opération qui transformerait ses membres en cible commerciale ou en audience à exploiter.",
  },
  {
    title: "Partenariats qui contredisent la charte TENF",
    description: "Tout ce qui va à l'encontre des valeurs publiques (entraide, respect, confidentialité, inclusion) est refusé sans négociation.",
  },
];

/** ─── 6. Mise en avant UPA Events ─────────────────────────────────────── */
/**
 * Données reprises de :
 *  - lib/repositories/UpaEventRepository.ts → DEFAULT_UPA_EVENT_CONTENT
 *  - Page /partenaire-tenf (bilan détaillé public)
 *
 * Note importante : le texte officiel actuellement publié dans le projet
 * indique "plus de 4 500 € collectés en 9 jours" (highlightMessage +
 * section éditoriale closure-results). Le chiffre exact "4 538 €" mentionné
 * dans la consigne n'apparaît nulle part dans le code → on garde la
 * formulation officielle prudente déjà publiée.
 */
export const upaSpotlight = {
  kicker: "Mise en avant · Partenariat réussi",
  title: "UPA Events : un partenariat solidaire réussi",
  lead:
    "Une première édition commune TENF × UPA, sur 9 jours, au profit de la Ligue contre le cancer. La preuve concrète que TENF peut mobiliser sa communauté autour d'une cause qui dépasse largement la visibilité individuelle.",
  body: [
    "Pendant 9 jours (du 18 au 26 avril 2026), streamers TENF, bénévoles et équipes UPA ont uni leurs communautés autour d'une cause essentielle.",
    "Les chiffres parlent : une participation forte, des rencontres réelles entre des personnes qui ne se connaissaient pas avant l'édition, et une mobilisation collective qui a dépassé nos prévisions.",
    "C'est exactement le type de partenariat qu'on cherche : ambitieux, transparent, et utile au-delà de TENF.",
  ],
  /** Stats vérifiées dans DEFAULT_UPA_EVENT_CONTENT. */
  stats: [
    {
      label: "Montant collecté",
      value: "+ de 4 500 €",
      detail: "En 9 jours, au profit de la Ligue contre le cancer.",
      icon: Trophy,
    },
    {
      label: "Cause soutenue",
      value: "Lutte contre le cancer",
      detail: "Bénéficiaire : La Ligue contre le cancer.",
      icon: HeartPulse,
    },
    {
      label: "Type d'action",
      value: "Lives caritatifs",
      detail: "Édition TENF × UPA — du 18 au 26 avril 2026.",
      icon: CalendarHeart,
    },
    {
      label: "Rôle de TENF",
      value: "Mobilisation & encadrement",
      detail: "Coordination des streamers, modération, communication communautaire.",
      icon: Compass,
    },
    {
      label: "Résultat humain",
      value: "~ 38 participants",
      detail: "Rencontres réelles, inclusion entre bénévoles UPA et membres TENF.",
      icon: Users,
    },
  ] as ReadonlyArray<{ label: string; value: string; detail: string; icon: LucideIcon }>,
  ctas: {
    detail: { label: "Voir le bilan détaillé", href: "/partenaire-tenf" },
    upa: { label: "Site officiel UPA", href: "https://www.upa-event.fr" },
  },
} as const;

/** ─── 8. Section contact (CTA vers /contact, motif partenariat) ───────── */
export const contactSection = {
  kicker: "8. Proposer un partenariat",
  title: "Tu portes un projet qui partage nos valeurs ?",
  body:
    "Présente-nous ton idée via la page contact — le motif « Partenariat » est présélectionné automatiquement. On lit tout, on répond honnêtement — oui, non, ou \"pas maintenant\", sans détour.",
  primary: { label: "Contacter TENF", href: "/contact?topic=partenariat" },
  secondary: { label: "Rejoindre le Discord", href: DISCORD_INVITE_URL, external: true },
  helper:
    "On répond généralement sous 48 à 96 h. Plus tu es concret (projet, dates, attentes, public visé), plus on peut te répondre vite et juste.",
} as const;

/** Accent visuel principal de la page /partenariats */
export const PARTENARIATS_ACCENT = "#ec4899";

/** ─── 9. FAQ courte ───────────────────────────────────────────────────── */
export const faq: ReadonlyArray<{
  q: string;
  a: string;
  tag: string;
  accent: string;
  icon: LucideIcon;
}> = [
  {
    q: "Est-ce que TENF accepte tous les partenariats ?",
    a: "Non. On accepte les partenariats utiles, sincères et alignés avec notre charte. On refuse la pub agressive, l'opportunisme, les systèmes de follow forcés et tout ce qui contredit nos valeurs.",
    tag: "Critères",
    accent: "#ec4899",
    icon: HeartHandshake,
  },
  {
    q: "Peut-on proposer un événement commun ?",
    a: "Oui — soirées thématiques, lives coordonnés, raids communs, tournois bienveillants. Plus tu es précis sur le format, les dates et le public visé, mieux on peut étudier.",
    tag: "Événements",
    accent: "#a855f7",
    icon: CalendarHeart,
  },
  {
    q: "Peut-on proposer une action caritative ?",
    a: "Oui, c'est même un de nos axes préférés. L'édition TENF × UPA en faveur de la Ligue contre le cancer en est l'illustration. On regarde la cause, la structure bénéficiaire, le cadre de la collecte.",
    tag: "Solidarité",
    accent: "#ef4444",
    icon: HeartPulse,
  },
  {
    q: "Peut-on faire la promotion d'un outil ou service ?",
    a: "Si l'outil est réellement utile aux streamers, qu'il n'est pas intrusif et que tu acceptes une mise en avant éditoriale honnête (sans spam ni pop-ups), c'est possible.",
    tag: "Outils",
    accent: "#6366f1",
    icon: Wrench,
  },
  {
    q: "TENF accepte-t-il les partenariats avec d'autres serveurs ?",
    a: "Oui, avec les serveurs d'entraide sérieux qui partagent nos valeurs. On préfère construire peu de ponts mais solides.",
    tag: "Communautés",
    accent: "#22c55e",
    icon: Server,
  },
  {
    q: "Comment proposer un partenariat ?",
    a: "Via le formulaire dédié sur cette page (bouton « Proposer un partenariat ») ou la page Contact avec le motif « Partenariat ». Présente le projet, les dates, ce que tu attends de TENF et ce que tu apportes. On répond dans les 48 à 96 h.",
    tag: "Démarche",
    accent: "#f59e0b",
    icon: Target,
  },
];
