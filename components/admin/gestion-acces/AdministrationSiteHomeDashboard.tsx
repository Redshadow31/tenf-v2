"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Archive,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Database,
  FileSearch,
  Globe2,
  HelpCircle,
  ImageIcon,
  Lock,
  MessageSquare,
  MousePointerClick,
  Network,
  RefreshCw,
  ScrollText,
  Settings2,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
  Users,
  Activity,
  Compass,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import MembersCockpitShell from "@/components/admin/members-hub/MembersCockpitShell";
import {
  cockpitHeroClass,
  cockpitPanelClass,
  hubFocusRingClass,
  hubGhostButtonClass,
  hubPrimaryButtonClass,
  hubSectionLabelClass,
  hubSectionTitleClass,
} from "@/components/admin/members-hub/membersHubStyles";

type AdminAccessRow = {
  discordId: string;
  role: string;
  adminAlias?: string;
  moderationCharterValidated?: boolean;
};

type FaqStats = { total: number; new: number; inProgress: number };

type HubCard = {
  href: string;
  title: string;
  description: string;
  badge?: string;
  icon: LucideIcon;
  externalToHub?: boolean;
};

type HubSection = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent: "rose" | "violet" | "indigo" | "cyan" | "slate";
  cards: HubCard[];
  legacyCards?: HubCard[];
};

const accentClasses: Record<
  HubSection["accent"],
  {
    section: string;
    sectionBg: string;
    stripe: string;
    iconBox: string;
    chip: string;
    cta: string;
    halo: string;
    countBadge: string;
    cardSurface: string;
    cardHover: string;
    cardFooter: string;
  }
