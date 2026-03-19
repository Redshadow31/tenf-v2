"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, Calendar, TrendingUp, UserCheck } from "lucide-react";

interface EventPresence {
  id: string;
  twitchLogin: string;
  displayName: string;
  present: boolean;
}

interface RecapData {
  totalEvents: number;
  totalRegistrations: number;
  eventsWithRegistrations: Array<{
    event: {
      id: string;
      title: string;
      date: string;
      category: string;
      isPublished: boolean;
    };
    registrations: Array<any>;
    registrationCount: number;
    presences?: EventPresence[];
    presenceCount?: number; // Nombre de présents (present: true)
  }>;
}

type ViewMode = "all" | "month";

function normalizeLogin(value?: string): string {
  return (value || "").trim().toLowerCase();
}

function safeTs(value?: string): number {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function dedupeRegistrations(registrations: Array<any>): Array<any> {
  const byLogin = new Map<string, any>();
  for (const reg of registrations || []) {
    const key = normalizeLogin(reg?.twitchLogin);
    if (!key) continue;
    const existing = byLogin.get(key);
    if (!existing || safeTs(reg?.registeredAt) >= safeTs(existing?.registeredAt)) {
      byLogin.set(key, reg);
    }
  }
  return Array.from(byLogin.values());
}

function dedupePresences(presences: EventPresence[]): EventPresence[] {
  const byLogin = new Map<string, EventPresence>();
  for (const presence of presences || []) {
    const key = normalizeLogin(presence?.twitchLogin);
    if (!key) continue;
    const existing = byLogin.get(key);
    if (!existing) {
      byLogin.set(key, presence);
      continue;
    }
    // Garder la plus récente. En cas d'égalité stricte, privilégier absent
    // pour éviter de compter un faux présent.
    const existingTs = safeTs((existing as any).validatedAt) || safeTs((existing as any).createdAt);
    const currentTs = safeTs((presence as any).validatedAt) || safeTs((presence as any).createdAt);
    const hasClearNewer = currentTs !== existingTs;
    const newer = hasClearNewer ? (currentTs > existingTs ? presence : existing) : presence;
    const older = newer === presence ? existing : presence;
    const resolvedPresent = hasClearNewer
      ? newer.present
      : (newer.present && older.present);
    byLogin.set(key, {
      ...newer,
      present: resolvedPresent,
      displayName: newer.displayName || older.displayName,
    });
  }
  return Array.from(byLogin.values());
}

function normalizeEventItem(item: any) {
  const registrations = dedupeRegistrations(item.registrations || []);
  const presences = dedupePresences(item.presences || []);
  const presenceCount = presences.filter((p) => p.present).length;
  return {
    ...item,
    registrations,
    registrationCount: registrations.length,
    presences,
    presenceCount,
  };
}

export default function RecapPage() {
  const pathname = usePathname();
  const [data, setData] = useState<RecapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [topMode, setTopMode] = useState<"all" | "noStaff">("all");
  const [staffLogins, setStaffLogins] = useState<Set<string>>(new Set());
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les inscriptions + membres (pour filtre staff) en parallèle
      const [registrationsResponse, membersResponse] = await Promise.all([
        fetch("/api/admin/events/registrations", {
          cache: "no-store",
        }),
        fetch("/api/admin/members", {
          cache: "no-store",
        }),
      ]);
      
      let eventsData: any[] = [];
      if (registrationsResponse.ok) {
        const registrationsResult = await registrationsResponse.json();
        eventsData = registrationsResult.eventsWithRegistrations || [];
      } else {
        // Fallback: afficher au moins les événements même si les inscriptions admin ne remontent pas.
        const fallbackEventsResponse = await fetch("/api/events?admin=true", { cache: "no-store" });
        if (fallbackEventsResponse.ok) {
          const fallbackPayload = await fallbackEventsResponse.json();
          eventsData = (fallbackPayload.events || []).map((event: any) => ({
            event: {
              id: event.id,
              title: event.title,
              date: event.startAtUtc || event.date,
              category: event.category,
              isPublished: event.isPublished ?? false,
            },
            registrations: [],
            registrationCount: 0,
          }));
        }
      }
      
      // Charger les présences pour chaque événement passé uniquement
      const eventsWithPresencesRaw = await Promise.all(
        eventsData.map(async (item: any) => {
          try {
            const presenceResponse = await fetch(
              `/api/admin/events/presence?eventId=${item.event.id}`,
              { cache: 'no-store' }
            );
            
            if (presenceResponse.ok) {
              const presenceData = await presenceResponse.json();
              const presences = presenceData.presences || [];
              // Compter uniquement les présents (present: true)
              const presenceCount = presences.filter((p: EventPresence) => p.present).length;
              
              return {
                ...item,
                presences,
                presenceCount,
              };
            }
            
            return {
              ...item,
              presences: [],
              presenceCount: 0,
            };
          } catch (error) {
            console.error(`Erreur chargement présences pour ${item.event.id}:`, error);
            return {
              ...item,
              presences: [],
              presenceCount: 0,
            };
          }
        })
      );
      const eventsWithPresences = eventsWithPresencesRaw.map(normalizeEventItem);
      
      // Calculer le total des inscriptions de tous les événements affichés
      const totalRegistrationsPast = eventsWithPresences.reduce(
        (sum, item) => sum + item.registrationCount,
        0
      );

      // Construire la liste staff via les rôles membres
      if (membersResponse.ok) {
        const membersPayload = await membersResponse.json();
        const STAFF_ROLES = new Set([
          "Admin",
          "Admin Coordinateur",
          "Modérateur",
          "Modérateur en formation",
          "Modérateur en activité réduite",
          "Modérateur en pause",
          "Soutien TENF",
        ]);
        const staffSet = new Set<string>(
          (membersPayload.members || [])
            .filter((m: any) => STAFF_ROLES.has(m.role))
            .map((m: any) => (m.twitchLogin || "").toLowerCase())
            .filter(Boolean)
        );
        setStaffLogins(staffSet);
      } else {
        setStaffLogins(new Set());
      }
      
      setData({
        totalEvents: eventsWithPresences.length,
        totalRegistrations: totalRegistrationsPast,
        eventsWithRegistrations: eventsWithPresences,
      });
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage par mois ou tout
  const displayedEvents = !data ? [] : viewMode === "all"
    ? data.eventsWithRegistrations
    : data.eventsWithRegistrations.filter((item: any) => {
        const d = new Date(item.event.date);
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      });
  const viewData: RecapData | null = data ? {
    totalEvents: displayedEvents.length,
    totalRegistrations: displayedEvents.reduce((s, i) => s + i.registrationCount, 0),
    eventsWithRegistrations: displayedEvents,
  } : null;

  const getCategoryStats = (source: RecapData | null = viewData) => {
    if (!source) return {};
    const stats: Record<string, { count: number; registrations: number; totalPresences: number; uniqueParticipants: number }> = {};
    const uniqueLoginsByCategory: Record<string, Set<string>> = {};
    source.eventsWithRegistrations.forEach((item) => {
      const cat = item.event.category;
      if (!stats[cat]) {
        stats[cat] = { count: 0, registrations: 0, totalPresences: 0, uniqueParticipants: 0 };
        uniqueLoginsByCategory[cat] = new Set();
      }
      stats[cat].count++;
      stats[cat].registrations += item.registrationCount;
      // Ajouter le nombre de présents pour cet événement
      stats[cat].totalPresences += item.presenceCount || 0;
      // Collecter les participants uniques par catégorie
      if (item.presences) {
        item.presences.forEach((presence: EventPresence) => {
          if (presence.present && presence.twitchLogin) {
            uniqueLoginsByCategory[cat].add(presence.twitchLogin.toLowerCase());
          }
        });
      }
    });
    // Affecter le nombre de participants uniques
    Object.keys(stats).forEach((cat) => {
      stats[cat].uniqueParticipants = uniqueLoginsByCategory[cat]?.size || 0;
    });
    return stats;
  };

  const getAveragePresences = (source: RecapData | null = viewData) => {
    if (!source || source.totalEvents === 0) return 0;
    const totalPresences = source.eventsWithRegistrations.reduce(
      (sum, item) => sum + (item.presenceCount || 0),
      0
    );
    return Math.round((totalPresences / source.totalEvents) * 10) / 10;
  };

  const getTotalPresences = (source: RecapData | null = viewData) => {
    if (!source) return 0;
    return source.eventsWithRegistrations.reduce(
      (sum, item) => sum + (item.presenceCount || 0),
      0
    );
  };

  const getUniqueParticipants = (source: RecapData | null = viewData) => {
    if (!source) return 0;
    const uniqueLogins = new Set<string>();
    source.eventsWithRegistrations.forEach((item) => {
      // Compter uniquement les présents
      if (item.presences) {
        item.presences.forEach((presence: EventPresence) => {
          if (presence.present && presence.twitchLogin) {
            uniqueLogins.add(presence.twitchLogin.toLowerCase());
          }
        });
      }
    });
    return uniqueLogins.size;
  };

  const getTopParticipantsByCategory = (
    source: RecapData | null = viewData,
    excludeStaff: boolean = false
  ) => {
    if (!source) return {} as Record<string, Array<{ login: string; count: number }>>;

    const counters: Record<string, Map<string, number>> = {};

    source.eventsWithRegistrations.forEach((item) => {
      const cat = item.event.category;
      if (!counters[cat]) counters[cat] = new Map<string, number>();

      // Dédupliquer par login dans un même événement pour éviter le double comptage legacy/v2.
      const uniquePresentInEvent = new Set<string>();
      (item.presences || [])
        .filter((presence: EventPresence) => presence.present && !!presence.twitchLogin)
        .forEach((presence: EventPresence) => {
          const login = normalizeLogin(presence.twitchLogin);
          if (!login || uniquePresentInEvent.has(login)) return;
          uniquePresentInEvent.add(login);
          if (excludeStaff && staffLogins.has(login)) return;
          counters[cat].set(login, (counters[cat].get(login) || 0) + 1);
        });
    });

    const result: Record<string, Array<{ login: string; count: number }>> = {};
    Object.entries(counters).forEach(([cat, map]) => {
      result[cat] = Array.from(map.entries())
        .map(([login, count]) => ({ login, count }))
        .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.login.localeCompare(b.login, "fr")))
        .slice(0, 5);
    });
    return result;
  };

  const totalPresences = getTotalPresences();
  const uniqueParticipants = getUniqueParticipants();
  const topByCategory = getTopParticipantsByCategory(viewData, topMode === "noStaff");

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const eventsBasePath = pathname.startsWith("/admin/communaute/evenements")
    ? "/admin/communaute/evenements"
    : "/admin/events";

  if (loading) {
    return (
      <div className="text-white">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
        </div>
      </div>
    );
  }

  const categoryStats = getCategoryStats();

  return (
    <div className="text-white">
      <div className="mb-8">
        <Link
          href={eventsBasePath}
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour aux événements
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">
          Récapitulatif des Événements
        </h1>
        <p className="text-gray-400">
          Statistiques et analyse des événements TENF
        </p>
      </div>

      {/* Filtre Tout / Par mois */}
      {data && data.eventsWithRegistrations.length > 0 && (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4 mb-6 flex flex-wrap items-center gap-4">
          <span className="text-gray-400 text-sm font-medium">Afficher :</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "all"
                  ? "bg-[#9146ff] text-white"
                  : "bg-[#0e0e10] text-gray-400 hover:text-white border border-gray-700"
              }`}
            >
              Tout
            </button>
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "month"
                  ? "bg-[#9146ff] text-white"
                  : "bg-[#0e0e10] text-gray-400 hover:text-white border border-gray-700"
              }`}
            >
              Par mois
            </button>
          </div>
          {viewMode === "month" && (
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                {monthNames.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span className="text-gray-400 text-sm">
                {monthNames[selectedMonth]} {selectedYear}
              </span>
            </div>
          )}
        </div>
      )}

      {!viewData || viewData.totalEvents === 0 ? (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">
            {viewMode === "month"
              ? `Aucun événement pour ${monthNames[selectedMonth]} ${selectedYear}`
              : "Aucune donnée disponible"}
          </p>
        </div>
      ) : (
        <>
          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6 text-[#9146ff]" />
                <h3 className="text-sm font-semibold text-gray-400">
                  Total Événements
                </h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {viewData.totalEvents}
              </p>
            </div>

            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-blue-400" />
                <h3 className="text-sm font-semibold text-gray-400">
                  Total Inscriptions
                </h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {viewData.totalRegistrations}
              </p>
            </div>

            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <UserCheck className="w-6 h-6 text-amber-400" />
                <h3 className="text-sm font-semibold text-gray-400">
                  Total Participants
                </h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {totalPresences}
              </p>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Nombre total:</span>
                  <span className="text-white font-semibold">{totalPresences}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Nom unique:</span>
                  <span className="text-white font-semibold">{uniqueParticipants}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <h3 className="text-sm font-semibold text-gray-400">
                  Moyenne par événement
                </h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {getAveragePresences()}
              </p>
            </div>

            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                <h3 className="text-sm font-semibold text-gray-400">
                  Catégories
                </h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {Object.keys(categoryStats).length}
              </p>
            </div>
          </div>

          {/* Statistiques par catégorie */}
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-xl font-semibold text-white">Statistiques par catégorie</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTopMode("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    topMode === "all"
                      ? "bg-[#9146ff] text-white"
                      : "bg-[#0e0e10] text-gray-300 border border-gray-700 hover:text-white"
                  }`}
                >
                  Top 5 - Tous
                </button>
                <button
                  type="button"
                  onClick={() => setTopMode("noStaff")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    topMode === "noStaff"
                      ? "bg-[#9146ff] text-white"
                      : "bg-[#0e0e10] text-gray-300 border border-gray-700 hover:text-white"
                  }`}
                >
                  Top 5 - Hors staff
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(categoryStats).map(([category, stats]) => (
                <div
                  key={category}
                  className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4"
                >
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Événements:</span>
                      <span className="text-white font-semibold">
                        {stats.count}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Inscriptions:</span>
                      <span className="text-white font-semibold">
                        {stats.registrations}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Participation:</span>
                      <span className="text-amber-400 font-semibold">
                        {stats.totalPresences}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Participation unique:</span>
                      <span className="text-green-400 font-semibold">
                        {stats.uniqueParticipants}
                      </span>
                    </div>
                    {stats.count > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Moyenne:</span>
                        <span className="text-white font-semibold">
                          {Math.round((stats.totalPresences / stats.count) * 10) / 10}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 mt-2 border-t border-gray-700">
                      <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">
                        Top 5 présences ({topMode === "all" ? "tous" : "hors staff"})
                      </p>
                      {topByCategory[category]?.length ? (
                        <div className="space-y-1">
                          {topByCategory[category].map((entry, idx) => (
                            <div key={`${category}-${entry.login}`} className="flex justify-between text-xs">
                              <span className="text-gray-300">
                                {idx + 1}. {entry.login}
                              </span>
                              <span className="text-[#9146ff] font-semibold">{entry.count}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Aucune donnée.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top événements */}
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              Événements les plus populaires
            </h2>
            <div className="space-y-3">
              {[...viewData.eventsWithRegistrations]
                .sort((a, b) => (b.presenceCount || 0) - (a.presenceCount || 0))
                .slice(0, 5)
                .map((item) => (
                  <div
                    key={item.event.id}
                    className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-white font-semibold mb-1">
                        {item.event.title}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {item.event.category} •{" "}
                        {new Date(item.event.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#9146ff]">
                        {item.presenceCount || 0}
                      </p>
                      <p className="text-xs text-gray-400">présents</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

