"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

function MemberCard({ member, dateKey, badgeLabel }: { member: Member; dateKey: "birthday" | "twitchAffiliateDate"; badgeLabel: string }) {
  const memberLabel = member.displayName || member.twitchLogin || "Membre";
  const twitch = member.twitchLogin ? `@${member.twitchLogin}` : "Sans login Twitch";

  return (
    <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4 flex items-center gap-4">
      <img
        src={member.avatar || `https://placehold.co/64x64?text=${memberLabel.charAt(0).toUpperCase()}`}
        alt={memberLabel}
        className="w-12 h-12 rounded-full object-cover border border-gray-600"
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

  return (
    <div className="text-white">
      <div className="mb-8">
        <Link href={backHref} className="text-gray-400 hover:text-white transition-colors mb-4 inline-block">
          ← {backLabel}
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
        <p className="text-gray-400">{description}</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("birthday")}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            activeTab === "birthday"
              ? "bg-[#9146ff] border-[#9146ff] text-white"
              : "bg-[#1a1a1d] border-gray-700 text-gray-300 hover:text-white"
          }`}
        >
          Anniversaire ({birthdays.length})
        </button>
        <button
          onClick={() => setActiveTab("affiliate")}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            activeTab === "affiliate"
              ? "bg-[#9146ff] border-[#9146ff] text-white"
              : "bg-[#1a1a1d] border-gray-700 text-gray-300 hover:text-white"
          }`}
        >
          Anniversaire d'affiliation ({affiliateAnniversaries.length})
        </button>
      </div>

      {loading ? <p className="text-gray-400">Chargement des membres...</p> : null}
      {error ? <p className="text-red-400">{error}</p> : null}

      {!loading && !error && visibleList.length === 0 ? (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 text-gray-400">
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

