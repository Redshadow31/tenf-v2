"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  RefreshCw,
  Shield,
  ShieldCheck,
  Lock,
  BarChart3,
  Users,
  ClipboardList,
  SlidersHorizontal,
  MessageSquare,
  FileSearch,
  ScrollText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  /** Lien hors préfixe /admin/gestion-acces */
  externalToHub?: boolean;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b10]";

const SECTION_SHELL = "rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-4 sm:p-5 shadow-sm shadow-black/20";

const ACCES_SECURITE: HubCard[] = [
  {
    href: "/admin/gestion-acces/comptes",
    title: "Comptes administrateurs",
    description: "Ajouter, modifier ou retirer les accès Discord à l’espace admin.",
    badge: "Fondateur",
  },
  {
    href: "/admin/gestion-acces/permissions",
    title: "Permissions par section",
    description: "Droits par page et par rôle (RBAC), alignés sur la navigation.",
    badge: "Sensible",
  },
  {
    href: "/admin/gestion-acces/admin-avance",
    title: "Accès admin avancé",
    description: "Mode avancé temporaire ou renouvelable, réservé aux fondateurs.",
    badge: "Critique",
  },
];

const CONFIG_SITE: HubCard[] = [
  {
    href: "/admin/gestion-acces/dashboard",
    title: "Dashboard membre",
    description: "Données et graphiques affichés sur le tableau de bord côté membre.",
    badge: "Données",
  },
  {
    href: "/admin/gestion-acces/images",
    title: "Images profils Twitch",
    description: "Synchronisation et qualité des avatars en base.",
    badge: "Données",
  },
  {
    href: "/admin/migration",
    title: "Migration des données",
    description: "Contrôle des synchronisations legacy vers Supabase.",
    badge: "Hors hub",
    externalToHub: true,
  },
];

const EQUIPE_STAFF: HubCard[] = [
  {
    href: "/admin/gestion-acces/organigramme-staff",
    title: "Organigramme staff",
    description: "Rôles, pôles et visibilité publique de l’équipe.",
    badge: "Staff",
  },
  {
    href: "/admin/gestion-acces/missions-staff",
    title: "Missions staff",
    description: "Missions nominatives visibles sur « Mon compte » du destinataire.",
    badge: "Staff",
  },
  {
    href: "/admin/gestion-acces/reunions-staff-mensuelles",
    title: "Réunions mensuelles staff",
    description: "Comptes rendus, discours et intervenants par réunion.",
    badge: "Staff",
  },
  {
    href: "/admin/follow/config",
    title: "Configuration follow staff",
    description: "Paramètres des feuilles de suivi staff.",
    badge: "Hors hub",
    externalToHub: true,
  },
];

const ACTIVITE_DONNEES: HubCard[] = [
  {
    href: "/admin/gestion-acces/discord-activite",
    title: "Activité Discord (mois & salons)",
    description: "Volumes mensuels, salons, staff vs communauté.",
    badge: "Données",
  },
  {
    href: "/admin/gestion-acces/discord-activite-personnelle",
    title: "Activité Discord personnelle",
    description: "Écrit et vocal par membre sur une période.",
    badge: "Données",
  },
];

const AUDIT_CONFORMITE: HubCard[] = [
  { href: "/admin/audit-logs", title: "Audit & logs", description: "Vue d’ensemble des journaux d’audit.", badge: "Hors hub", externalToHub: true },
  { href: "/admin/audit-logs/connexions", title: "Logs de connexion", description: "Connexions et sessions.", badge: "Audit", externalToHub: true },
  { href: "/admin/audit-logs/membres", title: "Logs membres", description: "Actions liées aux fiches membres.", badge: "Audit", externalToHub: true },
  { href: "/admin/audit-logs/historique-pages", title: "Historique des pages", description: "Navigation et pages vues.", badge: "Audit", externalToHub: true },
  { href: "/admin/audit-logs/temps-reel", title: "Temps réel", description: "Activité live dans l’admin.", badge: "Audit", externalToHub: true },
  { href: "/admin/gestion-acces/retours-faq", title: "Retours FAQ rejoindre", description: "Messages envoyés depuis la FAQ publique « Rejoindre ».", badge: "Support" },
  { href: "/admin/log-center", title: "Logs & audit (legacy)", description: "Ancienne entrée conservée pour compatibilité.", badge: "Legacy", externalToHub: true },
  { href: "/admin/log-center/notifications-lues", title: "Notifications lues (legacy)", description: "Historique des notifications lues.", badge: "Legacy", externalToHub: true },
];

