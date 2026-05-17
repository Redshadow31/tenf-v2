"use client";

import Link from "next/link";
import { Database, Sparkles, UserCheck, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  hubFocusRingClass,
  hubSectionLabelClass,
  hubSectionTitleClass,
} from "./membersHubStyles";

type PathLink = {
  href: string;
  label: string;
  description?: string;
  /** Compteur d'actions en attente sur ce lien (badge discret). */
  badge?: number;
};

type PathGroup = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: "violet" | "indigo" | "cyan" | "amber" | "emerald";
  links: PathLink[];
  /** Compteur global du groupe (somme ou max) — affiché sur la card. */
  groupBadge?: number;
};

const accentClasses: Record<
  PathGroup["accent"],
  { card: string; iconBox: string; chip: string; halo: string; badge: string }
> = {
  violet: {
    card: "border-violet-300/20 bg-[linear-gradient(155deg,rgba(139,92,246,0.10),rgba(11,13,20,0.85)_60%)]",
    iconBox: "bg-violet-500/15 text-violet-200 border-violet-400/30",
    chip: "text-violet-200",
    halo: "bg-violet-500/10",
    badge: "border-violet-400/35 bg-violet-500/15 text-violet-100",
  },
  indigo: {
    card: "border-indigo-300/20 bg-[linear-gradient(155deg,rgba(99,102,241,0.10),rgba(11,13,20,0.85)_60%)]",
    iconBox: "bg-indigo-500/15 text-indigo-200 border-indigo-400/30",
    chip: "text-indigo-200",
    halo: "bg-indigo-500/10",
    badge: "border-indigo-400/35 bg-indigo-500/15 text-indigo-100",
  },
  cyan: {
    card: "border-cyan-300/20 bg-[linear-gradient(155deg,rgba(34,211,238,0.10),rgba(11,13,20,0.85)_60%)]",
    iconBox: "bg-cyan-500/15 text-cyan-200 border-cyan-400/30",
    chip: "text-cyan-200",
    halo: "bg-cyan-500/10",
    badge: "border-cyan-400/35 bg-cyan-500/15 text-cyan-100",
  },
  amber: {
    card: "border-amber-300/20 bg-[linear-gradient(155deg,rgba(245,158,11,0.10),rgba(11,13,20,0.85)_60%)]",
    iconBox: "bg-amber-500/15 text-amber-200 border-amber-400/30",
    chip: "text-amber-200",
    halo: "bg-amber-500/10",
    badge: "border-amber-400/35 bg-amber-500/15 text-amber-100",
  },
  emerald: {
    card: "border-emerald-300/20 bg-[linear-gradient(155deg,rgba(16,185,129,0.10),rgba(11,13,20,0.85)_60%)]",
    iconBox: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
    chip: "text-emerald-200",
    halo: "bg-emerald-500/10",
    badge: "border-emerald-400/35 bg-emerald-500/15 text-emerald-100",
  },
};

export type MembersManagementPathsCounters = {
  profileValidationPending: number;
  incomplete: number;
  reviewOverdue: number;
  syncMissing: number;
  staffApplicationsPending: number;
  qualityScore: number;
  dataErrors: number;
};

type Props = {
  counters: MembersManagementPathsCounters;
};