> = {
  rose: {
    section: "border-rose-500/20",
    sectionBg:
      "bg-[linear-gradient(165deg,rgba(244,63,94,0.07)_0%,rgba(9,9,11,0.55)_38%,rgba(9,9,11,0.92)_100%)]",
    stripe: "from-rose-400/70 via-rose-500/25 to-transparent",
    iconBox: "border-rose-400/35 bg-rose-500/20 text-rose-100 shadow-[0_0_24px_rgba(244,63,94,0.12)]",
    chip: "text-rose-100",
    cta: "text-rose-200/90 group-hover:text-rose-50",
    halo: "bg-rose-500/12",
    countBadge: "border-rose-400/30 bg-rose-500/10 text-rose-100/90",
    cardSurface:
      "border-rose-300/15 bg-[linear-gradient(160deg,rgba(244,63,94,0.11)_0%,rgba(15,15,18,0.92)_52%,rgba(9,9,11,0.98)_100%)]",
    cardHover: "hover:border-rose-400/35 hover:shadow-[0_12px_40px_-12px_rgba(244,63,94,0.22)]",
    cardFooter: "group-hover:border-rose-400/20 group-hover:bg-rose-500/[0.04]",
  },
  violet: {
    section: "border-violet-500/20",
    sectionBg:
      "bg-[linear-gradient(165deg,rgba(139,92,246,0.08)_0%,rgba(9,9,11,0.55)_38%,rgba(9,9,11,0.92)_100%)]",
    stripe: "from-violet-400/70 via-violet-500/25 to-transparent",
    iconBox: "border-violet-400/35 bg-violet-500/20 text-violet-100 shadow-[0_0_24px_rgba(139,92,246,0.14)]",
    chip: "text-violet-100",
    cta: "text-violet-200/90 group-hover:text-violet-50",
    halo: "bg-violet-500/12",
    countBadge: "border-violet-400/30 bg-violet-500/10 text-violet-100/90",
    cardSurface:
      "border-violet-300/15 bg-[linear-gradient(160deg,rgba(139,92,246,0.11)_0%,rgba(15,15,18,0.92)_52%,rgba(9,9,11,0.98)_100%)]",
    cardHover: "hover:border-violet-400/35 hover:shadow-[0_12px_40px_-12px_rgba(139,92,246,0.22)]",
    cardFooter: "group-hover:border-violet-400/20 group-hover:bg-violet-500/[0.04]",
  },
  indigo: {
    section: "border-indigo-500/20",
    sectionBg:
      "bg-[linear-gradient(165deg,rgba(99,102,241,0.08)_0%,rgba(9,9,11,0.55)_38%,rgba(9,9,11,0.92)_100%)]",
    stripe: "from-indigo-400/70 via-indigo-500/25 to-transparent",
    iconBox: "border-indigo-400/35 bg-indigo-500/20 text-indigo-100 shadow-[0_0_24px_rgba(99,102,241,0.14)]",
    chip: "text-indigo-100",
    cta: "text-indigo-200/90 group-hover:text-indigo-50",
    halo: "bg-indigo-500/12",
    countBadge: "border-indigo-400/30 bg-indigo-500/10 text-indigo-100/90",
    cardSurface:
      "border-indigo-300/15 bg-[linear-gradient(160deg,rgba(99,102,241,0.11)_0%,rgba(15,15,18,0.92)_52%,rgba(9,9,11,0.98)_100%)]",
    cardHover: "hover:border-indigo-400/35 hover:shadow-[0_12px_40px_-12px_rgba(99,102,241,0.22)]",
    cardFooter: "group-hover:border-indigo-400/20 group-hover:bg-indigo-500/[0.04]",
  },
  cyan: {
    section: "border-cyan-500/20",
    sectionBg:
      "bg-[linear-gradient(165deg,rgba(34,211,238,0.07)_0%,rgba(9,9,11,0.55)_38%,rgba(9,9,11,0.92)_100%)]",
    stripe: "from-cyan-400/70 via-cyan-500/25 to-transparent",
    iconBox: "border-cyan-400/35 bg-cyan-500/20 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.12)]",
    chip: "text-cyan-100",
    cta: "text-cyan-200/90 group-hover:text-cyan-50",
    halo: "bg-cyan-500/12",
    countBadge: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100/90",
    cardSurface:
      "border-cyan-300/15 bg-[linear-gradient(160deg,rgba(34,211,238,0.10)_0%,rgba(15,15,18,0.92)_52%,rgba(9,9,11,0.98)_100%)]",
    cardHover: "hover:border-cyan-400/35 hover:shadow-[0_12px_40px_-12px_rgba(34,211,238,0.18)]",
    cardFooter: "group-hover:border-cyan-400/20 group-hover:bg-cyan-500/[0.04]",
  },
  slate: {
    section: "border-slate-500/25",
    sectionBg:
      "bg-[linear-gradient(165deg,rgba(148,163,184,0.06)_0%,rgba(9,9,11,0.55)_38%,rgba(9,9,11,0.92)_100%)]",
    stripe: "from-slate-400/60 via-slate-500/20 to-transparent",
    iconBox: "border-slate-400/30 bg-slate-500/15 text-slate-100 shadow-[0_0_20px_rgba(148,163,184,0.08)]",
    chip: "text-slate-100",
    cta: "text-slate-200/90 group-hover:text-slate-50",
    halo: "bg-slate-500/10",
    countBadge: "border-slate-500/35 bg-slate-500/10 text-slate-200/90",
    cardSurface:
      "border-slate-400/12 bg-[linear-gradient(160deg,rgba(148,163,184,0.08)_0%,rgba(15,15,18,0.92)_52%,rgba(9,9,11,0.98)_100%)]",
    cardHover: "hover:border-slate-400/30 hover:shadow-[0_12px_40px_-12px_rgba(148,163,184,0.12)]",
    cardFooter: "group-hover:border-slate-400/20 group-hover:bg-slate-500/[0.04]",
  },
};

function badgeClass(badge: string): string {
  if (badge === "Critique" || badge === "Fondateur") {
    return "border-rose-500/35 bg-rose-500/10 text-rose-200";
  }
  if (badge === "Sensible") return "border-amber-500/35 bg-amber-500/10 text-amber-100";
  if (badge === "Legacy") return "border-zinc-600/50 bg-zinc-800/80 text-zinc-400";
  if (badge === "Hors hub") return "border-sky-500/30 bg-sky-500/10 text-sky-100";
  return "border-emerald-500/25 bg-emerald-500/10 text-emerald-100";
}

