"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarHeart,
  ClipboardCheck,
  HeartHandshake,
  Sparkles,
  Users,
} from "lucide-react";
import type { CSSProperties } from "react";

type EventRegistrationEntry = {
  event: {
    id: string;
    title: string;
    date: string;
    category?: string;
    isPublished?: boolean;
  };
  registrationCount: number;
  presenceCount?: number;
};

type ProposalLite = { status?: string; votesCount?: number };

type AdminMemberLite = {
  birthday?: string | null;
  twitchAffiliateDate?: string | null;
  isActive?: boolean;
};

type AggregateLite = {
  data?: {
    ops?: {
      followOverdueStaffNames?: string[];
      raidsPendingCount?: number;
      discordPointsPendingCount?: number;
      profileValidationPendingCount?: number;
    };
    visual?: {
      raidStats?: {
        totalRaidsReceived?: number;
        totalRaidsSent?: number;
      };
      discordMonthStats?: {
        totalMessages?: number;
        totalVoiceHours?: number;
      };
    };
    recap?: {
      upcomingKpis?: {
        pendingEventValidations?: number;
      };
    };
  };
};

type SpotlightProgressionLite = {
  data?: Array<{ month: string; value: number }>;
};

type UpaContentLite = {
  content?: {
    socialProof?: { totalRegistered?: number };
    staff?: Array<{ isActive?: boolean }>;
    timeline?: Array<{ status?: string }>;
  };
};

const sectionCardClass =
  "rounded-2xl border border-[#2b2b36] bg-gradient-to-br from-[#191923] via-[#15151d] to-[#121218] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.28)]";
const denseStatCardClass =
  "rounded-xl border border-white/10 bg-black/20 p-3 min-h-[92px] flex flex-col justify-between";
const quickLinkClass =
  "rounded-lg border border-white/15 px-3 py-1.5 hover:border-[#d4af37] transition-colors";

const premiumHeroStyle: CSSProperties = {
  borderColor: "rgba(212,175,55,0.22)",
  background:
    "radial-gradient(circle at 15% 20%, rgba(212,175,55,0.18), rgba(212,175,55,0) 45%), linear-gradient(155deg, rgba(30,30,36,0.96), rgba(17,17,22,0.98))",
  boxShadow: "0 18px 42px rgba(0, 0, 0, 0.3)",
};

const premiumCardStyle: CSSProperties = {
  borderColor: "rgba(212,175,55,0.18)",
  background: "linear-gradient(155deg, rgba(30,30,36,0.95), rgba(19,19,24,0.98))",
  boxShadow: "0 16px 36px rgba(0, 0, 0, 0.22)",
};

const softCardStyle: CSSProperties = {
  borderColor: "rgba(255,255,255,0.1)",
  background: "linear-gradient(160deg, rgba(24,24,30,0.95), rgba(15,15,20,0.96))",
};