function SectionBlock({
  title,
  icon: Icon,
  cards,
}: {
  title: string;
  icon: LucideIcon;
  cards: HubCard[];
}) {
  return (
    <section className={SECTION_SHELL}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-100 sm:text-lg">
          <Icon className="h-5 w-5 shrink-0 text-violet-300/90" aria-hidden />
          {title}
        </h2>
        <span className="rounded-full border border-zinc-700/80 bg-zinc-900/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          {cards.length} lien{cards.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`group flex flex-col rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-4 transition hover:border-violet-500/35 hover:bg-violet-950/15 ${focusRing}`}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {card.badge ? (
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    card.badge === "Critique" || card.badge === "Fondateur"
                      ? "border-rose-500/35 bg-rose-500/10 text-rose-200"
                      : card.badge === "Sensible"
                        ? "border-amber-500/35 bg-amber-500/10 text-amber-100"
                        : card.badge === "Legacy"
                          ? "border-zinc-600/50 bg-zinc-800/80 text-zinc-400"
                          : card.badge === "Hors hub"
                            ? "border-sky-500/30 bg-sky-500/10 text-sky-100"
                            : "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
                  }`}
                >
                  {card.badge}
                </span>
              ) : null}
            </div>
            <h3 className="text-sm font-semibold text-white group-hover:text-violet-100 sm:text-[15px]">{card.title}</h3>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-zinc-400 sm:text-sm">{card.description}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-300/90">
              Ouvrir
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "ok" | "warn" | "danger";
}) {
  const toneClass =
    tone === "ok"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
      : tone === "warn"
        ? "border-amber-500/35 bg-amber-500/10 text-amber-100"
        : tone === "danger"
          ? "border-rose-500/35 bg-rose-500/10 text-rose-100"
          : "border-zinc-700/80 bg-zinc-900/60 text-zinc-200";

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export default function AdministrationSiteHomeDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
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

  const load = useCallback(async () => {
    setLoading(true);
    setFaqError(false);
    try {
      const [roleRes, advancedRes, accessRes, faqRes] = await Promise.all([
        fetch("/api/user/role", { cache: "no-store" }),
        fetch("/api/admin/advanced-access?check=1", { cache: "no-store" }),
        fetch("/api/admin/access", { cache: "no-store", headers: { "Cache-Control": "no-cache" } }),
        fetch("/api/admin/rejoindre/faq-contact", { cache: "no-store" }),
      ]);

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

  return (
    <div className="space-y-6 text-zinc-100">
      <header className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-zinc-950/95 via-zinc-950/90 to-violet-950/20 px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300/90">Administration du site</p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">Accueil administration</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Accès, sécurité, configuration, staff, données Discord et conformité — même périmètre que la barre latérale.
            </p>
            {roleLabel ? (
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Rôle détecté : {roleLabel}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className={`inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-violet-500/35 bg-violet-950/40 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:bg-violet-900/50 disabled:opacity-50 ${focusRing}`}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
            Actualiser
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatTile
            label="Accès admin avancé"
            value={advancedEnabled ? "Autorisé" : "Verrouillé"}
            tone={advancedEnabled ? "ok" : "warn"}
          />
          {accessMetrics ? (
            <>
              <StatTile label="Comptes administrateurs" value={String(accessMetrics.total)} hint="Liste complète (fondateurs)" tone="neutral" />
              <StatTile
                label="Charte modération"
                value={`${accessMetrics.charterOk} signée`}
                hint={`${accessMetrics.charterMissing} non / inconnu`}
                tone={accessMetrics.charterMissing > 0 ? "warn" : "ok"}
              />
              <StatTile
                label="Alias admin"
                value={`${accessMetrics.noAlias} sans pseudo`}
                hint="Pseudo affiché dans l’admin"
                tone={accessMetrics.noAlias > 0 ? "warn" : "ok"}
              />
            </>
          ) : (
            <StatTile
              label="Comptes administrateurs"
              value="—"
              hint="Métriques réservées aux fondateurs (liste des accès)."
              tone="neutral"
            />
          )}
          {faqStats ? (
            <StatTile
              label="Retours FAQ"
              value={faqAttention != null ? `${faqAttention} à traiter` : "Rien en attente"}
              hint={`${faqStats.new} nouveau(x) · ${faqStats.inProgress} en cours`}
              tone={faqAttention != null ? "warn" : "ok"}
            />
          ) : (
            <StatTile
              label="Retours FAQ"
              value={faqError ? "Indisponible" : "—"}
              hint={faqError ? "Erreur de chargement ou accès refusé." : "Chargement ou non applicable."}
              tone={faqError ? "danger" : "neutral"}
            />
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/gestion-acces/comptes"
            className={`inline-flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-600/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-600/30 ${focusRing}`}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Comptes administrateurs
          </Link>
          <Link
            href="/admin/gestion-acces/permissions"
            className={`inline-flex items-center gap-2 rounded-xl border border-zinc-600/90 bg-zinc-900/80 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-violet-500/30 ${focusRing}`}
          >
            <Lock className="h-4 w-4 text-violet-300" aria-hidden />
            Permissions
          </Link>
          <Link
            href="/admin/gestion-acces/dashboard"
            className={`inline-flex items-center gap-2 rounded-xl border border-zinc-600/90 bg-zinc-900/80 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-violet-500/30 ${focusRing}`}
          >
            <BarChart3 className="h-4 w-4 text-violet-300" aria-hidden />
            Dashboard membre
          </Link>
          <Link
            href="/admin/audit-logs"
            className={`inline-flex items-center gap-2 rounded-xl border border-zinc-600/90 bg-zinc-900/80 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-violet-500/30 ${focusRing}`}
          >
            <FileSearch className="h-4 w-4 text-violet-300" aria-hidden />
            Audit & logs
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className={`${SECTION_SHELL} border-amber-500/15`}>
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-100/95">
            <ClipboardList className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
            À traiter
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-zinc-400 sm:text-sm">
            {accessMetrics && accessMetrics.noAlias > 0 ? (
              <li>
                <Link href="/admin/gestion-acces/comptes" className="text-violet-300 underline-offset-2 hover:underline">
                  {accessMetrics.noAlias} compte(s) sans pseudo admin
                </Link>
              </li>
            ) : accessMetrics ? (
              <li className="text-zinc-500">Tous les comptes ont un alias ou la liste est vide.</li>
            ) : (
              <li className="text-zinc-500">Ouvre « Comptes administrateurs » (fondateurs) pour la liste détaillée.</li>
            )}
            {accessMetrics && accessMetrics.charterMissing > 0 ? (
              <li>
                <span className="text-amber-200/90">{accessMetrics.charterMissing} charte(s) non validée(s)</span> — vérifier
                dans la liste des comptes.
              </li>
            ) : accessMetrics ? (
              <li className="text-zinc-500">Charte : aucun manquant détecté sur la liste chargée.</li>
            ) : null}
            {faqAttention != null ? (
              <li>
                <Link href="/admin/gestion-acces/retours-faq" className="text-violet-300 underline-offset-2 hover:underline">
                  {faqAttention} retour(s) FAQ à traiter
                </Link>
              </li>
            ) : faqStats ? (
              <li className="text-zinc-500">Aucun retour FAQ en attente immédiate.</li>
            ) : (
              <li className="text-zinc-500">Retours FAQ : métrique non chargée.</li>
            )}
          </ul>
        </div>
        <div className={`${SECTION_SHELL} border-violet-500/15`}>
          <p className="flex items-center gap-2 text-sm font-semibold text-violet-100/95">
            <Shield className="h-4 w-4 shrink-0 text-violet-300" aria-hidden />
            Sécurité
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-zinc-400 sm:text-sm">
            <li>Accès avancé : {advancedEnabled ? "activé pour ton compte" : "non activé"}.</li>
            <li>
              <Link href="/admin/gestion-acces/admin-avance" className="text-violet-300 underline-offset-2 hover:underline">
                Gérer les accès admin avancés
              </Link>{" "}
              (fondateurs).
            </li>
          </ul>
        </div>
        <div className={`${SECTION_SHELL} border-slate-600/40`}>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <ScrollText className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            Audit & traces
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-zinc-400 sm:text-sm">
            <li>
              <Link href="/admin/audit-logs" className="text-violet-300 underline-offset-2 hover:underline">
                Centre d&apos;audit
              </Link>{" "}
              (connexions, membres, historique, temps réel).
            </li>
            <li className="text-zinc-500">Pas d&apos;aperçu des dernières lignes sur cette page (évite les faux compteurs).</li>
          </ul>
        </div>
      </div>

      <SectionBlock title="Accès & sécurité" icon={Lock} cards={ACCES_SECURITE} />
      <SectionBlock title="Configuration du site" icon={SlidersHorizontal} cards={CONFIG_SITE} />
      <SectionBlock title="Équipe staff" icon={Users} cards={EQUIPE_STAFF} />
      <SectionBlock title="Activité & données" icon={MessageSquare} cards={ACTIVITE_DONNEES} />
      <SectionBlock title="Audit & conformité" icon={FileSearch} cards={AUDIT_CONFORMITE} />
    </div>
  );
}
