"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarHeart, Sparkles, Users } from "lucide-react";

type TabKey = "birthday" | "affiliate";
type Scope = "month" | "all";

type Member = {
  id?: string;
  twitchLogin?: string;
  displayName?: string;
  discordUsername?: string;
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

function formatDate(value?: string): string {
  const date = safeDate(value);
  if (!date) return "Date non renseignée";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
  }).format(date);
}

function formatCurrentMonthLabel(): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date());
}

function MemberCard({ member, dateKey, badgeLabel }: { member: Member; dateKey: "birthday" | "twitchAffiliateDate"; badgeLabel: string }) {
  const memberLabel = member.displayName || member.twitchLogin || "Membre";
  const twitch = member.twitchLogin ? `@${member.twitchLogin}` : "Sans login Twitch";

  return (
    <div className="rounded-xl border border-[#353a50] bg-[#121623]/85 p-4 flex items-center gap-4 hover:border-indigo-300/35 transition-colors">
      <img
        src={member.avatar || `https://placehold.co/64x64?text=${memberLabel.charAt(0).toUpperCase()}`}
        alt={memberLabel}
        className="w-12 h-12 rounded-full object-cover border border-indigo-300/30"
      />
      <div className="min-w-0 flex-1">
        <p className="text-white font-semibold truncate">{memberLabel}</p>
        <p className="text-gray-400 text-sm truncate">{twitch}</p>
        {member.discordUsername ? <p className="text-gray-500 text-xs truncate">{member.discordUsername}</p> : null}
      </div>
      <div className="text-right">
        <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-[#2a2440] text-[#c4a8ff] border border-[#5f3fb0]">
          {badgeLabel}
        </span>
        <p className="text-white text-sm mt-2">{formatDate(member[dateKey])}</p>
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
  const [members, setMembers] = useState<Member[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("birthday");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadMembers() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/members", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Impossible de charger les membres");
        }
        const data = await response.json();
        if (!mounted) return;
        setMembers(Array.isArray(data.members) ? data.members : []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMembers();

    return () => {
      mounted = false;
    };
  }, []);

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
  const monthLabel = formatCurrentMonthLabel();
  const coveragePercent =
    birthdays.length + affiliateAnniversaries.length > 0
      ? Math.min(100, Math.round((Math.max(birthdays.length, affiliateAnniversaries.length) / (birthdays.length + affiliateAnniversaries.length)) * 100))
      : 0;

  return (
    <div className="space-y-6 text-white">
      <section className={glassCardClass}>
        <Link href={backHref} className="text-gray-300 hover:text-white transition-colors mb-4 inline-block">
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
          <h2 className="text-lg font-semibold text-slate-100">Mode d'emploi</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p className="rounded-lg border border-indigo-300/30 bg-indigo-300/10 px-3 py-2 text-indigo-100">
              1. Vérifier les anniversaires du mois pour préparer les messages personnalisés.
            </p>
            <p className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-cyan-100">
              2. Mettre en avant les affiliations Twitch dans les moments de communauté.
            </p>
            <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-amber-100">
              3. Utiliser l'historique pour anticiper les prochaines célébrations.
            </p>
          </div>
        </article>
        <article className={sectionCardClass}>
          <h2 className="text-lg font-semibold text-slate-100">Repères opérationnels</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p className="rounded-lg border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-2 text-fuchsia-100">
              <CalendarHeart className="mr-1 inline h-4 w-4" />
              Célébrer dans les 24h pour maximiser l'impact.
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

      <div className={`${sectionCardClass} flex gap-2`}>
        <button
          onClick={() => setActiveTab("birthday")}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            activeTab === "birthday"
              ? "bg-[linear-gradient(145deg,rgba(99,102,241,0.28),rgba(79,70,229,0.18))] border-indigo-300/45 text-white"
              : "bg-[#1a1a1d] border-gray-700 text-gray-300 hover:text-white"
          }`}
        >
          Anniversaire ({birthdays.length})
        </button>
        <button
          onClick={() => setActiveTab("affiliate")}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            activeTab === "affiliate"
              ? "bg-[linear-gradient(145deg,rgba(99,102,241,0.28),rgba(79,70,229,0.18))] border-indigo-300/45 text-white"
              : "bg-[#1a1a1d] border-gray-700 text-gray-300 hover:text-white"
          }`}
        >
          Anniversaire d'affiliation ({affiliateAnniversaries.length})
        </button>
      </div>

      {loading ? <div className={`${sectionCardClass} text-gray-400`}>Chargement des membres...</div> : null}
      {error ? <div className="rounded-2xl border border-rose-400/35 bg-rose-400/10 p-4 text-rose-100">{error}</div> : null}

      {!loading && !error && visibleList.length === 0 ? (
        <div className={`${sectionCardClass} text-gray-400`}>
          Aucun membre trouve pour cet onglet.
        </div>
      ) : null}

      {!loading && !error && visibleList.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visibleList.map((member) => (
            <MemberCard
              key={`${member.id || member.twitchLogin || member.displayName}-${member[dateKey] || "date"}`}
              member={member}
              dateKey={dateKey}
              badgeLabel={badgeLabel}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