export default function MembersManagementPaths({ counters }: Props) {
  const groups: PathGroup[] = [
    {
      id: "cycle",
      title: "Cycle profil",
      description: "De l'accès au suivi qualité d'une fiche créateur.",
      icon: UserCheck,
      accent: "indigo",
      groupBadge:
        counters.profileValidationPending + counters.incomplete + counters.reviewOverdue,
      links: [
        {
          href: "/admin/membres/validation-profil",
          label: "Valider les accès",
          description: "Demandes profil en attente.",
          badge: counters.profileValidationPending,
        },
        {
          href: "/admin/membres/incomplets",
          label: "Profils à accompagner",
          description: "Champs essentiels manquants.",
          badge: counters.incomplete,
        },
        {
          href: "/admin/membres/revues",
          label: "Revues à clôturer",
          description: "Suivi SLA des créateurs.",
          badge: counters.reviewOverdue,
        },
        { href: "/admin/membres/historique", label: "Historique des changements", description: "Trace fine des décisions." },
      ],
    },
    {
      id: "directory",
      title: "Annuaire & fiches",
      description: "Trouver un créateur, ouvrir sa fiche, agir en masse.",
      icon: Users,
      accent: "violet",
      links: [
        { href: "/admin/membres/gestion", label: "Liste & gestion", description: "Filtres, exports, actions de masse." },
        { href: "/admin/search", label: "Recherche globale", description: "Rechercher partout dans TENF." },
        { href: "/admin/membres/reconciliation", label: "Réconciliation", description: "Doublons & fusions." },
      ],
    },
    {
      id: "quality",
      title: "Qualité des fiches",
      description: "Diagnostic, Discord, synchronisation, anomalies.",
      icon: Database,
      accent: "cyan",
      groupBadge: counters.dataErrors + counters.syncMissing,
      links: [
        {
          href: "/admin/membres/qualite-data",
          label: "Diagnostic qualité",
          description: `Score officiel : ${counters.qualityScore}/100.`,
        },
        { href: "/admin/membres/qualite-data?onglet=discord", label: "Cohérence Discord", description: "Pseudo / discordId." },
        {
          href: "/admin/membres/qualite-data?onglet=sync",
          label: "Synchronisation",
          description: "Écarts legacy ↔ Supabase.",
          badge: counters.syncMissing,
        },
        {
          href: "/admin/membres/incomplets?vue=erreurs",
          label: "Incohérences à corriger",
          description: "Anomalies critiques.",
          badge: counters.dataErrors,
        },
      ],
    },
    {
      id: "recruitment",
      title: "Recrutement staff",
      description: "Postulations, signalements et entretiens.",
      icon: UserPlus,
      accent: "amber",
      groupBadge: counters.staffApplicationsPending,
      links: [
        {
          href: "/admin/membres/postulations",
          label: "Postulations à instruire",
          description: "File ouverte staff.",
          badge: counters.staffApplicationsPending,
        },
      ],
    },
    {
      id: "recognition",
      title: "Reconnaissance & mise en avant",
      description: "Valoriser ceux qui font vivre TENF.",
      icon: Sparkles,
      accent: "emerald",
      links: [
        { href: "/admin/membres/badges", label: "Badges & distinctions", description: "Reconnaissance par catégorie." },
        { href: "/admin/membres/vip", label: "VIP du mois", description: "Mise en avant mensuelle." },
        { href: "/admin/membres/spotlight", label: "Spotlight créateurs", description: "Programmation des spotlights." },
      ],
    },
  ];

  return (
    <section aria-labelledby="members-hub-paths">
      <header className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className={hubSectionLabelClass}>Parcours de gestion</p>
          <h2
            id="members-hub-paths"
            className={`mt-1.5 ${hubSectionTitleClass}`}
            style={{ fontSize: "clamp(1.05rem, 0.9rem + 0.45vw, 1.3rem)" }}
          >
            5 parcours pour agir, sans mur d'outils
          </h2>
          <p
            className="mt-1 text-slate-400"
            style={{ fontSize: "clamp(0.74rem, 0.72rem + 0.1vw, 0.82rem)", maxWidth: "62ch" }}
          >
            Chaque parcours regroupe les pages liées à un même geste. Un badge indique discrètement
            qu'une action existe sur ce lien.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const accent = accentClasses[group.accent];
          const Icon = group.icon;
          return (
            <article
              key={group.id}
              className={`relative overflow-hidden rounded-2xl border p-4 transition ${accent.card}`}
            >
              <span
                className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ${accent.halo} blur-2xl`}
                aria-hidden
              />
              <header className="relative flex items-start gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${accent.iconBox}`}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <h3
                      className="min-w-0 flex-1 font-semibold text-white [overflow-wrap:break-word] [word-break:normal]"
                      style={{ fontSize: "clamp(0.92rem, 0.86rem + 0.18vw, 1.02rem)" }}
                    >
                      {group.title}
                    </h3>
                    {group.groupBadge && group.groupBadge > 0 ? (
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[0.6rem] font-bold tabular-nums ${accent.badge}`}
                        aria-label={`${group.groupBadge} actions en attente`}
                      >
                        {group.groupBadge}
                      </span>
                    ) : null}
                  </div>
                  <p
                    className="mt-0.5 text-slate-400"
                    style={{ fontSize: "clamp(0.7rem, 0.68rem + 0.08vw, 0.78rem)", lineHeight: 1.45 }}
                  >
                    {group.description}
                  </p>
                </div>
              </header>

              <ul role="list" className="relative mt-3 space-y-1.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`group flex items-center justify-between gap-2 rounded-lg border border-white/[0.05] bg-white/[0.025] px-2.5 py-1.5 transition hover:border-white/15 hover:bg-white/[0.05] ${hubFocusRingClass}`}
                    >
                      <span className="min-w-0">
                        <span
                          className={`block font-medium ${accent.chip}`}
                          style={{ fontSize: "clamp(0.78rem, 0.76rem + 0.1vw, 0.86rem)" }}
                        >
                          {link.label}
                        </span>
                        {link.description ? (
                          <span
                            className="block text-slate-500 group-hover:text-slate-300"
                            style={{ fontSize: "clamp(0.66rem, 0.64rem + 0.06vw, 0.72rem)" }}
                          >
                            {link.description}
                          </span>
                        ) : null}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {link.badge && link.badge > 0 ? (
                          <span
                            className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[0.6rem] font-semibold tabular-nums ${accent.badge}`}
                            aria-label={`${link.badge} en attente`}
                          >
                            {link.badge}
                          </span>
                        ) : null}
                        <span className="text-slate-500 group-hover:text-white" aria-hidden>
                          →
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
