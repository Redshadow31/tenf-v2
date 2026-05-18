import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BookOpen,
  Clock,
  FileText,
  HelpCircle,
  ListChecks,
  Megaphone,
  MessageCircle,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { DISCORD_INVITE_URL, DISCORD_TICKETS_CHANNEL_URL } from "@/lib/socialLinks";

export const CONTACT_ACCENT = "#38bdf8";
export const CONTACT_TICKET_ACCENT = "#f59e0b";

export const contactHeroStats = [
  { label: "Tickets membres", value: "0–4 h", accent: CONTACT_TICKET_ACCENT },
  { label: "Formulaire", value: "48–96 h", accent: CONTACT_ACCENT },
  { label: "Motifs", value: String(7), accent: "#a855f7" },
] as const;

export const contactHero = {
  chip: "Contact TENF · une porte d'entrée pour tout le monde",
  title: "Une question ? On t'écoute.",
  lead: "Choisis ton motif, écris-nous : un membre du staff te répond dès qu'il le peut.",
  body: "On ne promet pas une réponse en 2 minutes. On promet de tout lire et de répondre honnêtement, dans des délais réalistes.",
  cta: "Ouvrir le formulaire",
} as const;

export const contactDelays = [
  {
    title: "Tickets Discord",
    description: "Membre TENF : ouvre un ticket dans 🎟️・tickets — réponse visée entre 0 et 4 h.",
    icon: MessageCircle,
    accent: CONTACT_TICKET_ACCENT,
    href: DISCORD_TICKETS_CHANNEL_URL,
    linkLabel: "Ouvrir les tickets",
    priority: true,
  },
  {
    title: "Délai habituel",
    description: "Entre 48 et 96 heures. TENF est portée par des bénévoles avec une vie à côté.",
    icon: Clock,
    accent: CONTACT_ACCENT,
  },
  {
    title: "Urgences / signalement",
    description: "Pour les comportements graves, contacte aussi un staff en MP sur Discord pour aller plus vite.",
    icon: ShieldAlert,
    accent: "#ef4444",
  },
] as const;

export const topicVisual: Record<
  string,
  { icon: LucideIcon; accent: string }
> = {
  question_generale: { icon: HelpCircle, accent: "#6366f1" },
  probleme_serveur: { icon: AlertTriangle, accent: "#f59e0b" },
  partenariat: { icon: Megaphone, accent: "#ec4899" },
  presse: { icon: Sparkles, accent: "#a855f7" },
  signalement: { icon: ShieldAlert, accent: "#ef4444" },
  soutien: { icon: MessageCircle, accent: "#22c55e" },
  technique_site: { icon: Wrench, accent: "#38bdf8" },
};

export const beforeYouWrite = {
  title: "Avant d'écrire",
  lead: "Quelques minutes de préparation = une réponse plus utile pour toi et pour le staff.",
  items: [
    {
      title: "Vérifie la FAQ",
      description: "Rejoindre, espace membre, fonctionnement : beaucoup de réponses existent déjà.",
      icon: BookOpen,
      accent: "#6366f1",
      href: "/rejoindre/faq",
    },
    {
      title: "Sois précis",
      description: "Contexte, dates, captures si technique, pseudo Discord : moins d'allers-retours.",
      icon: ListChecks,
      accent: CONTACT_ACCENT,
    },
    {
      title: "Un seul sujet par message",
      description: "Évite les pavés multi-sujets : on oriente mieux vers la bonne personne.",
      icon: FileText,
      accent: "#22c55e",
    },
  ] satisfies Array<{
    title: string;
    description: string;
    icon: LucideIcon;
    accent: string;
    href?: string;
  }>,
} as const;

export const contactChannels = {
  title: "Quel canal choisir ?",
  lead: "Membre TENF : commence par les tickets Discord (réponse rapide). Le formulaire centralise les demandes officielles pour le reste.",
  rows: [
    {
      channel: "🎟️・tickets",
      bestFor: "Membre du serveur : aide staff, suivi prioritaire, questions qui ne doivent pas traîner en public",
      delay: "0–4 h",
      accent: "#f59e0b",
      href: DISCORD_TICKETS_CHANNEL_URL,
      priority: true,
    },
    {
      channel: "Formulaire TENF",
      bestFor: "Demande traçable, partenariat, presse, bug site, signalement documenté",
      delay: "48–96 h",
      accent: CONTACT_ACCENT,
    },
    {
      channel: "MP staff Discord",
      bestFor: "Urgence modération, clarification rapide si tu es déjà membre",
      delay: "Variable",
      accent: "#22c55e",
    },
    {
      channel: "Salons publics",
      bestFor: "Question générale à la communauté — pas pour données sensibles",
      delay: "Communauté",
      accent: "#a855f7",
    },
  ],
} as const;

export const contactFaq = [
  {
    q: "Puis-je envoyer plusieurs messages ?",
    a: "Oui, mais attends la réponse au premier avant d'en ouvrir un second sur le même sujet — ça évite les doublons côté staff.",
    icon: MessageSquare,
    accent: CONTACT_ACCENT,
    tag: "Pratique",
  },
  {
    q: "Que faire si c'est urgent ?",
    a: "Membre TENF : ouvre un ticket dans 🎟️・tickets (réponse visée en 0–4 h). Signalement : formulaire + ticket ou MP staff. Menace immédiate : signale aussi aux plateformes (Twitch, Discord).",
    icon: Zap,
    accent: CONTACT_TICKET_ACCENT,
    tag: "Urgent",
  },
  {
    q: "Partenariat : ce formulaire ou celui de /partenariats ?",
    a: "Les deux arrivent au staff. Pour un dossier complet (projet, cadre, dates), privilégie le formulaire dédié sur la page Partenariats.",
    icon: Megaphone,
    accent: "#ec4899",
    tag: "Partenariat",
  },
] as const;

export const contactMoreLinks = [
  {
    href: "/charte",
    title: "Charte communautaire",
    description: "Avant de signaler, vérifie ce que TENF protège ou interdit.",
    icon: ShieldAlert,
    accent: "#6366f1",
  },
  {
    href: "/rejoindre/faq",
    title: "FAQ rejoindre",
    description: "Beaucoup de questions ont déjà leur réponse.",
    icon: HelpCircle,
    accent: "#22c55e",
  },
  {
    href: "/partenariats",
    title: "Devenir partenaire",
    description: "Page dédiée + formulaire partenariat enrichi.",
    icon: Megaphone,
    accent: "#ec4899",
  },
] as const;

export const CONTACT_NAV = [
  { id: "contact-hero", label: "Accueil" },
  { id: "contact-delais", label: "Délais" },
  { id: "contact-motifs", label: "Motifs" },
  { id: "contact-avant", label: "Avant d'écrire" },
  { id: "contact-canaux", label: "Canaux" },
  { id: "contact-faq", label: "FAQ" },
] as const;
