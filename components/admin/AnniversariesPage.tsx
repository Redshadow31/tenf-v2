"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Cake,
  CalendarHeart,
  CalendarRange,
  ChevronLeft,
  Compass,
  ListOrdered,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { getRoleBadgeLabel } from "@/lib/roleBadgeSystem";

type TabKey = "birthday" | "affiliate";
type Scope = "month" | "all";

type Member = {
  id?: string;
  twitchLogin?: string;
  displayName?: string;
  discordUsername?: string;
  discordId?: string;
  role?: string;
  avatar?: string;
  birthday?: string;
  twitchAffiliateDate?: string;
};

type AnniversariesPageProps = {
  scope: Scope;
  backHref: string;
  backLabel: string;
  title: string;
  description: string;
};

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] p-5 md:p-6 shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] p-5 shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const layoutPanelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";
const heroVisualClass =
  "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const hubSubtleBtnClass =
  "inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const monthAsideSteps = [
  {
    n: "1",
    title: "Choisir l’onglet",
    body: "Anniversaire personnel ou affiliation Twitch : les effectifs s’affichent sur chaque onglet.",
  },
  {
    n: "2",
    title: "Filtrer & préparer",
    body: "Recherche par pseudo, Discord ou rôle ; prépare les messages dans les 24 h autour de la date.",
  },
  {
    n: "3",
    title: "Coordonner",
    body: "Aligner animation staff et communication Discord pour éviter doublons ou oublis.",
  },
];

const allAsideSteps = [
  {
    n: "1",
    title: "Parcourir l’historique",
    body: "Trie chronologique par mois/jour pour anticiper les prochaines célébrations.",
  },
  {
    n: "2",
    title: "Repérer les trous",
    body: "Dates manquantes en fiche membre : compléter avant la campagne du mois.",
  },
  {
    n: "3",
    title: "Capitaliser",
    body: "Réutiliser les formats qui ont bien fonctionné pour les prochains rituels TENF.",
  },
];

function safeDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sortByMonthDay(list: Member[], key: "birthday" | "twitchAffiliateDate"): Member[] {
  return [...list].sort((a, b) => {
    const da = safeDate(a[key]);
    const db = safeDate(b[key]);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;

    const aMonth = da.getUTCMonth();
    const bMonth = db.getUTCMonth();
    if (aMonth !== bMonth) return aMonth - bMonth;

    return da.getUTCDate() - db.getUTCDate();
  });
}

function filterByCurrentMonth(list: Member[], key: "birthday" | "twitchAffiliateDate"): Member[] {
  const currentMonth = new Date().getMonth();
  return list.filter((member) => {
    const date = safeDate(member[key]);
    if (!date) return false;
    return date.getUTCMonth() === currentMonth;
  });
}

function formatDateWithYear(value?: string): string {
  const date = safeDate(value);
  if (!date) return "Date non renseignée";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function computeAgeYears(iso?: string, ref: Date = new Date()): number | null {
  const d = safeDate(iso);
  if (!d) return null;
  if (d.getTime() > ref.getTime()) return null;
  let age = ref.getUTCFullYear() - d.getUTCFullYear();
  const md = ref.getUTCMonth() - d.getUTCMonth();
  if (md < 0 || (md === 0 && ref.getUTCDate() < d.getUTCDate())) age -= 1;
  return age >= 0 ? age : null;
}

function formatAffiliationTenure(iso?: string, ref: Date = new Date()): string | null {
  const d = safeDate(iso);
  if (!d) return null;
  if (d.getTime() > ref.getTime()) return null;
  let years = ref.getUTCFullYear() - d.getUTCFullYear();
  const md = ref.getUTCMonth() - d.getUTCMonth();
  if (md < 0 || (md === 0 && ref.getUTCDate() < d.getUTCDate())) years -= 1;
  if (years < 0) return null;
  if (years === 0) return "Moins d'un an";
  return years === 1 ? "1 an d'affiliation" : `${years} ans d'affiliation`;
}

function formatCurrentMonthLabel(): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date());
}

