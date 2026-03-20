"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import { getDiscordUser } from "@/lib/discord";
import { isFounder } from "@/lib/adminRoles";

interface MemberEvent {
  id: string;
  memberId: string;
  type: string;
  createdAt: string;
  source?: 'twitch_eventsub' | 'twitch_poll' | 'manual' | 'discord' | 'system';
  actor?: string;
  payload?: Record<string, any>;
}

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

export default function MembresHistoriquePage() {
  const [events, setEvents] = useState<MemberEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string; isFounder: boolean } | null>(null);
  const [filters, setFilters] = useState({
    memberSearch: "",
    type: "",
    source: "",
    startDate: "",
    endDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const eventsPerPage = 50;

  useEffect(() => {
    async function loadAdmin() {
      const user = await getDiscordUser();
      if (user) {
        try {
          const roleResponse = await fetch("/api/user/role");
          const roleData = await roleResponse.json();
          if (!roleData.hasAdminAccess) {
            window.location.href = "/unauthorized";
            return;
          }
          const isAdminRole = roleData.role === "Admin";
          const isAdminAdjoint = roleData.role === "Admin Adjoint";
          const founderStatus = isFounder(user.id);
          setCurrentAdmin({
            id: user.id,
            username: user.username,
            isFounder: founderStatus || isAdminRole || isAdminAdjoint,
          });
        } catch (err) {
          const founderStatus = isFounder(user.id);
          if (!founderStatus) {
            window.location.href = "/unauthorized";
            return;
          }
          setCurrentAdmin({ id: user.id, username: user.username, isFounder: founderStatus });
        }
      } else {
        window.location.href = "/auth/login?redirect=/admin/membres/historique";
      }
    }
    loadAdmin();
  }, []);

  useEffect(() => {
    if (currentAdmin?.isFounder) {
      void loadEvents();
    }
  }, [currentAdmin?.isFounder, filters, currentPage]);

  async function loadEvents() {
    setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.memberSearch) params.append('memberId', filters.memberSearch);
      if (filters.type) params.append('type', filters.type);
      if (filters.source) params.append('source', filters.source);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', String(eventsPerPage));
      params.append('page', String(currentPage));

      const response = await fetch(`/api/admin/members/events?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await response.json();
      setEvents(data.events || []);
      setTotalEvents(Number(data.total || 0));
      setHasMore(Boolean(data.hasMore));
    } catch (error) {
      console.error("Erreur lors du chargement des événements:", error);
      setError(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const formatEventSummary = (event: MemberEvent): string => {
    switch (event.type) {
      case 'role_changed':
        return `Rôle changé: ${event.payload?.fromRole || 'N/A'} → ${event.payload?.toRole || 'N/A'}`;
      case 'integration_validated':
        return `Intégration validée le ${new Date(event.payload?.date || event.createdAt).toLocaleDateString('fr-FR')}`;
      case 'manual_note_updated':
        return `Notes internes mises à jour`;
      case 'raid':
        return `Raid: ${event.payload?.raider || 'N/A'} → ${event.payload?.target || 'N/A'}`;
      case 'follow_import_wizebot':
        return `Import Wizebot: Follow détecté${event.payload?.followedAt ? ` le ${new Date(event.payload.followedAt).toLocaleDateString('fr-FR')}` : ''}`;
      default:
        return event.type;
    }
  };

  const getEventTypeColor = (type: string) => {
    if (type.startsWith("audit:")) {
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    }
    switch (type) {
      case 'role_changed':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'integration_validated':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'manual_note_updated':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'raid':
        return 'bg-[#9146ff]/20 text-[#9146ff] border-[#9146ff]/30';
      case 'follow_import_wizebot':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'twitch_eventsub':
        return '🎮';
      case 'twitch_poll':
        return '📊';
      case 'manual':
        return '✋';
      case 'discord':
        return '💬';
      case 'system':
        return '⚙️';
      default:
        return '❓';
    }
  };

  const getEventSeverity = (event: MemberEvent): "critical" | "important" | "info" => {
    if (event.type.startsWith("audit:")) return "critical";
    if (event.type === "role_changed") return "critical";
    if (event.type === "integration_validated" || event.type === "raid") return "important";
    return "info";
  };

  const getSeverityClass = (severity: "critical" | "important" | "info") => {
    if (severity === "critical") return "bg-rose-500/20 text-rose-200 border-rose-400/35";
    if (severity === "important") return "bg-amber-500/20 text-amber-200 border-amber-400/35";
    return "bg-sky-500/20 text-sky-200 border-sky-400/35";
  };

  const getSeverityLabel = (severity: "critical" | "important" | "info") => {
    if (severity === "critical") return "Critique";
    if (severity === "important") return "Important";
    return "Info";
  };

  const visibleEvents = useMemo(() => {
    if (!criticalOnly) return events;
    return events.filter((event) => getEventSeverity(event) === "critical");
  }, [criticalOnly, events]);

  const groupedEvents = useMemo(() => {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);

    const map = new Map<string, MemberEvent[]>();
    visibleEvents.forEach((event) => {
      const key = new Date(event.createdAt).toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    });

    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dateKey, dayEvents]) => {
        let label = new Date(dateKey).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        if (dateKey === todayKey) label = "Aujourd'hui";
        if (dateKey === yesterdayKey) label = "Hier";
        return { dateKey, label, events: dayEvents };
      });
  }, [visibleEvents]);

  const topTypes = useMemo(() => {
    const counts = new Map<string, number>();
    visibleEvents.forEach((event) => {
      counts.set(event.type, (counts.get(event.type) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [visibleEvents]);

  const topActors = useMemo(() => {
    const counts = new Map<string, number>();
    visibleEvents.forEach((event) => {
      const actor = event.actor?.trim() || "Système";
      counts.set(actor, (counts.get(actor) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([actor, count]) => ({ actor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [visibleEvents]);

  const p1Events = events.filter((event) => event.type === "role_changed" || event.type.startsWith("audit:")).length;
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (!currentAdmin?.isFounder) {
    return (
      <div className="space-y-6 p-8 text-white">
        <section className={`${sectionCardClass} p-6`}>
          <h1 className="text-3xl font-semibold text-white">Historique des Membres</h1>
          <p className="mt-3 text-rose-300">Accès refusé. Cette page est réservée aux fondateurs.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8 text-white">
      <section className={`${glassCardClass} p-5 md:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Membres · Historique</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Timeline des événements membres
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Vue consolidée des événements métier, imports et actions d’audit sur le parcours membres.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/admin/membres"
                className="rounded-lg border border-indigo-300/35 bg-indigo-300/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 hover:bg-indigo-300/20"
              >
                Dashboard membres
              </Link>
              <Link
                href="/admin/membres/gestion"
                className="rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/20"
              >
                Gestion membres
              </Link>
              <Link
                href="/admin/audit-logs"
                className="rounded-lg border border-amber-300/35 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-300/20"
              >
                Audit logs admin
              </Link>
            </div>
          </div>
          <button type="button" onClick={() => void loadEvents()} disabled={refreshing} className={`${subtleButtonClass} disabled:opacity-60`}>
            <RefreshCw className="h-4 w-4" />
            {refreshing ? "Actualisation..." : "Actualiser"}
          </button>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-400/35 bg-rose-400/10 p-4 text-sm text-rose-100">
          Chargement partiel : {error}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Événements affichés</p>
          <p className="mt-2 text-3xl font-semibold">{visibleEvents.length}</p>
          <p className="mt-1 text-xs text-slate-400">Page {currentPage}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Total résultat</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{totalEvents}</p>
          <p className="mt-1 text-xs text-slate-400">Après filtres</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Événements critiques</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">{p1Events}</p>
          <p className="mt-1 text-xs text-slate-400">Rôle / audit</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Filtres actifs</p>
          <p className="mt-2 text-3xl font-semibold text-indigo-300">{activeFiltersCount}</p>
          <p className="mt-1 text-xs text-slate-400">Affinage timeline</p>
        </article>
      </section>

      <section className={`${sectionCardClass} p-6`}>
        <h2 className="mb-4 text-xl font-semibold text-white">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Recherche membre (Twitch login)
            </label>
            <input
              type="text"
              value={filters.memberSearch}
              onChange={(e) => setFilters({ ...filters, memberSearch: e.target.value })}
              className="w-full rounded-lg border border-[#353a50] bg-[#121623]/80 px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-300/55"
              placeholder="Ex: nexou31"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Type d'événement
            </label>
            <select
              value={filters.type}
              onChange={(e) => {
                setFilters({ ...filters, type: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-[#353a50] bg-[#121623]/80 px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
            >
              <option value="">Tous</option>
              <option value="role_changed">Changement de rôle</option>
              <option value="integration_validated">Intégration validée</option>
              <option value="manual_note_updated">Notes mises à jour</option>
              <option value="raid">Raid</option>
              <option value="follow_import_wizebot">Import Wizebot</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Source
            </label>
            <select
              value={filters.source}
              onChange={(e) => {
                setFilters({ ...filters, source: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-[#353a50] bg-[#121623]/80 px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
            >
              <option value="">Toutes</option>
              <option value="twitch_eventsub">Twitch EventSub</option>
              <option value="twitch_poll">Twitch Poll</option>
              <option value="manual">Manuel</option>
              <option value="discord">Discord</option>
              <option value="system">Système</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setFilters({ ...filters, startDate: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-[#353a50] bg-[#121623]/80 px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setFilters({ ...filters, endDate: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-[#353a50] bg-[#121623]/80 px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  memberSearch: "",
                  type: "",
                  source: "",
                  startDate: "",
                  endDate: "",
                });
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-400/35 bg-slate-400/10 px-4 py-2 font-semibold text-slate-200 transition hover:bg-slate-400/20"
            >
              Réinitialiser
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setCriticalOnly((prev) => !prev)}
              className={`w-full rounded-lg border px-4 py-2 font-semibold transition ${
                criticalOnly
                  ? "border-rose-300/45 bg-rose-500/20 text-rose-100 hover:bg-rose-500/30"
                  : "border-indigo-300/35 bg-indigo-300/10 text-indigo-100 hover:bg-indigo-300/20"
              }`}
            >
              {criticalOnly ? "Critiques uniquement: ON" : "Critiques uniquement: OFF"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Top types (période affichée)</h2>
          <div className="mt-3 space-y-2">
            {topTypes.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune donnée.</p>
            ) : (
              topTypes.map((item) => (
                <div key={item.type} className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">
                  <span className="text-sm text-slate-200">{item.type}</span>
                  <span className="text-sm font-semibold text-indigo-200">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </article>
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Top acteurs (période affichée)</h2>
          <div className="mt-3 space-y-2">
            {topActors.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune donnée.</p>
            ) : (
              topActors.map((item) => (
                <div key={item.actor} className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">
                  <span className="text-sm text-slate-200">{item.actor}</span>
                  <span className="text-sm font-semibold text-cyan-200">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      {/* Timeline groupée */}
      {visibleEvents.length === 0 ? (
        <section className={`${sectionCardClass} p-6 text-center`}>
          <p className="text-slate-300 text-xl font-semibold">Aucun événement trouvé</p>
          <p className="text-slate-400 mt-2">Aucun événement ne correspond aux filtres sélectionnés.</p>
        </section>
      ) : (
        <>
          <div className="space-y-4">
            {groupedEvents.map((group) => (
              <section key={group.dateKey} className={`${sectionCardClass} overflow-hidden`}>
                <div className="flex items-center justify-between border-b border-[#353a50] bg-[#121623]/80 px-5 py-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-200">{group.label}</h3>
                  <span className="rounded-full border border-indigo-300/30 bg-indigo-300/10 px-2.5 py-1 text-xs text-indigo-100">
                    {group.events.length} événement(s)
                  </span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-gray-300">Heure</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-gray-300">Membre</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-gray-300">Sévérité</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-gray-300">Type</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-gray-300">Source</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-gray-300">Résumé</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-gray-300">Acteur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.events.map((event) => {
                      const severity = getEventSeverity(event);
                      return (
                        <tr key={event.id} className="border-b border-gray-800/70 hover:bg-gray-800/40 transition-colors">
                          <td className="py-3 px-5 text-gray-300 text-sm">
                            {new Date(event.createdAt).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-3 px-5">
                            <Link
                              href={`/admin/membres/gestion?search=${event.memberId}`}
                              className="font-medium text-indigo-300 hover:text-indigo-200"
                            >
                              {event.memberId}
                            </Link>
                          </td>
                          <td className="py-3 px-5">
                            <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-semibold ${getSeverityClass(severity)}`}>
                              {getSeverityLabel(severity)}
                            </span>
                          </td>
                          <td className="py-3 px-5">
                            <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-semibold ${getEventTypeColor(event.type)}`}>
                              {event.type}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-gray-300 text-sm">
                            <span className="flex items-center gap-2">
                              <span>{getSourceIcon(event.source)}</span>
                              <span>{event.source || "N/A"}</span>
                            </span>
                          </td>
                          <td className="py-3 px-5 text-gray-300 text-sm">
                            {formatEventSummary(event)}
                          </td>
                          <td className="py-3 px-5 text-gray-400 text-sm">
                            {event.actor || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              Page {currentPage} · {visibleEvents.length} événements affichés sur {totalEvents}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1 || loading}
                className="rounded-lg border border-slate-400/35 bg-slate-400/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-400/20 disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!hasMore || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-300/35 bg-indigo-500/25 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/35 disabled:opacity-50"
              >
                Suivant
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

