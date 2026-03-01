"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

export default function Dashboard2Page() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [events, setEvents] = useState<MemberEventLite[]>([]);
  const [finalNotesCount, setFinalNotesCount] = useState(0);
  const [activeFollowStaffCount, setActiveFollowStaffCount] = useState(0);

  const currentMonth = monthKey();

  useEffect(() => {
    async function loadData() {
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

    loadData();
  }, [currentMonth]);

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
    </div>
  );
}