const HUB_SECTIONS: HubSection[] = [
  {
    id: "acces-securite",
    eyebrow: "Sécurité",
    title: "Accès & sécurité",
    subtitle: "Qui peut entrer dans l’admin, avec quels droits, et en mode avancé.",
    icon: Lock,
    accent: "rose",
    cards: [
      {
        href: "/admin/gestion-acces/comptes",
        title: "Comptes administrateurs",
        description: "Ajouter ou retirer un accès Discord, définir le rôle et le pseudo affiché.",
        badge: "Fondateur",
        icon: ShieldCheck,
      },
      {
        href: "/admin/gestion-acces/permissions",
        title: "Permissions par section",
        description: "Matrice RBAC : chaque page admin, chaque rôle — alignée sur le menu latéral.",
        badge: "Sensible",
        icon: Lock,
      },
      {
        href: "/admin/gestion-acces/admin-avance",
        title: "Accès admin avancé",
        description: "Activer temporairement le mode avancé pour un compte (fondateurs uniquement).",
        badge: "Critique",
        icon: Shield,
      },
    ],
  },
  {
    id: "config-site",
    eyebrow: "Configuration",
    title: "Configuration du site",
    subtitle: "Ce que les membres voient sur leur espace et la qualité des données affichées.",
    icon: SlidersHorizontal,
    accent: "violet",
    cards: [
      {
        href: "/admin/gestion-acces/dashboard",
        title: "Dashboard membre",
        description: "Graphiques, indicateurs et blocs du tableau de bord côté créateur.",
        badge: "Données",
        icon: BarChart3,
      },
      {
        href: "/admin/gestion-acces/images",
        title: "Images profils Twitch",
        description: "Synchroniser et contrôler les avatars stockés pour les fiches publiques.",
        badge: "Données",
        icon: ImageIcon,
      },
      {
        href: "/admin/migration",
        title: "Migration des données",
        description: "État des synchronisations legacy → Supabase et relances manuelles.",
        badge: "Hors hub",
        icon: Database,
        externalToHub: true,
      },
    ],
  },
  {
    id: "equipe-staff",
    eyebrow: "Staff",
    title: "Équipe staff",
    subtitle: "Organisation interne, missions nominatives et comptes rendus mensuels.",
    icon: Users,
    accent: "indigo",
    cards: [
      {
        href: "/admin/gestion-acces/organigramme-staff",
        title: "Organigramme staff",
        description: "Pôles, rôles et visibilité sur la page publique Organisation staff.",
        badge: "Staff",
        icon: Network,
      },
      {
        href: "/admin/gestion-acces/missions-staff",
        title: "Missions staff",
        description: "Missions assignées à un membre — visibles dans « Mon compte » du destinataire.",
        badge: "Staff",
        icon: ClipboardList,
      },
      {
        href: "/admin/gestion-acces/reunions-staff-mensuelles",
        title: "Réunions mensuelles staff",
        description: "CR, discours et intervenants pour chaque réunion mensuelle.",
        badge: "Staff",
        icon: CalendarDays,
      },
      {
        href: "/admin/follow/config",
        title: "Configuration follow staff",
        description: "Paramètres des feuilles de suivi staff (hors périmètre direct du hub).",
        badge: "Hors hub",
        icon: Settings2,
        externalToHub: true,
      },
    ],
  },
  {
    id: "activite-donnees",
    eyebrow: "Discord",
    title: "Activité & données Discord",
    subtitle: "Volumes de messages et vocal — agrégés ou par membre.",
    icon: MessageSquare,
    accent: "cyan",
    cards: [
      {
        href: "/admin/gestion-acces/discord-activite",
        title: "Activité Discord (mois & salons)",
        description: "Statistiques mensuelles par salon, comparaison staff vs communauté.",
        badge: "Données",
        icon: MessageSquare,
      },
      {
        href: "/admin/gestion-acces/discord-activite-personnelle",
        title: "Activité Discord personnelle",
        description: "Détail écrit et vocal pour un membre sur la période choisie.",
        badge: "Données",
        icon: User,
      },
    ],
  },
  {
    id: "audit-conformite",
    eyebrow: "Conformité",
    title: "Audit & conformité",
    subtitle: "Traces des actions, connexions et retours entrants depuis le site public.",
    icon: FileSearch,
    accent: "slate",
    cards: [
      {
        href: "/admin/audit-logs",
        title: "Centre d’audit",
        description: "Vue d’ensemble : connexions, membres, navigation et temps réel.",
        badge: "Hors hub",
        icon: FileSearch,
        externalToHub: true,
      },
      {
        href: "/admin/audit-logs/connexions",
        title: "Logs de connexion",
        description: "Historique filtrable, carte monde et tendances horaires.",
        badge: "Audit",
        icon: Globe2,
        externalToHub: true,
      },
      {
        href: "/admin/audit-logs/membres",
        title: "Logs membres",
        description: "Regroupement journalier des membres connectés.",
        badge: "Audit",
        icon: Users,
        externalToHub: true,
      },
      {
        href: "/admin/audit-logs/historique-pages",
        title: "Historique des pages",
        description: "Pages vues, clics et statistiques de navigation.",
        badge: "Audit",
        icon: MousePointerClick,
        externalToHub: true,
      },
      {
        href: "/admin/audit-logs/temps-reel",
        title: "Temps réel",
        description: "Connexions actives et indicateurs live dans l’admin.",
        badge: "Audit",
        icon: Activity,
        externalToHub: true,
      },
      {
        href: "/admin/gestion-acces/retours-faq",
        title: "Retours FAQ rejoindre",
        description: "Messages envoyés depuis la FAQ publique « Rejoindre ».",
        badge: "Support",
        icon: HelpCircle,
      },
    ],
    legacyCards: [
      {
        href: "/admin/log-center",
        title: "Logs & audit (legacy)",
        description: "Ancienne entrée conservée pour compatibilité.",
        badge: "Legacy",
        icon: Archive,
        externalToHub: true,
      },
      {
        href: "/admin/log-center/notifications-lues",
        title: "Notifications lues (legacy)",
        description: "Historique des notifications déjà consultées.",
        badge: "Legacy",
        icon: Archive,
        externalToHub: true,
      },
    ],
  },
];