function normalizeCategoryLabel(value: string | undefined): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function parseDateSafe(value: string | undefined | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function countMonthHits(values: Array<string | null | undefined>, month: number): number {
  return values.reduce((acc, value) => {
    const date = parseDateSafe(value);
    return date && date.getUTCMonth() === month ? acc + 1 : acc;
  }, 0);
}

function countNext30Days(values: Array<string | null | undefined>, now: Date): number {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return values.reduce((acc, value) => {
    const date = parseDateSafe(value);
    if (!date) return acc;
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    let year = now.getUTCFullYear();
    let candidate = Date.UTC(year, month, day);
    if (candidate < todayUtc) {
      year += 1;
      candidate = Date.UTC(year, month, day);
    }
    const diff = Math.floor((candidate - todayUtc) / (24 * 60 * 60 * 1000));
    return diff >= 0 && diff <= 30 ? acc + 1 : acc;
  }, 0);
}

function kpiBadgeTone(value: number, target = 0): string {
  if (value <= target) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (value <= target + 2) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-rose-500/15 text-rose-300 border-rose-500/30";
}

export default function CommunityDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRegistrationEntry[]>([]);
  const [proposals, setProposals] = useState<ProposalLite[]>([]);
  const [members, setMembers] = useState<AdminMemberLite[]>([]);
  const [aggregate, setAggregate] = useState<AggregateLite | null>(null);
  const [spotlightProgress, setSpotlightProgress] = useState<Array<{ month: string; value: number }>>([]);
  const [upaContent, setUpaContent] = useState<UpaContentLite["content"] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setLoadError(null);

        const [
          eventsRes,
          aggregateRes,
          spotlightRes,
          proposalsRes,
          membersRes,
          upaRes,
        ] = await Promise.allSettled([
          fetch("/api/admin/events/registrations", { cache: "no-store" }),
          fetch("/api/admin/dashboard/aggregate", { cache: "no-store" }),
          fetch("/api/spotlight/progression", { cache: "no-store" }),
          fetch("/api/admin/events/proposals", { cache: "no-store" }),
          fetch("/api/admin/members", { cache: "no-store" }),
          fetch("/api/upa-event/content?slug=upa-event", { cache: "no-store" }),
        ]);

        if (!mounted) return;

        if (eventsRes.status === "fulfilled" && eventsRes.value.ok) {
          const payload = await eventsRes.value.json();
          setEvents((payload.eventsWithRegistrations || []) as EventRegistrationEntry[]);
        }

        if (aggregateRes.status === "fulfilled" && aggregateRes.value.ok) {
          const payload = (await aggregateRes.value.json()) as AggregateLite;
          setAggregate(payload);
        }

        if (spotlightRes.status === "fulfilled" && spotlightRes.value.ok) {
          const payload = (await spotlightRes.value.json()) as SpotlightProgressionLite;
          setSpotlightProgress(payload.data || []);
        }

        if (proposalsRes.status === "fulfilled" && proposalsRes.value.ok) {
          const payload = await proposalsRes.value.json();
          setProposals((payload.proposals || []) as ProposalLite[]);
        }

        if (membersRes.status === "fulfilled" && membersRes.value.ok) {
          const payload = await membersRes.value.json();
          setMembers((payload.members || []) as AdminMemberLite[]);
        }

        if (upaRes.status === "fulfilled" && upaRes.value.ok) {
          const payload = (await upaRes.value.json()) as UpaContentLite;
          setUpaContent(payload.content || null);
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Erreur de chargement");
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadedAt(new Date().toISOString());
        }
      }
    }

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const now = new Date();

  const metrics = useMemo(() => {
    const normalized = events.map((item) => {
      const date = parseDateSafe(item.event.date) || now;
      return {
        ...item,
        date,
        categoryKey: normalizeCategoryLabel(item.event.category),
      };
    });

    const upcoming = normalized.filter((item) => item.date.getTime() >= now.getTime());
    const past = normalized.filter((item) => item.date.getTime() < now.getTime());
    const spotlightItems = normalized.filter((item) => item.categoryKey.includes("spotlight"));
    const spotlightPast = spotlightItems.filter((item) => item.date.getTime() < now.getTime());
    const spotlightUpcoming = spotlightItems.filter((item) => item.date.getTime() >= now.getTime());

    const totalRegistrations = normalized.reduce((acc, item) => acc + Number(item.registrationCount || 0), 0);
    const totalPresence = past.reduce((acc, item) => acc + Number(item.presenceCount || 0), 0);
    const publishedCount = normalized.filter((item) => item.event.isPublished).length;

    const proposalsPending = proposals.filter((proposal) => {
      const status = (proposal.status || "").toLowerCase();
      return status === "pending" || status === "nouveau" || status === "to_review";
    }).length;
    const proposalsHot = proposals.filter((proposal) => Number(proposal.votesCount || 0) >= 5).length;

    const spotlightTrend =
      spotlightProgress.length >= 2
        ? Number(spotlightProgress[spotlightProgress.length - 1]?.value || 0) -
          Number(spotlightProgress[spotlightProgress.length - 2]?.value || 0)
        : 0;

    const birthdays = members.map((member) => member.birthday);
    const affiliateDates = members.map((member) => member.twitchAffiliateDate);
    const month = now.getUTCMonth();

    const upaRegistered = Number(upaContent?.socialProof?.totalRegistered || 0);
    const upaStaffActive = (upaContent?.staff || []).filter((member) => member.isActive !== false).length;
    const upaTimelineOpen = (upaContent?.timeline || []).filter(
      (item) => (item.status || "").toLowerCase() !== "done"
    ).length;

    const raidsReceived = Number(aggregate?.data?.visual?.raidStats?.totalRaidsReceived || 0);
    const raidsSent = Number(aggregate?.data?.visual?.raidStats?.totalRaidsSent || 0);
    const followOverdue = (aggregate?.data?.ops?.followOverdueStaffNames || []).length;
    const raidsPending = Number(aggregate?.data?.ops?.raidsPendingCount || 0);
    const discordPointsPending = Number(aggregate?.data?.ops?.discordPointsPendingCount || 0);
    const pendingPresenceValidations = Number(
      aggregate?.data?.recap?.upcomingKpis?.pendingEventValidations || 0
    );

    return {
      global: {
        totalEvents: normalized.length,
        upcomingEvents: upcoming.length,
        totalRegistrations,
        totalPresence,
        publishedRate: normalized.length > 0 ? Math.round((publishedCount / normalized.length) * 100) : 0,
        pendingPresenceValidations,
      },
      events: {
        total: normalized.length,
        upcoming: upcoming.length,
        avgRegistrations: normalized.length > 0 ? Math.round((totalRegistrations / normalized.length) * 10) / 10 : 0,
        proposalsPending,
        proposalsHot,
        pendingPresenceValidations,
      },
      spotlight: {
        total: spotlightItems.length,
        upcoming: spotlightUpcoming.length,
        avgPresencePast:
          spotlightPast.length > 0
            ? Math.round(
                (spotlightPast.reduce((acc, item) => acc + Number(item.presenceCount || 0), 0) / spotlightPast.length) *
                  10
              ) / 10
            : 0,
        trend: Math.round(spotlightTrend * 10) / 10,
      },
      birthdays: {
        thisMonth: countMonthHits(birthdays, month),
        affiliateThisMonth: countMonthHits(affiliateDates, month),
        next30Days: countNext30Days(birthdays, now),
        affiliateNext30Days: countNext30Days(affiliateDates, now),
      },
      upa: {
        totalRegistered: upaRegistered,
        activeStaff: upaStaffActive,
        timelineOpen: upaTimelineOpen,
      },
      engagement: {
        raidsReceived,
        raidsSent,
        followOverdue,
        raidsPending,
        discordPointsPending,
        discordMessages: Number(aggregate?.data?.visual?.discordMonthStats?.totalMessages || 0),
        discordVoiceHours: Number(aggregate?.data?.visual?.discordMonthStats?.totalVoiceHours || 0),
      },
    };
  }, [aggregate, events, members, now, proposals, spotlightProgress, upaContent]);

  const actionBoard = useMemo(() => {
    return [
      {
        id: "presence-validations",
        label: "Valider les présences des événements passés",
        count: metrics.events.pendingPresenceValidations,
        href: "/admin/events/presence",
      },
      {
        id: "proposals-pending",
        label: "Traiter les propositions d'événements",
        count: metrics.events.proposalsPending,
        href: "/admin/events/propositions",
      },
      {
        id: "follow-overdue",
        label: "Relancer les follows en retard",
        count: metrics.engagement.followOverdue,
        href: "/admin/engagement/follow",
      },
      {
        id: "raids-pending",
        label: "Finaliser les raids en attente",
        count: metrics.engagement.raidsPending,
        href: "/admin/engagement/raids-a-valider",
      },
      {
        id: "points-discord",
        label: "Valider les points Discord raids",
        count: metrics.engagement.discordPointsPending,
        href: "/admin/engagement/points-discord",
      },
      {
        id: "spotlight-next",
        label: "Préparer les prochains Spotlights",
        count: metrics.spotlight.upcoming,
        href: "/admin/events/spotlight",
      },
    ]
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [metrics]);

  const loadedAtLabel = useMemo(() => {
    if (!loadedAt) return "Mise à jour en cours";
    const date = new Date(loadedAt);
    if (Number.isNaN(date.getTime())) return "Mise à jour récente";
    return `Dernière synchro: ${date.toLocaleString("fr-FR")}`;
  }, [loadedAt]);

  return (
    <div className="text-white space-y-8">
      <div className="rounded-2xl border p-6 md:p-7" style={premiumHeroStyle}>
        <Link href="/admin/dashboard" className="text-gray-300 hover:text-white transition-colors mb-4 inline-block">
          ← Retour au Dashboard
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#fff4cf] via-[#f4d27a] to-[#d4af37] bg-clip-text text-transparent">
              Vie communautaire - Dashboard de pilotage
            </h1>
            <p className="text-gray-300 max-w-3xl">
              Vision consolidée de la communauté: événements, Spotlight, anniversaires, UPA Event et engagement.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-300">
            {loadedAtLabel}
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-200">
          Chargement partiel: {loadError}
        </div>
      ) : null}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Vue globale</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className={`${sectionCardClass} min-h-[138px]`} style={premiumCardStyle}>
            <p className="text-sm text-gray-400">Événements total</p>
            <p className="mt-2 text-3xl font-bold">{metrics.global.totalEvents}</p>
            <p className="mt-2 text-xs text-gray-400">{metrics.global.upcomingEvents} à venir</p>
          </div>
          <div className={`${sectionCardClass} min-h-[138px]`} style={premiumCardStyle}>
            <p className="text-sm text-gray-400">Inscriptions total</p>
            <p className="mt-2 text-3xl font-bold">{metrics.global.totalRegistrations}</p>
            <p className="mt-2 text-xs text-gray-400">{metrics.global.totalPresence} présences validées</p>
          </div>
          <div className={`${sectionCardClass} min-h-[138px]`} style={premiumCardStyle}>
            <p className="text-sm text-gray-400">Taux de publication</p>
            <p className="mt-2 text-3xl font-bold">{metrics.global.publishedRate}%</p>
            <p className="mt-2 text-xs text-gray-400">Qualité de mise en ligne des événements</p>
          </div>
          <div className={`${sectionCardClass} min-h-[138px]`} style={premiumCardStyle}>
            <p className="text-sm text-gray-400">Présences à valider</p>
            <p className={`mt-2 text-3xl font-bold ${metrics.global.pendingPresenceValidations > 0 ? "text-amber-300" : "text-emerald-300"}`}>
              {metrics.global.pendingPresenceValidations}
            </p>
            <p className="mt-2 text-xs text-gray-400">Priorité opérationnelle du jour</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">À traiter maintenant</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {actionBoard.length === 0 ? (
            <div className={`${sectionCardClass} text-sm text-emerald-300 xl:col-span-3`} style={softCardStyle}>
              Aucun backlog critique détecté pour le moment.
            </div>
          ) : (
            actionBoard.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`${sectionCardClass} min-h-[112px] transition hover:border-[#d4af37]/60 hover:-translate-y-[1px]`}
                style={softCardStyle}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-medium">{item.label}</p>
                  <span
                    className={`inline-flex min-w-10 justify-center rounded-full border px-2 py-1 text-xs font-semibold ${kpiBadgeTone(
                      item.count,
                      0
                    )}`}
                  >
                    {item.count}
                  </span>
                </div>
                <p className="text-xs text-gray-400">Action directe en un clic</p>
              </Link>
            ))
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className={`${sectionCardClass} min-h-[340px]`} style={softCardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-[#d4af37]" />
            <h3 className="text-lg font-semibold">Événements</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={denseStatCardClass}>
              <p className="text-gray-400">À venir</p>
              <p className="text-2xl font-bold mt-1">{metrics.events.upcoming}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Moy. inscriptions</p>
              <p className="text-2xl font-bold mt-1">{metrics.events.avgRegistrations}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Propositions en attente</p>
              <p className="text-2xl font-bold mt-1">{metrics.events.proposalsPending}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Propositions populaires</p>
              <p className="text-2xl font-bold mt-1">{metrics.events.proposalsHot}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link href="/admin/events/planification" className={quickLinkClass}>
              Planification
            </Link>
            <Link href="/admin/events/liste" className={quickLinkClass}>
              Liste des événements
            </Link>
            <Link href="/admin/events/propositions" className={quickLinkClass}>
              Propositions
            </Link>
            <Link href="/admin/events/recap" className={quickLinkClass}>
              Récapitulatif
            </Link>
          </div>
        </section>

        <section className={`${sectionCardClass} min-h-[340px]`} style={softCardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-[#d4af37]" />
            <h3 className="text-lg font-semibold">Spotlight</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Sessions Spotlight</p>
              <p className="text-2xl font-bold mt-1">{metrics.spotlight.total}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">À venir</p>
              <p className="text-2xl font-bold mt-1">{metrics.spotlight.upcoming}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Moy. présents (passé)</p>
              <p className="text-2xl font-bold mt-1">{metrics.spotlight.avgPresencePast}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Tendance mensuelle</p>
              <p className={`text-2xl font-bold mt-1 ${metrics.spotlight.trend >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {metrics.spotlight.trend >= 0 ? "+" : ""}
                {metrics.spotlight.trend}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link href="/admin/events/spotlight" className={quickLinkClass}>
              Dashboard Spotlight
            </Link>
            <Link href="/admin/events/spotlight/presences" className={quickLinkClass}>
              Présences validées
            </Link>
            <Link href="/admin/events/spotlight/analytics" className={quickLinkClass}>
              Analytics
            </Link>
            <Link href="/admin/spotlight/evaluation" className={quickLinkClass}>
              Évaluation
            </Link>
          </div>
        </section>

        <section className={`${sectionCardClass} min-h-[340px]`} style={softCardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <CalendarHeart className="h-5 w-5 text-[#d4af37]" />
            <h3 className="text-lg font-semibold">Anniversaires</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Anniversaires ce mois</p>
              <p className="text-2xl font-bold mt-1">{metrics.birthdays.thisMonth}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Affiliations ce mois</p>
              <p className="text-2xl font-bold mt-1">{metrics.birthdays.affiliateThisMonth}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Anniversaires J+30</p>
              <p className="text-2xl font-bold mt-1">{metrics.birthdays.next30Days}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Affiliations J+30</p>
              <p className="text-2xl font-bold mt-1">{metrics.birthdays.affiliateNext30Days}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link href="/admin/events/anniversaires/mois" className={quickLinkClass}>
              Anniversaires du mois
            </Link>
            <Link href="/admin/events/anniversaires/tous" className={quickLinkClass}>
              Tous les anniversaires
            </Link>
          </div>
        </section>

        <section className={`${sectionCardClass} min-h-[340px]`} style={softCardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <HeartHandshake className="h-5 w-5 text-[#d4af37]" />
            <h3 className="text-lg font-semibold">UPA Event</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Participants inscrits</p>
              <p className="text-2xl font-bold mt-1">{metrics.upa.totalRegistered}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Staff actif</p>
              <p className="text-2xl font-bold mt-1">{metrics.upa.activeStaff}</p>
            </div>
            <div className={`${denseStatCardClass} col-span-2`}>
              <p className="text-gray-400">Jalons timeline ouverts</p>
              <p className={`text-2xl font-bold mt-1 ${metrics.upa.timelineOpen > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                {metrics.upa.timelineOpen}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link href="/admin/upa-event" className={quickLinkClass}>
              Gestion UPA Event
            </Link>
          </div>
        </section>

        <section className={`${sectionCardClass} min-h-[340px]`} style={softCardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-[#d4af37]" />
            <h3 className="text-lg font-semibold">Engagement</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Raids reçus</p>
              <p className="text-2xl font-bold mt-1">{metrics.engagement.raidsReceived}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Raids envoyés</p>
              <p className="text-2xl font-bold mt-1">{metrics.engagement.raidsSent}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Messages Discord</p>
              <p className="text-2xl font-bold mt-1">{metrics.engagement.discordMessages}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Heures vocales</p>
              <p className="text-2xl font-bold mt-1">{metrics.engagement.discordVoiceHours}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Follows en retard</p>
              <p className={`text-2xl font-bold mt-1 ${metrics.engagement.followOverdue > 0 ? "text-rose-300" : "text-emerald-300"}`}>
                {metrics.engagement.followOverdue}
              </p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Raids à valider</p>
              <p className={`text-2xl font-bold mt-1 ${metrics.engagement.raidsPending > 0 ? "text-rose-300" : "text-emerald-300"}`}>
                {metrics.engagement.raidsPending}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link href="/admin/engagement/follow" className={quickLinkClass}>
              Follow
            </Link>
            <Link href="/admin/raids" className={quickLinkClass}>
              Suivi des raids
            </Link>
            <Link href="/admin/engagement/raids-a-valider" className={quickLinkClass}>
              Raids à valider
            </Link>
            <Link href="/admin/engagement/points-discord" className={quickLinkClass}>
              Points Discord raids
            </Link>
            <Link href="/admin/follow" className={quickLinkClass}>
              Feuilles de follow
            </Link>
          </div>
        </section>
      </div>

      {loading ? (
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
          Chargement des indicateurs Vie communautaire...
        </div>
      ) : null}

      <section className="mt-8">
        <div className="rounded-2xl border border-[#2b2b36] bg-[#14141b] p-5" style={softCardStyle}>
          <div className="mb-3 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-[#d4af37]" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Accès rapides</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
            <Link href="/admin/events/liens-vocaux" className="rounded-lg border border-white/15 px-3 py-2 hover:border-[#d4af37] transition-colors">
              Liens vocaux
            </Link>
            <Link href="/admin/events/presence" className="rounded-lg border border-white/15 px-3 py-2 hover:border-[#d4af37] transition-colors">
              Présences & participation
            </Link>
            <Link href="/admin/events/archives" className="rounded-lg border border-white/15 px-3 py-2 hover:border-[#d4af37] transition-colors">
              Archives événements
            </Link>
            <Link href="/admin/spotlight/membres" className="rounded-lg border border-white/15 px-3 py-2 hover:border-[#d4af37] transition-colors">
              Historique évaluations Spotlight
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
