"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

interface MemberLite {
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  twitchId?: string;
  integrationDate?: string;
  isActive?: boolean;
  isVip?: boolean;
  onboardingStatus?: "a_faire" | "en_cours" | "termine";
  nextReviewAt?: string;
  profileValidationStatus?: "non_soumis" | "en_cours_examen" | "valide";
}

interface MemberEventLite {
  id: string;
  memberId: string;
  type: string;
  createdAt: string;
  source?: string;
  actor?: string;
  payload?: Record<string, unknown>;
}

interface RecapEvent {
  event: {
    id: string;
    title: string;
    date: string;
    category: string;
    isPublished: boolean;
  };
  registrationCount: number;
  presenceCount: number;
}

interface WorkflowStep {
  id: string;
  label: string;
  href: string;
  status: "todo" | "in_progress" | "done";
  helper: string;
}

function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function completionPct(member: MemberLite): number {
  const checks = [
    !!member.discordId,
    !!member.twitchId,
    !!member.integrationDate,
    member.onboardingStatus === "termine",
    member.profileValidationStatus === "valide",
  ];
  const ok = checks.filter(Boolean).length;
  return Math.round((ok / checks.length) * 100);
}

function monthLabelFromDate(date: Date): string {
  const names = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"];
  return `${names[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
}

export default function Dashboard2Page() {
  const [loading, setLoading] = useState(true);
  const [loadingVisual, setLoadingVisual] = useState(true);
  const [loadingRecap, setLoadingRecap] = useState(true);
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [events, setEvents] = useState<MemberEventLite[]>([]);
  const [finalNotesCount, setFinalNotesCount] = useState(0);
  const [activeFollowStaffCount, setActiveFollowStaffCount] = useState(0);
  const [discordGrowthData, setDiscordGrowthData] = useState<Array<{ month: string; value: number }>>([]);
  const [monthlyActivityData, setMonthlyActivityData] = useState<Array<{ month: string; messages: number; vocals: number }>>([]);
  const [spotlightProgressionData, setSpotlightProgressionData] = useState<Array<{ month: string; value: number }>>([]);
  const [raidStats, setRaidStats] = useState<{
    totalRaidsReceived: number;
    totalRaidsSent: number;
  }>({ totalRaidsReceived: 0, totalRaidsSent: 0 });
  const [recapEvents, setRecapEvents] = useState<RecapEvent[]>([]);
  const [recapMonthFilter, setRecapMonthFilter] = useState<"all" | string>("all");

  const currentMonth = monthKey();

  useEffect(() => {
    async function loadOpsData() {
      try {
        const [membersRes, eventsRes, notesRes, followStaffRes] = await Promise.all([
          fetch("/api/admin/members", { cache: "no-store" }),
          fetch("/api/admin/members/events?limit=20", { cache: "no-store" }),
          fetch(`/api/evaluations/synthesis/save?month=${currentMonth}`, { cache: "no-store" }),
          fetch("/api/follow/staff", { cache: "no-store" }),
        ]);

        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers((membersData.members || []) as MemberLite[]);
        }

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents((eventsData.events || []) as MemberEventLite[]);
        }

        if (notesRes.ok) {
          const notesData = await notesRes.json();
          const finalNotes = notesData.finalNotes || {};
          setFinalNotesCount(Object.keys(finalNotes).length);
        }

        if (followStaffRes.ok) {
          const staffData = await followStaffRes.json();
          const activeCount = (staffData.staff || []).filter((s: any) => s.isActive !== false).length;
          setActiveFollowStaffCount(activeCount);
        }
      } catch (error) {
        console.error("Erreur chargement dashboard2:", error);
      } finally {
        setLoading(false);
      }
    }

    loadOpsData();
  }, [currentMonth]);

  useEffect(() => {
    async function loadVisualData() {
      try {
        const [dashboardRes, spotlightRes, raidsRes] = await Promise.all([
          fetch("/api/dashboard/data", { cache: "no-store" }),
          fetch("/api/spotlight/progression", { cache: "no-store" }),
          fetch(`/api/discord/raids/data-v2?month=${currentMonth}`, { cache: "no-store" }),
        ]);

        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json();
          const growth = dashboardData?.data?.discordGrowth || [];
          const daily = dashboardData?.data?.discordDailyActivity || [];
          setDiscordGrowthData(growth);

          const byMonth = new Map<string, { date: Date; messages: number; vocals: number }>();
          for (const day of daily) {
            const d = new Date(day.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const current = byMonth.get(key) || { date: new Date(d.getFullYear(), d.getMonth(), 1), messages: 0, vocals: 0 };
            current.messages += Number(day.messages || 0);
            current.vocals += Number(day.vocals || 0);
            byMonth.set(key, current);
          }
          const aggregated = Array.from(byMonth.values())
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(-12)
            .map((it) => ({
              month: monthLabelFromDate(it.date),
              messages: it.messages,
              vocals: Math.round(it.vocals * 10) / 10,
            }));
          setMonthlyActivityData(aggregated);
        }

        if (spotlightRes.ok) {
          const spotlightData = await spotlightRes.json();
          setSpotlightProgressionData(spotlightData?.data || []);
        }

        if (raidsRes.ok) {
          const raidsData = await raidsRes.json();
          setRaidStats({
            totalRaidsReceived: raidsData?.stats?.totalRaidsRecus || 0,
            totalRaidsSent: raidsData?.stats?.totalRaidsFaits || 0,
          });
        }
      } catch (error) {
        console.error("Erreur chargement visual data:", error);
      } finally {
        setLoadingVisual(false);
      }
    }

    loadVisualData();
  }, [currentMonth]);

  useEffect(() => {
    async function loadEventsRecapData() {
      try {
        const registrationsRes = await fetch("/api/admin/events/registrations", { cache: "no-store" });
        if (!registrationsRes.ok) {
          setRecapEvents([]);
          return;
        }

        const registrationsData = await registrationsRes.json();
        const baseEvents = registrationsData.eventsWithRegistrations || [];
        const now = new Date();
        const pastEvents = baseEvents.filter((item: any) => new Date(item.event.date) < now);

        const withPresences: RecapEvent[] = await Promise.all(
          pastEvents.map(async (item: any) => {
            try {
              const presenceRes = await fetch(`/api/admin/events/presence?eventId=${item.event.id}`, { cache: "no-store" });
              if (!presenceRes.ok) {
                return {
                  event: item.event,
                  registrationCount: item.registrationCount || 0,
                  presenceCount: 0,
                };
              }
              const presenceData = await presenceRes.json();
              const presenceCount = (presenceData.presences || []).filter((p: any) => p.present).length;
              return {
                event: item.event,
                registrationCount: item.registrationCount || 0,
                presenceCount,
              };
            } catch {
              return {
                event: item.event,
                registrationCount: item.registrationCount || 0,
                presenceCount: 0,
              };
            }
          })
        );

        setRecapEvents(withPresences);
      } catch (error) {
        console.error("Erreur chargement recap events:", error);
      } finally {
        setLoadingRecap(false);
      }
    }

    loadEventsRecapData();
  }, []);

  const kpis = useMemo(() => {
    const activeMembers = members.filter((m) => m.isActive !== false);
    const missingDiscord = activeMembers.filter((m) => !m.discordId).length;
    const missingTwitchId = activeMembers.filter((m) => !m.twitchId).length;
    const incomplete = activeMembers.filter((m) => completionPct(m) < 80).length;
    const now = Date.now();
    const reviewOverdue = activeMembers.filter((m) => m.nextReviewAt && new Date(m.nextReviewAt).getTime() <= now).length;
    const reviewDue7d = activeMembers.filter((m) => {
      if (!m.nextReviewAt) return false;
      const t = new Date(m.nextReviewAt).getTime();
      return t > now && t <= now + 7 * 24 * 60 * 60 * 1000;
    }).length;
    const avgCompletion = activeMembers.length
      ? Math.round(activeMembers.reduce((sum, m) => sum + completionPct(m), 0) / activeMembers.length)
      : 0;
    const validatedProfiles = activeMembers.filter((m) => m.profileValidationStatus === "valide").length;

    return {
      total: activeMembers.length,
      missingDiscord,
      missingTwitchId,
      incomplete,
      reviewOverdue,
      reviewDue7d,
      avgCompletion,
      validatedProfiles,
    };
  }, [members]);

  const filteredRecapEvents = useMemo(() => {
    if (recapMonthFilter === "all") return recapEvents;
    return recapEvents.filter((item) => item.event.date.startsWith(recapMonthFilter));
  }, [recapEvents, recapMonthFilter]);

  const recapCategoryStats = useMemo(() => {
    const byCategory = new Map<string, { count: number; registrations: number; presences: number }>();
    for (const item of filteredRecapEvents) {
      const category = item.event.category || "Sans catégorie";
      const current = byCategory.get(category) || { count: 0, registrations: 0, presences: 0 };
      current.count += 1;
      current.registrations += item.registrationCount;
      current.presences += item.presenceCount;
      byCategory.set(category, current);
    }
    return Array.from(byCategory.entries())
      .map(([category, value]) => ({
        category,
        ...value,
        avgPresence: value.count > 0 ? Math.round((value.presences / value.count) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.presences - a.presences);
  }, [filteredRecapEvents]);

  const eventAnomalies = useMemo(() => {
    return filteredRecapEvents
      .map((item) => {
        const rate = item.registrationCount > 0 ? (item.presenceCount / item.registrationCount) * 100 : 0;
        return { ...item, rate: Math.round(rate * 10) / 10 };
      })
      .filter((item) => item.registrationCount > 0 && (item.presenceCount === 0 || item.rate < 30))
      .sort((a, b) => a.rate - b.rate);
  }, [filteredRecapEvents]);

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of recapEvents) {
      set.add(item.event.date.slice(0, 7));
    }
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [recapEvents]);

  const workflow: WorkflowStep[] = useMemo(() => {
    return [
      {
        id: "members_quality",
        label: "Qualité des fiches membres",
        href: "/admin/membres/incomplets",
        status: kpis.incomplete === 0 ? "done" : kpis.incomplete < 10 ? "in_progress" : "todo",
        helper: `${kpis.incomplete} incomplets`,
      },
      {
        id: "eval_d",
        label: "Évaluation D (synthèse)",
        href: "/admin/evaluation/d",
        status: finalNotesCount > 0 ? "in_progress" : "todo",
        helper: `${finalNotesCount} note(s) manuelle(s)`,
      },
      {
        id: "follow",
        label: "Suivi des follows",
        href: "/admin/follow",
        status: activeFollowStaffCount > 0 ? "in_progress" : "todo",
        helper: `${activeFollowStaffCount} staff actif(s)`,
      },
      {
        id: "reviews",
        label: "Revues staff",
        href: "/admin/membres/gestion",
        status: kpis.reviewOverdue === 0 ? "done" : "todo",
        helper: `${kpis.reviewOverdue} en retard`,
      },
    ];
  }, [kpis.incomplete, kpis.reviewOverdue, finalNotesCount, activeFollowStaffCount]);

  const priorityCards = [
    {
      title: "Comptes incomplets bloquants",
      value: kpis.incomplete,
      hint: "Membres actifs à corriger",
      href: "/admin/membres/incomplets",
      color: "text-amber-300",
    },
    {
      title: "Revues en retard",
      value: kpis.reviewOverdue,
      hint: "nextReviewAt dépassée",
      href: "/admin/membres/gestion",
      color: "text-red-300",
    },
    {
      title: "Sans ID Twitch",
      value: kpis.missingTwitchId,
      hint: "Risque de mismatch Twitch",
      href: "/admin/membres/incomplets",
      color: "text-yellow-300",
    },
    {
      title: "Sans ID Discord",
      value: kpis.missingDiscord,
      hint: "Liaison Discord manquante",
      href: "/admin/membres/incomplets",
      color: "text-orange-300",
    },
  ];

  const quickActions = [
    { label: "Membres incomplets", href: "/admin/membres/incomplets" },
    { label: "Gestion membres", href: "/admin/membres/gestion" },
    { label: "Évaluation D", href: "/admin/evaluation/d" },
    { label: "Suivi follow", href: "/admin/follow" },
    { label: "Audit", href: "/admin/founders/audit" },
    { label: "Sync Discord", href: "/admin/membres/synchronisation" },
  ];

  const statusStyle = (status: WorkflowStep["status"]) => {
    if (status === "done") return "bg-green-500/20 text-green-300 border-green-500/30";
    if (status === "in_progress") return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    return "bg-gray-500/20 text-gray-300 border-gray-500/30";
  };

  if (loading) {
    return (
      <div className="text-white">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#9146ff]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard Admin v2</h1>
            <p className="text-gray-400">Vue orientée priorités et actions — {currentMonth}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#1a1a1d] border border-gray-700 hover:border-[#9146ff] transition-colors"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {(kpis.reviewOverdue > 0 || kpis.missingDiscord > 0 || kpis.missingTwitchId > 0) && (
        <div className="mb-6 bg-[#1a1a1d] border border-red-500/40 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-300 mb-2">Alertes critiques</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            {kpis.reviewOverdue > 0 && <span>{kpis.reviewOverdue} revue(s) en retard</span>}
            {kpis.missingDiscord > 0 && <span>{kpis.missingDiscord} membre(s) sans ID Discord</span>}
            {kpis.missingTwitchId > 0 && <span>{kpis.missingTwitchId} membre(s) sans ID Twitch</span>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {priorityCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-5 hover:border-[#9146ff] transition-colors"
          >
            <p className="text-sm text-gray-400 mb-2">{card.title}</p>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-2">{card.hint}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-center">Raids envoyés</h3>
          <p className="text-4xl font-bold text-center text-white">{raidStats.totalRaidsSent}</p>
          <p className="text-xs text-gray-500 text-center mt-2">Mois courant</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-center">Raids reçus</h3>
          <p className="text-4xl font-bold text-center text-white">{raidStats.totalRaidsReceived}</p>
          <p className="text-xs text-gray-500 text-center mt-2">Mois courant</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-center">Activité Discord</h3>
          <p className="text-4xl font-bold text-center text-white">
            {monthlyActivityData.length > 0
              ? monthlyActivityData[monthlyActivityData.length - 1]?.messages?.toLocaleString()
              : 0}
          </p>
          <p className="text-xs text-gray-500 text-center mt-2">Messages sur le dernier mois disponible</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Activité Discord</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1d", border: "1px solid #2a2a2d", borderRadius: "8px" }}
                />
                <Line type="monotone" dataKey="messages" stroke="#5865F2" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="vocals" stroke="#57F287" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Croissance Discord</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={discordGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1d", border: "1px solid #2a2a2d", borderRadius: "8px" }}
                />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Progression Spotlight</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spotlightProgressionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1d", border: "1px solid #2a2a2d", borderRadius: "8px" }}
                />
                <Bar dataKey="value" fill="#9146ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Workflow mensuel</h2>
          <div className="space-y-3">
            {workflow.map((step) => (
              <Link
                key={step.id}
                href={step.href}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-700 hover:border-[#9146ff] transition-colors"
              >
                <div>
                  <p className="font-medium">{step.label}</p>
                  <p className="text-xs text-gray-500">{step.helper}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs border ${statusStyle(step.status)}`}>
                  {step.status === "done" ? "Terminé" : step.status === "in_progress" ? "En cours" : "À faire"}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Santé des données</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Membres actifs</span>
              <span className="font-semibold">{kpis.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Complétude moyenne</span>
              <span className="font-semibold">{kpis.avgCompletion}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Profils validés</span>
              <span className="font-semibold">{kpis.validatedProfiles}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Revues dues &lt; 7 jours</span>
              <span className="font-semibold">{kpis.reviewDue7d}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Activité récente (24-48h)</h2>
        {events.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune activité récente.</p>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between text-sm border-b border-gray-800 pb-2"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-gray-200 truncate">
                    {event.type} · {event.memberId}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {event.actor || "system"} · {event.source || "n/a"}
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(event.createdAt).toLocaleString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h2 className="text-xl font-semibold">Suivi événements (tableaux)</h2>
          <div className="flex items-center gap-2">
            <select
              value={recapMonthFilter}
              onChange={(e) => setRecapMonthFilter(e.target.value)}
              className="bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="all">Tous les mois</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <Link
              href="/admin/events/recap"
              className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#0e0e10] border border-gray-700 hover:border-[#9146ff]"
            >
              Ouvrir recap complet
            </Link>
          </div>
        </div>

        {loadingRecap ? (
          <div className="py-10 text-center text-gray-400">Chargement recap événements...</div>
        ) : filteredRecapEvents.length === 0 ? (
          <div className="py-10 text-center text-gray-400">Aucune donnée événement disponible pour ce filtre.</div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Top événements</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 bg-[#0e0e10]">
                      <th className="text-left py-3 px-4">Événement</th>
                      <th className="text-left py-3 px-4">Catégorie</th>
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-right py-3 px-4">Inscriptions</th>
                      <th className="text-right py-3 px-4">Présents</th>
                      <th className="text-right py-3 px-4">Taux</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredRecapEvents]
                      .map((item) => ({
                        ...item,
                        rate: item.registrationCount > 0 ? Math.round((item.presenceCount / item.registrationCount) * 1000) / 10 : 0,
                      }))
                      .sort((a, b) => b.rate - a.rate)
                      .slice(0, 8)
                      .map((item) => (
                        <tr key={item.event.id} className="border-b border-gray-800">
                          <td className="py-3 px-4">{item.event.title}</td>
                          <td className="py-3 px-4 text-gray-400">{item.event.category}</td>
                          <td className="py-3 px-4 text-gray-400">{new Date(item.event.date).toLocaleDateString("fr-FR")}</td>
                          <td className="py-3 px-4 text-right">{item.registrationCount}</td>
                          <td className="py-3 px-4 text-right">{item.presenceCount}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={item.rate >= 70 ? "text-green-400" : item.rate >= 40 ? "text-yellow-400" : "text-red-400"}>
                              {item.rate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Statistiques par catégorie</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 bg-[#0e0e10]">
                        <th className="text-left py-3 px-4">Catégorie</th>
                        <th className="text-right py-3 px-4">Events</th>
                        <th className="text-right py-3 px-4">Inscriptions</th>
                        <th className="text-right py-3 px-4">Présences</th>
                        <th className="text-right py-3 px-4">Moyenne</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recapCategoryStats.map((row) => (
                        <tr key={row.category} className="border-b border-gray-800">
                          <td className="py-3 px-4">{row.category}</td>
                          <td className="py-3 px-4 text-right">{row.count}</td>
                          <td className="py-3 px-4 text-right">{row.registrations}</td>
                          <td className="py-3 px-4 text-right">{row.presences}</td>
                          <td className="py-3 px-4 text-right text-gray-300">{row.avgPresence.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Anomalies de suivi</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 bg-[#0e0e10]">
                        <th className="text-left py-3 px-4">Événement</th>
                        <th className="text-right py-3 px-4">Inscrits</th>
                        <th className="text-right py-3 px-4">Présents</th>
                        <th className="text-right py-3 px-4">Taux</th>
                        <th className="text-left py-3 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventAnomalies.slice(0, 8).map((item) => (
                        <tr key={item.event.id} className="border-b border-gray-800">
                          <td className="py-3 px-4">{item.event.title}</td>
                          <td className="py-3 px-4 text-right">{item.registrationCount}</td>
                          <td className="py-3 px-4 text-right">{item.presenceCount}</td>
                          <td className="py-3 px-4 text-right text-red-300">{item.rate.toFixed(1)}%</td>
                          <td className="py-3 px-4">
                            <Link href="/admin/events/presence" className="text-[#9146ff] hover:text-[#7c3aed]">
                              Corriger
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {eventAnomalies.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 px-4 text-center text-gray-500">
                            Aucune anomalie détectée 🎉
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