function MemberCard({
  member,
  dateKey,
  badgeLabel,
  hubLayout,
}: {
  member: Member;
  dateKey: "birthday" | "twitchAffiliateDate";
  badgeLabel: string;
  hubLayout: boolean;
}) {
  const memberLabel = member.displayName || member.twitchLogin || "Membre";
  const twitch = member.twitchLogin ? `@${member.twitchLogin}` : "Sans login Twitch";
  const roleLabel = member.role ? getRoleBadgeLabel(member.role) : null;
  const rawDate = member[dateKey];
  const ageYears = dateKey === "birthday" ? computeAgeYears(rawDate) : null;
  const affiliationLine = dateKey === "twitchAffiliateDate" ? formatAffiliationTenure(rawDate) : null;

  const cardClass = hubLayout
    ? "rounded-xl border border-white/[0.08] bg-zinc-900/45 p-4 flex items-center gap-4 transition hover:border-violet-400/28 hover:bg-zinc-900/70 hover:shadow-[0_12px_36px_rgba(2,6,23,0.45)]"
    : "rounded-xl border border-[#353a50] bg-[#121623]/85 p-4 flex items-center gap-4 hover:border-indigo-300/35 transition-colors";

  const badgeClass = hubLayout
    ? "inline-flex px-2 py-1 rounded-md text-xs font-medium bg-violet-500/15 text-violet-100 border border-violet-400/30"
    : "inline-flex px-2 py-1 rounded-md text-xs font-medium bg-[#2a2440] text-[#c4a8ff] border border-[#5f3fb0]";

  return (
    <div className={cardClass}>
      <img
        src={member.avatar || `https://placehold.co/64x64?text=${memberLabel.charAt(0).toUpperCase()}`}
        alt={memberLabel}
        className={`h-12 w-12 shrink-0 rounded-full object-cover ${hubLayout ? "border border-violet-400/25" : "border border-indigo-300/30"}`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">{memberLabel}</p>
        <p className="truncate text-sm text-gray-400">{twitch}</p>
        {member.discordUsername ? <p className="truncate text-xs text-gray-500">Discord : {member.discordUsername}</p> : null}
        {roleLabel ? (
          <p className="mt-0.5 truncate text-xs text-indigo-200/90" title="Rôle issu de la fiche membre (sync Discord)">
            Rôle : {roleLabel}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-gray-600">Rôle : non renseigné</p>
        )}
      </div>
      <div className="max-w-[min(100%,11rem)] shrink-0 text-right">
        <span className={badgeClass}>{badgeLabel}</span>
        <p className="mt-2 text-sm leading-snug text-white">{formatDateWithYear(rawDate)}</p>
        {dateKey === "birthday" && ageYears !== null ? <p className="mt-1 text-xs text-sky-200/90">Âge : {ageYears} ans</p> : null}
        {dateKey === "twitchAffiliateDate" && affiliationLine ? (
          <p className="mt-1 text-xs text-cyan-200/90">{affiliationLine}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function AnniversariesPage({
  scope,
  backHref,
  backLabel,
  title,
  description,
}: AnniversariesPageProps) {
  const pathname = usePathname() || "";
  const hubLayout = pathname.startsWith("/admin/communaute/anniversaires");

  const [members, setMembers] = useState<Member[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("birthday");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/members", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Impossible de charger les membres");
      }
      const data = await response.json();
      setMembers(Array.isArray(data.members) ? data.members : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const birthdays = useMemo(() => {
    const list = scope === "month" ? filterByCurrentMonth(members, "birthday") : members.filter((m) => !!safeDate(m.birthday));
    return sortByMonthDay(list, "birthday");
  }, [members, scope]);

  const affiliateAnniversaries = useMemo(() => {
    const list =
      scope === "month"
        ? filterByCurrentMonth(members, "twitchAffiliateDate")
        : members.filter((m) => !!safeDate(m.twitchAffiliateDate));
    return sortByMonthDay(list, "twitchAffiliateDate");
  }, [members, scope]);

  const visibleList = activeTab === "birthday" ? birthdays : affiliateAnniversaries;
  const badgeLabel = activeTab === "birthday" ? "Anniversaire" : "Anniversaire d'affiliation";
  const dateKey = activeTab === "birthday" ? "birthday" : "twitchAffiliateDate";

  const filteredVisibleList = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return visibleList;
    return visibleList.filter((m) => {
      const rolePretty = m.role ? getRoleBadgeLabel(m.role).toLowerCase() : "";
      const haystack = [m.displayName, m.twitchLogin, m.discordUsername, m.discordId, m.role, rolePretty]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [visibleList, memberSearch]);

  const monthLabel = formatCurrentMonthLabel();
  const coveragePercent =
    birthdays.length + affiliateAnniversaries.length > 0
      ? Math.min(
          100,
          Math.round((Math.max(birthdays.length, affiliateAnniversaries.length) / (birthdays.length + affiliateAnniversaries.length)) * 100)
        )
      : 0;

  const hubPanel = hubLayout ? layoutPanelClass : sectionCardClass;
  const asideSteps = scope === "month" ? monthAsideSteps : allAsideSteps;
  const hubBackHref = "/admin/communaute/anniversaires";
  const tousHref = "/admin/communaute/anniversaires/tous";
  const moisHref = "/admin/communaute/anniversaires/mois";

  const tabBase = hubLayout
    ? `px-4 py-2 rounded-lg border text-sm font-medium transition ${focusRingClass}`
    : "px-4 py-2 rounded-lg border text-sm font-medium transition-colors";
  const tabActive = hubLayout
    ? "border-violet-400/50 bg-violet-500/20 text-violet-50"
    : "bg-[linear-gradient(145deg,rgba(99,102,241,0.28),rgba(79,70,229,0.18))] border-indigo-300/45 text-white";
  const tabInactive = hubLayout
    ? "border-white/10 bg-zinc-900/50 text-zinc-300 hover:border-violet-400/25 hover:text-white"
    : "bg-[#1a1a1d] border-gray-700 text-gray-300 hover:text-white";

  const searchInputClass = hubLayout
    ? "w-full rounded-lg border border-white/[0.1] bg-zinc-900/55 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-violet-400/45 focus:outline-none focus:ring-2 focus:ring-violet-400/35"
    : "w-full rounded-lg border border-[#3b3f54] bg-[#121623]/90 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400/50 focus:outline-none focus:ring-1 focus:ring-indigo-400/30";

  const mainContent = (
    <>
      {loadErrorBlock(error)}
      {loading ? (
        <div className={`${hubPanel} text-gray-400`}>Chargement des membres...</div>
      ) : null}
      {!loading && !error && visibleList.length === 0 ? (
        <div className={`${hubPanel} text-gray-400`}>Aucun membre trouvé pour cet onglet.</div>
      ) : null}
      {!loading && !error && visibleList.length > 0 && filteredVisibleList.length === 0 ? (
        <div className={`${hubPanel} text-amber-100/90`}>
          Aucun membre ne correspond à « {memberSearch.trim()} ». Essaie un autre pseudo, login Twitch ou rôle.
        </div>
      ) : null}
      {!loading && !error && filteredVisibleList.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredVisibleList.map((member) => (
            <MemberCard
              key={`${member.id || member.twitchLogin || member.displayName}-${member[dateKey] || "date"}`}
              member={member}
              dateKey={dateKey}
              badgeLabel={badgeLabel}
              hubLayout={hubLayout}
            />
          ))}
        </div>
      ) : null}
    </>
  );

  if (!hubLayout) {
    return (
      <div className="space-y-6 text-white">
        <section className={glassCardClass}>
          <Link href={backHref} className="mb-4 inline-block text-gray-300 transition-colors hover:text-white">
            ← {backLabel}
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Anniversaires communauté</p>
              <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
                {title}
              </h1>
              <p className="mt-3 text-sm text-slate-300">{description}</p>
            </div>
            <div className="rounded-xl border border-indigo-300/25 bg-[#101522]/70 px-4 py-3 text-sm text-indigo-100">
              <p className="text-xs uppercase tracking-[0.1em] text-indigo-200/80">Période active</p>
              <p className="mt-1">{scope === "month" ? monthLabel : "Historique complet"}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <article className={sectionCardClass}>
            <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Anniversaires</p>
            <p className="mt-2 text-3xl font-semibold text-fuchsia-200">{birthdays.length}</p>
            <p className="mt-1 text-xs text-slate-400">Membres à célébrer</p>
          </article>
          <article className={sectionCardClass}>
            <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Affiliations Twitch</p>
            <p className="mt-2 text-3xl font-semibold text-sky-300">{affiliateAnniversaries.length}</p>
            <p className="mt-1 text-xs text-slate-400">Moments à valoriser</p>
          </article>
          <article className={sectionCardClass}>
            <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Lecture rapide</p>
            <div className="mt-2 h-2 rounded-full bg-slate-800/80">
              <div
                className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(244,114,182,0.95),rgba(56,189,248,0.95))]"
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-300">Visibilité planning: {coveragePercent}%</p>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
          <article className={sectionCardClass}>
            <h2 className="text-lg font-semibold text-slate-100">Mode d&apos;emploi</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <p className="rounded-lg border border-indigo-300/30 bg-indigo-300/10 px-3 py-2 text-indigo-100">
                1. Vérifier les anniversaires du mois pour préparer les messages personnalisés.
              </p>
              <p className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-cyan-100">
                2. Mettre en avant les affiliations Twitch dans les moments de communauté.
              </p>
              <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-amber-100">
                3. Utiliser l&apos;historique pour anticiper les prochaines célébrations.
              </p>
            </div>
          </article>
          <article className={sectionCardClass}>
            <h2 className="text-lg font-semibold text-slate-100">Repères opérationnels</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <p className="rounded-lg border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-2 text-fuchsia-100">
                <CalendarHeart className="mr-1 inline h-4 w-4" />
                Célébrer dans les 24h pour maximiser l&apos;impact.
              </p>
              <p className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-emerald-100">
                <Users className="mr-1 inline h-4 w-4" />
                Coordonner staff animation + communication.
              </p>
              <p className="rounded-lg border border-sky-300/30 bg-sky-300/10 px-3 py-2 text-sky-100">
                <Sparkles className="mr-1 inline h-4 w-4" />
                Réutiliser les templates pour gagner du temps.
              </p>
            </div>
          </article>
        </section>

        <div className={`${sectionCardClass} space-y-3`}>
          <SearchField memberSearch={memberSearch} setMemberSearch={setMemberSearch} inputClass={searchInputClass} />
          {memberSearch.trim() && visibleList.length > 0 ? (
            <p className="text-xs text-slate-400">
              {filteredVisibleList.length} résultat{filteredVisibleList.length !== 1 ? "s" : ""} sur {visibleList.length} dans cet onglet
            </p>
          ) : null}
        </div>

        <div className={`${sectionCardClass} flex gap-2`}>
          <button type="button" onClick={() => setActiveTab("birthday")} className={`${tabBase} ${activeTab === "birthday" ? tabActive : tabInactive}`}>
            Anniversaire ({birthdays.length})
          </button>
          <button type="button" onClick={() => setActiveTab("affiliate")} className={`${tabBase} ${activeTab === "affiliate" ? tabActive : tabInactive}`}>
            Anniversaire d&apos;affiliation ({affiliateAnniversaries.length})
          </button>
        </div>

        {mainContent}
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] min-w-0 scroll-smooth pb-12 text-white selection:bg-violet-500/35 [--ann-gap:clamp(1rem,1.55vw,1.85rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[max(-4rem,calc(-6vw))] top-[-2.5rem] -z-10 h-[clamp(240px,32vw,440px)] overflow-hidden blur-3xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_24%_-8%,rgba(244,114,182,0.22),transparent_54%),radial-gradient(ellipse_at_86%_22%,rgba(167,139,250,0.2),transparent_48%),radial-gradient(ellipse_at_52%_100%,rgba(56,189,248,0.1),transparent_52%)]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-20 h-[min(820px,100vh)]"
        style={{
          backgroundImage:
            "linear-gradient(104deg,rgba(255,255,255,0.032) 0px,rgba(255,255,255,0.032) 1px,transparent 1px,transparent 74px)",
          backgroundSize: "clamp(54px,4.2vw,72px) 100%",
          opacity: 0.21,
          maskImage: "linear-gradient(180deg,black 0%,transparent 78%)",
        }}
      />

      <div className="mx-auto w-full max-w-[min(1720px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] px-[clamp(0.75rem,2vw,2.35rem)] pb-12 pt-2 sm:pt-3">
        <div className="grid min-w-0 grid-cols-1 gap-6 [--sidebar:min(100%,clamp(17rem,24vw,25rem))] xl:grid-cols-[minmax(0,1fr)_var(--sidebar)] xl:items-start xl:gap-[clamp(1.35rem,2.6vw,2.85rem)]">
          <main className="min-w-0 space-y-6 sm:space-y-8 xl:space-y-[var(--ann-gap)]">
            <header
              className={`grid min-w-0 gap-6 p-[clamp(1rem,2vw,1.6rem)] lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,min(100%,0.94fr))] lg:gap-8 ${layoutPanelClass}`}
            >
              <div className="min-w-0 space-y-4">
                <Link
                  href={hubBackHref}
                  className={`inline-flex items-center gap-1 text-[length:clamp(0.8rem,0.74rem+0.32vw,0.9375rem)] text-zinc-400 transition hover:text-white ${focusRingClass} rounded-lg`}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                  Retour pilier Anniversaires
                </Link>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/28 bg-fuchsia-500/[0.08] px-3 py-1 text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.11em] text-fuchsia-100/90">
                    <Cake className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Reconnaissance TENF
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/26 bg-violet-500/[0.1] px-3 py-1 text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.11em] text-violet-100/92">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Pilotage staff
                  </span>
                </div>
                <div>
                  <p className="text-[length:clamp(0.6875rem,0.625rem+0.25vw,0.8125rem)] uppercase tracking-[0.12em] text-violet-200/95">
                    {scope === "month" ? "Vue mensuelle" : "Historique complet"}
                  </p>
                  <h1 className="mt-2 flex flex-wrap items-center gap-3 text-[clamp(1.45rem,1.05rem+1.05vw,2.35rem)] font-semibold tracking-tight text-white">
                    <CalendarHeart className="h-8 w-8 shrink-0 text-fuchsia-300/90 md:h-9 md:w-9" aria-hidden />
                    {title}
                  </h1>
                  <p className="mt-3 max-w-3xl text-[length:clamp(0.8125rem,0.75rem+0.32vw,0.9625rem)] leading-[1.65] text-zinc-400">
                    {description}
                  </p>
                </div>
                <div className="flex min-w-0 flex-wrap gap-[clamp(0.4rem,0.85vw,0.625rem)]">
                  <button type="button" onClick={() => void loadMembers()} className={`${hubSubtleBtnClass} ${focusRingClass}`}>
                    <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} aria-hidden />
                    Actualiser
                  </button>
                  {scope === "month" ? (
                    <Link href={tousHref} className={`${hubSubtleBtnClass} ${focusRingClass} border-sky-400/28 bg-sky-950/[0.35] text-sky-100`}>
                      <CalendarRange className="h-4 w-4 shrink-0" aria-hidden />
                      Tous les anniversaires
                    </Link>
                  ) : (
                    <Link href={moisHref} className={`${hubSubtleBtnClass} ${focusRingClass} border-fuchsia-400/28 bg-fuchsia-950/[0.35] text-fuchsia-100`}>
                      <CalendarHeart className="h-4 w-4 shrink-0" aria-hidden />
                      Mois en cours
                    </Link>
                  )}
                </div>
              </div>
              <div className={`relative min-h-[11rem] p-[clamp(0.875rem,1.5vw,1.2rem)] sm:min-h-[12rem] ${heroVisualClass}`}>
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[conic-gradient(from_200deg_at_72%_-10%,rgba(244,114,182,0.14),transparent_42%,transparent_58%,rgba(167,139,250,0.12))]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.12),transparent_40%,transparent_65%,rgba(0,0,0,0.32))]"
                />
                <div className="relative flex h-full min-h-[10rem] flex-col justify-between gap-4">
                  <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-violet-400/26 bg-violet-500/[0.11] px-3 py-1.5 text-[length:clamp(0.65rem,0.55rem+0.35vw,0.7rem)] font-semibold uppercase tracking-[0.08em] text-violet-50/96">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-200/92" aria-hidden />
                    Synthèse
                  </span>
                  <dl className="grid min-w-0 grid-cols-3 gap-[clamp(0.45rem,0.9vw,0.65rem)] text-[length:clamp(0.65rem,0.58rem+0.22vw,0.775rem)]">
                    <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                      <dt className="font-medium uppercase tracking-wide text-zinc-500">Anniv.</dt>
                      <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-fuchsia-200/95">
                        {birthdays.length}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                      <dt className="font-medium uppercase tracking-wide text-zinc-500">Affil.</dt>
                      <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-sky-200/95">
                        {affiliateAnniversaries.length}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                      <dt className="font-medium uppercase tracking-wide text-zinc-500">Période</dt>
                      <dd className="mt-1 text-[length:clamp(0.72rem,0.65rem+0.25vw,0.85rem)] font-semibold leading-tight text-amber-200/95">
                        {scope === "month" ? monthLabel : "Tout"}
                      </dd>
                    </div>
                  </dl>
                  <p className="text-[length:clamp(0.65rem,0.58rem+0.2vw,0.75rem)] leading-snug text-zinc-500">
                    Résultat recherche :{" "}
                    <span className="font-semibold tabular-nums text-zinc-200">{filteredVisibleList.length}</span>
                    <span className="mx-1.5 text-zinc-600">·</span>
                    Onglet : <span className="font-medium text-zinc-300">{activeTab === "birthday" ? "Anniversaire" : "Affiliation"}</span>
                  </p>
                </div>
              </div>
            </header>

            <section className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3" aria-label="Repères anniversaires">
              <button
                type="button"
                onClick={() => setActiveTab("birthday")}
                className={`${hubPanel} min-w-0 p-4 text-left transition hover:shadow-[0_12px_36px_rgba(2,6,23,0.5)] hover:border-fuchsia-400/30 ${focusRingClass} ${
                  activeTab === "birthday" ? "ring-2 ring-fuchsia-400/45 ring-offset-2 ring-offset-zinc-950" : ""
                }`}
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Anniversaires</p>
                <p className="mt-2 text-[clamp(1.25rem,1rem+0.6vw,1.75rem)] font-semibold text-fuchsia-200">{birthdays.length}</p>
                <p className="mt-1 text-xs text-zinc-500">Cliquer pour l&apos;onglet</p>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("affiliate")}
                className={`${hubPanel} min-w-0 p-4 text-left transition hover:shadow-[0_12px_36px_rgba(2,6,23,0.5)] hover:border-sky-400/30 ${focusRingClass} ${
                  activeTab === "affiliate" ? "ring-2 ring-sky-400/45 ring-offset-2 ring-offset-zinc-950" : ""
                }`}
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Affiliations Twitch</p>
                <p className="mt-2 text-[clamp(1.25rem,1rem+0.6vw,1.75rem)] font-semibold text-sky-300">{affiliateAnniversaries.length}</p>
                <p className="mt-1 text-xs text-zinc-500">Moments à valoriser</p>
              </button>
              <article className={`${hubPanel} min-w-0 p-4`}>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Équilibre onglets</p>
                <div className="mt-2 h-2 rounded-full bg-zinc-800/80">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(244,114,182,0.95),rgba(56,189,248,0.95))]"
                    style={{ width: `${coveragePercent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-400">Répartition relative : {coveragePercent}%</p>
              </article>
            </section>

            <div className={`${hubPanel} space-y-3 p-5`}>
              <SearchField memberSearch={memberSearch} setMemberSearch={setMemberSearch} inputClass={searchInputClass} />
              {memberSearch.trim() && visibleList.length > 0 ? (
                <p className="text-xs text-zinc-500">
                  {filteredVisibleList.length} résultat{filteredVisibleList.length !== 1 ? "s" : ""} sur {visibleList.length} dans cet onglet
                </p>
              ) : null}
            </div>

            <div className={`${hubPanel} flex flex-wrap gap-2 p-4`}>
              <button type="button" onClick={() => setActiveTab("birthday")} className={`${tabBase} ${activeTab === "birthday" ? tabActive : tabInactive}`}>
                Anniversaire ({birthdays.length})
              </button>
              <button type="button" onClick={() => setActiveTab("affiliate")} className={`${tabBase} ${activeTab === "affiliate" ? tabActive : tabInactive}`}>
                Anniversaire d&apos;affiliation ({affiliateAnniversaries.length})
              </button>
            </div>

            {mainContent}
          </main>

          <aside className="min-w-0 space-y-4 xl:sticky xl:top-5 xl:self-start" aria-label="Aide anniversaires">
            <div className={`${layoutPanelClass} space-y-3 p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                <Compass className="h-4 w-4 shrink-0 text-violet-300/85" aria-hidden />
                Astuce équipe
              </p>
              <p className="text-[length:clamp(0.75rem,0.68rem+0.28vw,0.8625rem)] leading-[1.6] text-zinc-400">
                Célébrer dans les 24 h autour de la date maximise l&apos;impact ; coordonnez animation et communication pour éviter les
                doublons Discord.
              </p>
            </div>

            <div className={`${layoutPanelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                <ListOrdered className="h-4 w-4 shrink-0 text-violet-300/85" aria-hidden />
                En trois gestes
              </p>
              <ol className="mt-4 space-y-[0.65rem]">
                {asideSteps.map((step) => (
                  <li key={step.n} className="flex min-w-0 gap-3">
                    <span
                      aria-hidden
                      className="flex h-[2.125em] min-w-[2.125em] items-center justify-center rounded-lg border border-violet-500/28 bg-violet-500/[0.09] text-[length:clamp(0.65rem,0.58rem+0.22vw,0.75rem)] font-bold tabular-nums text-violet-50"
                    >
                      {step.n}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-semibold text-zinc-100">{step.title}</p>
                      <p className="mt-1 text-[length:clamp(0.6875rem,0.62rem+0.2vw,0.8rem)] leading-[1.55] text-zinc-500">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className={`${layoutPanelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Modules proches
              </p>
              <nav className="mt-3 flex flex-col gap-2" aria-label="Liens pilier anniversaires">
                {scope === "month" ? (
                  <Link
                    href={tousHref}
                    className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-sky-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                  >
                    Tous les anniversaires
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  </Link>
                ) : (
                  <Link
                    href={moisHref}
                    className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-fuchsia-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                  >
                    Anniversaires du mois
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  </Link>
                )}
                <Link
                  href={hubBackHref}
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-violet-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  Pilier Anniversaires
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
                <Link
                  href="/admin/communaute/evenements"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-indigo-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  Hub événements
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
                <Link
                  href="/admin/communaute"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-white/14 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <Cake className="h-4 w-4 shrink-0 opacity-85" aria-hidden />
                    Hub Animation
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SearchField({
  memberSearch,
  setMemberSearch,
  inputClass,
}: {
  memberSearch: string;
  setMemberSearch: (v: string) => void;
  inputClass: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
      <input
        type="search"
        value={memberSearch}
        onChange={(e) => setMemberSearch(e.target.value)}
        placeholder="Rechercher un membre (pseudo, Twitch, Discord, rôle…)"
        className={inputClass}
        autoComplete="off"
      />
    </div>
  );
}

function loadErrorBlock(error: string | null) {
  if (!error) return null;
  return (
    <div className="rounded-2xl border border-rose-400/35 bg-rose-400/10 p-4 text-rose-100">{error}</div>
  );
}
