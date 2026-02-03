"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface Member {
  twitchLogin: string;
  displayName: string;
  role?: string;
  isActive: boolean;
  avatar?: string;
}

interface EventPresence {
  twitchLogin: string;
  displayName?: string;
  present: boolean;
}

interface EventItem {
  id: string;
  title: string;
  date: string;
  category: string;
  presences?: EventPresence[];
}

export default function EvaluationBEventsServeurPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });

  const [activeMembers, setActiveMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch("/api/user/role");
        if (response.ok) {
          const data = await response.json();
          setHasAccess(data.hasAdminAccess === true);
        } else {
          setHasAccess(false);
        }
      } catch {
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }
    checkAccess();
  }, []);

  useEffect(() => {
    if (!hasAccess || !selectedMonth) return;
    async function load() {
      setLoadingData(true);
      try {
        const [membersRes, presenceRes] = await Promise.all([
          fetch("/api/admin/members", { cache: "no-store" }),
          fetch(`/api/admin/events/presence?month=${selectedMonth}`, { cache: "no-store" }),
        ]);
        const membersData = membersRes.ok ? (await membersRes.json()).members || [] : [];
        const presenceData = presenceRes.ok ? await presenceRes.json() : { events: [] };

        const active = membersData
          .filter((m: any) => m.twitchLogin && m.isActive !== false)
          .map((m: any) => ({
            twitchLogin: m.twitchLogin,
            displayName: m.displayName || m.twitchLogin,
            role: m.role,
            isActive: m.isActive !== false,
            avatar: m.avatar,
          }))
          .sort((a: Member, b: Member) => (a.displayName || "").localeCompare(b.displayName || ""));

        setActiveMembers(active);
        setEvents(presenceData.events || []);
      } catch (e) {
        console.error("Erreur chargement events-serveur:", e);
      } finally {
        setLoadingData(false);
      }
    }
    load();
  }, [hasAccess, selectedMonth]);

  const { membersWithPoints, nonSpotlightEventsCount, withPresenceCount } = useMemo(() => {
    const nonSpotlight = (events || []).filter((e: EventItem) => (e.category || "") !== "Spotlight");
    const presentLogins = new Set<string>();
    for (const event of nonSpotlight) {
      for (const p of event.presences || []) {
        if (p.present && p.twitchLogin) {
          presentLogins.add(p.twitchLogin.toLowerCase());
        }
      }
    }
    const membersWithPoints = (activeMembers || []).map((m) => {
      const hasPresence = presentLogins.has(m.twitchLogin.toLowerCase());
      return {
        ...m,
        points: hasPresence ? 2 : 0,
        hasPresence,
      };
    });
    const withPresenceCount = membersWithPoints.filter((m) => m.hasPresence).length;
    return {
      membersWithPoints,
      nonSpotlightEventsCount: nonSpotlight.length,
      withPresenceCount,
    };
  }, [activeMembers, events]);

  function getMonthOptions(): string[] {
    const options: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      options.push(`${year}-${month}`);
    }
    return options;
  }

  function formatMonthKey(key: string): string {
    const [year, month] = key.split("-");
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff]" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-8">
        <div className="bg-[#1a1a1d] border border-red-500 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Accès refusé</h1>
          <p className="text-gray-400">Vous n'avez pas les permissions nécessaires.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white p-8">
      <div className="mb-8">
        <Link
          href="/admin/evaluation/b"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour à B. Engagement Communautaire
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Events serveur — Engagement Communautaire</h1>
        <p className="text-gray-400">
          Membres actifs (gestion). 2 points si au moins une présence validée à un event du mois (hors Spotlight).
        </p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-semibold text-gray-300">Mois :</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
        >
          {getMonthOptions().map((option) => (
            <option key={option} value={option}>
              {formatMonthKey(option)}
            </option>
          ))}
        </select>
        <Link
          href={`/admin/events/presence?month=${selectedMonth}`}
          className="text-[#9146ff] hover:underline text-sm"
        >
          Voir les présences →
        </Link>
        {loadingData && <span className="text-sm text-gray-400">Chargement…</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Membres actifs (gestion)</p>
          <p className="text-3xl font-bold text-white">{membersWithPoints.length}</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Events du mois (hors Spotlight)</p>
          <p className="text-3xl font-bold text-[#9146ff]">{nonSpotlightEventsCount}</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Avec au moins 1 présence validée</p>
          <p className="text-3xl font-bold text-green-400">{withPresenceCount}</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Points (2 pts si ≥1 présence)</p>
          <p className="text-3xl font-bold text-white">0 ou 2</p>
        </div>
      </div>

      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0a0a0c] sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Membre</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Rôle</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Points</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {membersWithPoints.map((member) => (
                <tr key={member.twitchLogin} className="border-t border-gray-800 hover:bg-[#0e0e10]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {member.avatar && (
                        <img src={member.avatar} alt="" className="w-8 h-8 rounded-full" />
                      )}
                      <span className="font-medium">{member.displayName}</span>
                      <span className="text-gray-500 text-xs">({member.twitchLogin})</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{member.role || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${member.points === 2 ? "text-green-400" : "text-gray-500"}`}>
                      {member.points}/2
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {member.hasPresence ? (
                      <span className="text-green-400 text-xs">Présent à au moins 1 event</span>
                    ) : (
                      <span className="text-gray-500 text-xs">Aucune présence validée</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