function HubLinkCard({
  card,
  accent,
  compact = false,
}: {
  card: HubCard;
  accent: HubSection["accent"];
  compact?: boolean;
}) {
  const accentStyle = accentClasses[accent];
  const Icon = card.icon;
  const dimmed = card.badge === "Legacy";

  return (
    <Link
      href={card.href}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border ring-1 ring-inset ring-white/[0.04] transition duration-200 ${accentStyle.cardSurface} ${accentStyle.cardHover} ${hubFocusRingClass} ${
        dimmed ? "opacity-75 saturate-[0.85]" : ""
      } ${compact ? "min-h-0" : "min-h-[10.75rem]"}`}
    >
      <span
        className={`pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r ${accentStyle.stripe}`}
        aria-hidden
      />
      <span
        className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full ${accentStyle.halo} blur-3xl opacity-80 transition group-hover:opacity-100`}
        aria-hidden
      />

      <div className={`relative flex flex-1 flex-col ${compact ? "p-3.5" : "p-4 sm:p-[1.15rem]"}`}>
        <div className="flex items-start justify-between gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition duration-200 group-hover:scale-[1.03] ${accentStyle.iconBox}`}
            aria-hidden
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          {card.badge ? (
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] ${badgeClass(card.badge)}`}
            >
              {card.badge}
            </span>
          ) : null}
        </div>
        <h3
          className={`font-semibold tracking-tight text-zinc-50 transition-colors group-hover:text-white ${compact ? "mt-3 text-sm" : "mt-4 text-[0.95rem] sm:text-base"}`}
        >
          {card.title}
        </h3>
        <p className="mt-2 flex-1 text-xs leading-relaxed text-zinc-400/95 sm:text-[0.8125rem]">{card.description}</p>
      </div>

      <div
        className={`relative flex items-center justify-between gap-2 border-t border-white/[0.06] bg-black/20 py-2.5 transition duration-200 ${accentStyle.cardFooter} ${compact ? "px-3.5" : "px-4"}`}
      >
        <span className={`text-xs font-semibold ${accentStyle.cta}`}>
          {card.externalToHub ? "Ouvrir · autre section" : "Ouvrir la page"}
        </span>
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition group-hover:border-white/15 group-hover:bg-white/[0.06] group-hover:text-white"
          aria-hidden
        >
          <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}

function HubSectionBlock({ section }: { section: HubSection }) {
  const accent = accentClasses[section.accent];
  const SectionIcon = section.icon;
  const allCards = [...section.cards, ...(section.legacyCards ?? [])];
  const mainCards = section.cards;
  const legacy = section.legacyCards ?? [];

  return (
    <section
      id={section.id}
      className={`relative scroll-mt-24 overflow-hidden rounded-2xl border shadow-sm shadow-black/25 ring-1 ring-inset ring-white/[0.04] ${accent.section} ${accent.sectionBg}`}
      aria-labelledby={`${section.id}-heading`}
    >
      <span
        className={`pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-full bg-gradient-to-b ${accent.stripe}`}
        aria-hidden
      />
      <span className={`pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full ${accent.halo} blur-3xl`} aria-hidden />

      <div className="relative border-b border-white/[0.06] px-4 py-4 sm:px-5 sm:py-[1.15rem]">
        <div className="flex flex-wrap items-start justify-between gap-3 pl-1 sm:pl-2">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-3.5">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${accent.iconBox}`}
              aria-hidden
            >
              <SectionIcon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
            <p className={hubSectionLabelClass}>{section.eyebrow}</p>
            <h2 id={`${section.id}-heading`} className={`mt-1 ${hubSectionTitleClass} text-lg sm:text-xl`}>
              {section.title}
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-zinc-400/95">{section.subtitle}</p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${accent.countBadge}`}
          >
            {allCards.length} lien{allCards.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="relative grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:gap-3.5 sm:p-5 xl:grid-cols-3">
        {mainCards.map((card) => (
          <HubLinkCard key={card.href} card={card} accent={section.accent} />
        ))}
      </div>

      {legacy.length > 0 ? (
        <div className="relative border-t border-white/[0.06] px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          <p className="mb-3 pl-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Anciennes entrées
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {legacy.map((card) => (
              <HubLinkCard key={card.href} card={card} accent={section.accent} compact />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "neutral" | "ok" | "warn" | "danger";
}) {
  const toneClass =
    tone === "ok"
      ? "border-emerald-500/30 bg-emerald-500/10"
      : tone === "warn"
        ? "border-amber-500/35 bg-amber-500/10"
        : tone === "danger"
          ? "border-rose-500/35 bg-rose-500/10"
          : "border-white/[0.08] bg-zinc-900/50";

  const valueClass =
    tone === "ok"
      ? "text-emerald-100"
      : tone === "warn"
        ? "text-amber-100"
        : tone === "danger"
          ? "text-rose-100"
          : "text-zinc-100";

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ring-1 ring-inset ring-white/[0.03] backdrop-blur-sm ${toneClass}`}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/[0.06] bg-black/20">
          <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      </div>
      <p className={`mt-2 text-sm font-semibold tabular-nums ${valueClass}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function AdministrationHubAside({
  faqAttention,
  accessMetrics,
}: {
  faqAttention: number | null;
  accessMetrics: { noAlias: number; charterMissing: number } | null;
}) {
  const sections = HUB_SECTIONS.map((s) => ({ id: s.id, label: s.title }));

  return (
    <div className="space-y-4">
      <nav className={`${cockpitPanelClass} p-4`} aria-label="Sections administration du site">
        <p className={hubSectionLabelClass}>Sur cette page</p>
        <ul className="mt-3 space-y-0.5">
          {sections.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`block rounded-lg border border-transparent px-2.5 py-2 text-sm font-medium text-zinc-300 transition hover:border-violet-500/20 hover:bg-white/[0.04] ${hubFocusRingClass}`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className={`${cockpitPanelClass} border-amber-500/15 p-4`}>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-200/90">
          <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
          Priorités
        </p>
        <ul className="mt-2 space-y-2 text-sm text-zinc-400">
          {accessMetrics && accessMetrics.noAlias > 0 ? (
            <li>
              <Link href="/admin/gestion-acces/comptes" className="text-violet-300 hover:underline">
                {accessMetrics.noAlias} compte(s) sans pseudo admin
              </Link>
            </li>
          ) : (
            <li className="text-zinc-500">Alias admin : rien à signaler.</li>
          )}
          {accessMetrics && accessMetrics.charterMissing > 0 ? (
            <li className="text-amber-200/90">{accessMetrics.charterMissing} charte(s) non validée(s)</li>
          ) : accessMetrics ? (
            <li className="text-zinc-500">Charte modération : OK sur la liste chargée.</li>
          ) : null}
          {faqAttention != null ? (
            <li>
              <Link href="/admin/gestion-acces/retours-faq" className="text-violet-300 hover:underline">
                {faqAttention} retour(s) FAQ à traiter
              </Link>
            </li>
          ) : (
            <li className="text-zinc-500">FAQ rejoindre : aucune action urgente.</li>
          )}
        </ul>
      </div>

      <div className={`${cockpitPanelClass} p-4`}>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-200/90">
          <Compass className="h-4 w-4 shrink-0" aria-hidden />
          Raccourcis
        </p>
        <ul className="mt-2 space-y-1.5 text-sm">
          <li>
            <Link href="/admin/membres" className={`text-zinc-400 hover:text-violet-200 ${hubFocusRingClass} rounded`}>
              Hub membres →
            </Link>
          </li>
          <li>
            <Link href="/admin/audit-logs" className={`text-zinc-400 hover:text-violet-200 ${hubFocusRingClass} rounded`}>
              Centre d&apos;audit →
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function AdministrationSiteHomeDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("Admin");
  const [roleLabel, setRoleLabel] = useState<string | null>(null);
  const [advancedEnabled, setAdvancedEnabled] = useState(false);
  const [accessMetrics, setAccessMetrics] = useState<{
    total: number;
    charterOk: number;
    charterMissing: number;
    noAlias: number;
    available: boolean;
  } | null>(null);
  const [faqStats, setFaqStats] = useState<FaqStats | null>(null);
  const [faqError, setFaqError] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFaqError(false);
    try {
      const [roleRes, advancedRes, accessRes, faqRes, selfRes] = await Promise.all([
        fetch("/api/user/role", { cache: "no-store" }),
        fetch("/api/admin/advanced-access?check=1", { cache: "no-store" }),
        fetch("/api/admin/access", { cache: "no-store", headers: { "Cache-Control": "no-cache" } }),
        fetch("/api/admin/rejoindre/faq-contact", { cache: "no-store" }),
        fetch("/api/admin/access/self", { cache: "no-store" }),
      ]);

      if (selfRes.ok) {
        const selfData = await selfRes.json();
        const alias = typeof selfData?.adminAlias === "string" ? selfData.adminAlias.trim() : "";
        if (alias) setDisplayName(alias);
      }

      if (roleRes.ok) {
        const roleData = await roleRes.json();
        setRoleLabel(typeof roleData?.role === "string" ? roleData.role : null);
      } else {
        setRoleLabel(null);
      }

      if (advancedRes.ok) {
        const advancedData = await advancedRes.json();
        setAdvancedEnabled(advancedData?.canAccessAdvanced === true);
      } else {
        setAdvancedEnabled(false);
      }

      if (accessRes.ok) {
        const data = await accessRes.json();
        const list = (data?.accessList || []) as AdminAccessRow[];
        const charterOk = list.filter((r) => r.moderationCharterValidated === true).length;
        const charterMissing = list.length - charterOk;
        const noAlias = list.filter((r) => !String(r.adminAlias || "").trim()).length;
        setAccessMetrics({
          total: list.length,
          charterOk,
          charterMissing,
          noAlias,
          available: true,
        });
      } else {
        setAccessMetrics(null);
      }

      if (faqRes.ok) {
        const faqData = await faqRes.json();
        const stats = faqData?.stats;
        if (stats && typeof stats.new === "number") {
          setFaqStats({
            total: Number(stats.total) || 0,
            new: Number(stats.new) || 0,
            inProgress: Number(stats.inProgress) || 0,
          });
        } else {
          setFaqStats(null);
        }
      } else {
        setFaqStats(null);
        if (faqRes.status !== 403) setFaqError(true);
      }

      setLastSync(new Date().toISOString());
    } catch {
      setAccessMetrics(null);
      setFaqStats(null);
      setFaqError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const faqAttention = useMemo(() => {
    if (!faqStats) return null;
    const n = faqStats.new + faqStats.inProgress;
    return n > 0 ? n : null;
  }, [faqStats]);

  const syncLabel = lastSync
    ? new Date(lastSync).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const asideMetrics = accessMetrics
    ? { noAlias: accessMetrics.noAlias, charterMissing: accessMetrics.charterMissing }
    : null;

  return (
    <MembersCockpitShell
      aside={<AdministrationHubAside faqAttention={faqAttention} accessMetrics={asideMetrics} />}
    >
      <header className={`${cockpitHeroClass} px-4 py-5 sm:px-6 sm:py-6`}>
        <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-rose-500/[0.06] blur-3xl" aria-hidden />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.11em] text-zinc-200/90">
                Administration du site
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/26 bg-violet-500/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.11em] text-violet-100/92">
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Hub sécurité & config
              </span>
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl lg:text-[1.65rem]">
              Accueil administration
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-[0.95rem]">
              Pilote les accès staff, la configuration affichée aux membres, l&apos;organisation interne et les traces
              d&apos;audit — le même périmètre que le menu « Administration du site ».
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.72rem] text-zinc-500">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1">
                <ShieldCheck className="h-3.5 w-3.5 text-violet-300" aria-hidden />
                <span className="font-medium text-zinc-200">{displayName}</span>
                {roleLabel ? (
                  <>
                    <span>·</span>
                    <span>{roleLabel}</span>
                  </>
                ) : null}
              </span>
              <span>Dernière synchro : {syncLabel}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className={`${hubPrimaryButtonClass} shrink-0 self-start disabled:opacity-50`}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
            Actualiser
          </button>
        </div>

        <div className="relative mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatTile
            label="Accès admin avancé"
            value={advancedEnabled ? "Autorisé" : "Verrouillé"}
            icon={Shield}
            tone={advancedEnabled ? "ok" : "warn"}
          />
          {accessMetrics ? (
            <>
              <StatTile label="Comptes admin" value={String(accessMetrics.total)} hint="Liste complète (fondateurs)" icon={Users} />
              <StatTile
                label="Charte modération"
                value={`${accessMetrics.charterOk} signée`}
                hint={`${accessMetrics.charterMissing} non / inconnu`}
                icon={ScrollText}
                tone={accessMetrics.charterMissing > 0 ? "warn" : "ok"}
              />
              <StatTile
                label="Alias admin"
                value={`${accessMetrics.noAlias} sans pseudo`}
                hint="Pseudo affiché dans l’admin"
                icon={ShieldCheck}
                tone={accessMetrics.noAlias > 0 ? "warn" : "ok"}
              />
            </>
          ) : (
            <StatTile
              label="Comptes admin"
              value="—"
              hint="Métriques réservées aux fondateurs."
              icon={Users}
            />
          )}
          {faqStats ? (
            <StatTile
              label="Retours FAQ"
              value={faqAttention != null ? `${faqAttention} à traiter` : "Rien en attente"}
              hint={`${faqStats.new} nouveau(x) · ${faqStats.inProgress} en cours`}
              icon={HelpCircle}
              tone={faqAttention != null ? "warn" : "ok"}
            />
          ) : (
            <StatTile
              label="Retours FAQ"
              value={faqError ? "Indisponible" : "—"}
              hint={faqError ? "Erreur ou accès refusé." : "Chargement ou non applicable."}
              icon={HelpCircle}
              tone={faqError ? "danger" : "neutral"}
            />
          )}
        </div>

        <div className="relative mt-4 flex flex-wrap gap-2">
          <Link href="/admin/gestion-acces/comptes" className={hubPrimaryButtonClass}>
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Comptes administrateurs
          </Link>
          <Link href="/admin/gestion-acces/permissions" className={hubGhostButtonClass}>
            <Lock className="h-4 w-4 text-violet-300" aria-hidden />
            Permissions
          </Link>
          <Link href="/admin/gestion-acces/dashboard" className={hubGhostButtonClass}>
            <BarChart3 className="h-4 w-4 text-violet-300" aria-hidden />
            Dashboard membre
          </Link>
          <Link href="/admin/audit-logs" className={hubGhostButtonClass}>
            <FileSearch className="h-4 w-4 text-violet-300" aria-hidden />
            Audit & logs
          </Link>
        </div>
      </header>

      <section className={`${cockpitPanelClass} p-4 sm:p-5`} aria-labelledby="admin-hub-guide-heading">
        <div className="flex flex-wrap items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/15 text-violet-200"
            aria-hidden
          >
            <HelpCircle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className={hubSectionLabelClass}>Guide rapide</p>
            <h2 id="admin-hub-guide-heading" className="mt-1 text-lg font-semibold text-zinc-100">
              Par où commencer ?
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
              Tu n&apos;as pas besoin de connaître toutes les pages : trois gestes couvrent 90 % des besoins staff sur
              ce hub.
            </p>
          </div>
        </div>
        <ol className="mt-5 grid min-w-0 gap-3 sm:grid-cols-3">
          <li className="rounded-2xl border border-rose-500/15 bg-[linear-gradient(160deg,rgba(244,63,94,0.08),rgba(15,15,18,0.9))] p-4 ring-1 ring-inset ring-white/[0.04]">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-rose-200/90">
              <Lock className="h-4 w-4 shrink-0" aria-hidden />
              1 · Sécuriser
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Nouveau staff dans l&apos;admin ? Commence par{" "}
              <Link href="/admin/gestion-acces/comptes" className="text-violet-300 hover:underline">
                Comptes administrateurs
              </Link>
              , puis vérifie les droits dans{" "}
              <Link href="/admin/gestion-acces/permissions" className="text-violet-300 hover:underline">
                Permissions
              </Link>
              .
            </p>
          </li>
          <li className="rounded-2xl border border-violet-500/15 bg-[linear-gradient(160deg,rgba(139,92,246,0.08),rgba(15,15,18,0.9))] p-4 ring-1 ring-inset ring-white/[0.04]">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-200/90">
              <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
              2 · Configurer
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Ce que voient les créateurs sur leur espace :{" "}
              <Link href="/admin/gestion-acces/dashboard" className="text-violet-300 hover:underline">
                Dashboard membre
              </Link>{" "}
              et qualité des avatars via{" "}
              <Link href="/admin/gestion-acces/images" className="text-violet-300 hover:underline">
                Images Twitch
              </Link>
              .
            </p>
          </li>
          <li className="rounded-2xl border border-slate-500/20 bg-[linear-gradient(160deg,rgba(148,163,184,0.07),rgba(15,15,18,0.9))] p-4 ring-1 ring-inset ring-white/[0.04]">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-200/90">
              <FileSearch className="h-4 w-4 shrink-0" aria-hidden />
              3 · Tracer
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              En cas de doute ou d&apos;incident :{" "}
              <Link href="/admin/audit-logs" className="text-violet-300 hover:underline">
                Centre d&apos;audit
              </Link>
              . Les retours publics « Rejoindre » passent par{" "}
              <Link href="/admin/gestion-acces/retours-faq" className="text-violet-300 hover:underline">
                Retours FAQ
              </Link>
              .
            </p>
          </li>
        </ol>
      </section>

      {HUB_SECTIONS.map((section) => (
        <HubSectionBlock key={section.id} section={section} />
      ))}
    </MembersCockpitShell>
  );
}
