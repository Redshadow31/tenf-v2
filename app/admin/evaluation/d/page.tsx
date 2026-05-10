"use client";

import type { ReactNode } from "react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Database,
  Download,
  Gift,
  HeartHandshake,
  HelpCircle,
  History,
  Layers,
  LayoutDashboard,
  Mic2,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Table2,
  Users,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  calculateTotalHorsBonus,
  calculateTotalAvecBonus,
  getAutoStatus,
  calculateSeniority,
} from "@/lib/evaluationSynthesisHelpers";
import { calculateBonusTotal, TIMEZONE_BONUS_POINTS, type MemberBonus } from "@/lib/evaluationBonusHelpers";
import { getRoleBadgeClassName, getRoleBadgeLabel } from "@/lib/roleBadgeSystem";

// ============================================
// TYPES
// ============================================

interface MemberEvaluationData {
  twitchLogin: string;
  displayName: string;
  role: string;
  avatar?: string;
  createdAt?: string;
  isActive: boolean;
  isVip?: boolean; // Statut VIP
  
  // Notes par section
  spotlightPoints: number; // /5
  raidsPoints: number; // /5
  discordPoints: number; // /5
  eventsPoints: number; // /2
  followPoints: number; // /5
  
  // Bonus
  timezoneBonusEnabled: boolean;
  moderationBonus: number;
  
  // Calculs
  totalHorsBonus: number; // /25
  bonusTotal: number; // /7 (2 décalage + 5 modération)
  finalScore: number; // /32 (25 + 7)
  autoStatus: 'vip' | 'surveiller' | 'neutre';
  
  // Données brutes pour les stats
  spotlightPresences?: number;
  spotlightTotal?: number;
  raidsDone?: number;
  raidsReceived?: number;
  discordNbMessages?: number;
  discordNbVocalMinutes?: number;
  eventsPresences?: number;
  eventsTotal?: number;
  followScore?: number;
}

interface FinalNoteRecord {
  finalNote?: number;
  savedAt: string;
  savedBy: string;
}

interface OverrideLog {
  id: string;
  timestamp: string;
  action: string;
  actorDiscordId: string;
  actorUsername?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  previousValue?: any;
  newValue?: any;
}

interface GeneralStats {
  // Moyennes par domaine
  avgSpotlight: number;
  avgRaids: number;
  avgDiscord: number;
  avgEvents: number;
  avgFollow: number;
  avgGeneral: number; // Moyenne générale hors bonus
  
  // Score global
  scoreGlobalHorsBonus: number; // /25
  scoreGlobalAvecBonus: number; // /32
  
  // Présences
  eventsPresenceRate: number; // Taux présence Events
  eventsParticipants: number; // Nombre de participants Events
  spotlightPresenceRate: number; // Taux moyen présence Spotlights
  spotlightParticipants: number; // Nombre de participants Spotlights
  
  // VIP / Alertes
  vipCount: number; // Membres avec note finale >= 16
  surveillerCount: number; // Membres avec note finale < 5
}

function getPreviousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  const prevYear = date.getFullYear();
  const prevMonth = String(date.getMonth() + 1).padStart(2, "0");
  return `${prevYear}-${prevMonth}`;
}

/** Limite la taille d’un POST (snapshots) pour limiter 413 / timeouts sur l’hébergeur. */
const SYNTHESIS_SNAPSHOT_CHUNK_SIZE = 350;

function synthesisSaveErrorMessage(
  status: number,
  bodyText: string,
  parsed: Record<string, unknown>
): string {
  const e = parsed.error;
  const m = parsed.message;
  const d = parsed.details;
  if (typeof e === "string" && e.trim()) return e;
  if (typeof m === "string" && m.trim()) return m;
  if (typeof d === "string" && d.trim()) return d;
  const snippet = bodyText.replace(/\s+/g, " ").trim().slice(0, 180);
  if (snippet) return `HTTP ${status}: ${snippet}`;
  return `HTTP ${status}`;
}

// ============================================
// COMPOSANTS
// ============================================

function StatCard({
  title,
  value,
  subtitle,
  color = "#9146ff",
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className="group rounded-xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
          {title}
        </p>
        {icon ? (
          <span className="rounded-lg bg-white/[0.04] p-1.5" style={{ color }}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mb-1 text-2xl font-black tabular-nums tracking-tight" style={{ color }}>
        {value}
      </p>
      {subtitle ? (
        <p className="text-xs leading-snug" style={{ color: "var(--color-text-secondary)" }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export default function EvaluationDPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  
  const [membersData, setMembersData] = useState<MemberEvaluationData[]>([]);
  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<"all" | "surveiller" | "vip" | "manual" | "bonus">("all");
  const [activeTab, setActiveTab] = useState<"pilotage" | "tableau" | "historique">("pilotage");
  const [compactMode, setCompactMode] = useState(false);
  const [showAdvancedColumns, setShowAdvancedColumns] = useState(false);
  
  // États pour les bonus (édition en ligne)
  const [editingBonuses, setEditingBonuses] = useState<Record<string, { timezone: boolean; moderation: number }>>({});
  
  // États pour les notes finales manuelles et statuts (édition en ligne)
  const [editingFinalNotes, setEditingFinalNotes] = useState<Record<string, number | null>>({});
  const [editingFinalNoteReasons, setEditingFinalNoteReasons] = useState<Record<string, string>>({});
  const [editingStatuses, setEditingStatuses] = useState<Record<string, boolean>>({});
  const [editingRoles, setEditingRoles] = useState<Record<string, string>>({}); // Pour forcer Communauté/VIP
  const [editingVips, setEditingVips] = useState<Record<string, boolean>>({}); // Pour forcer VIP (isVip)
  const [currentMonthFinalNotes, setCurrentMonthFinalNotes] = useState<Record<string, FinalNoteRecord>>({});
  const [previousMonthFinalNotes, setPreviousMonthFinalNotes] = useState<Record<string, FinalNoteRecord>>({});
  const [previousMonthCalculatedScores, setPreviousMonthCalculatedScores] = useState<Record<string, number>>({});
  const [overrideLogs, setOverrideLogs] = useState<OverrideLog[]>([]);

  useEffect(() => {
    async function checkAccess() {
      try {
        // Utiliser l'API pour vérifier l'accès (supporte le cache Blobs et les rôles dans données membres)
        const response = await fetch('/api/user/role');
        if (response.ok) {
          const data = await response.json();
          setHasAccess(data.hasAdminAccess === true);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error("Erreur vérification accès:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }
    checkAccess();
  }, []);

  useEffect(() => {
    if (hasAccess && selectedMonth) {
      loadAllData();
    }
  }, [hasAccess, selectedMonth]);

  async function loadAllData() {
    if (!selectedMonth) return;
    
    setLoadingData(true);
    try {
      const previousMonth = getPreviousMonthKey(selectedMonth);

      // Charger toutes les données en parallèle
      const [
        membersResponse,
        raidsPointsResponse,
        raidsDataResponse,
        discordPointsResponse,
        eventsResponse,
        followResponse,
        bonusesResponse,
        prevRaidsPointsResponse,
        prevDiscordPointsResponse,
        prevEventsResponse,
        prevFollowResponse,
        prevBonusesResponse,
        currentFinalNotesResponse,
        previousFinalNotesResponse,
        overridesResponse,
      ] = await Promise.all([
        fetch("/api/admin/members", { cache: 'no-store' }),
        fetch(`/api/evaluations/raids/points?month=${selectedMonth}`, { cache: 'no-store' }),
        fetch(`/api/discord/raids/data-v2?month=${selectedMonth}`, { cache: 'no-store' }),
        fetch(`/api/evaluations/discord/points?month=${selectedMonth}`, { cache: 'no-store' }),
        fetch(`/api/admin/events/presence?month=${selectedMonth}`, { cache: 'no-store' }).catch(() => ({ ok: false, json: () => ({ events: [] }) })),
        fetch(`/api/evaluations/follow/points?month=${selectedMonth}`, { cache: 'no-store' }).catch(() => ({ ok: false, json: () => ({ points: {} }) })),
        fetch(`/api/evaluations/bonus?month=${selectedMonth}`, { cache: 'no-store' }),
        fetch(`/api/evaluations/raids/points?month=${previousMonth}`, { cache: 'no-store' }).catch(() => ({ ok: false, json: () => ({ points: {} }) })),
        fetch(`/api/evaluations/discord/points?month=${previousMonth}`, { cache: 'no-store' }).catch(() => ({ ok: false, json: () => ({ points: {} }) })),
        fetch(`/api/admin/events/presence?month=${previousMonth}`, { cache: 'no-store' }).catch(() => ({ ok: false, json: () => ({ events: [] }) })),
        fetch(`/api/evaluations/follow/points?month=${previousMonth}`, { cache: 'no-store' }).catch(() => ({ ok: false, json: () => ({ points: {} }) })),
        fetch(`/api/evaluations/bonus?month=${previousMonth}`, { cache: 'no-store' }).catch(() => ({ ok: false, json: () => ({ bonuses: {} }) })),
        fetch(`/api/evaluations/synthesis/save?month=${selectedMonth}`, { cache: "no-store" }).catch(() => ({ ok: false, json: () => ({ finalNotes: {} }) })),
        fetch(`/api/evaluations/synthesis/save?month=${previousMonth}`, { cache: "no-store" }).catch(() => ({ ok: false, json: () => ({ finalNotes: {} }) })),
        fetch(`/api/evaluations/synthesis/overrides?month=${selectedMonth}&limit=200`, { cache: "no-store" }).catch(() => ({ ok: false, json: () => ({ logs: [] }) })),
      ]);

      // Parser les réponses
      const membersData: any[] = membersResponse.ok ? (await membersResponse.json()).members || [] : [];
      const raidsPointsData = raidsPointsResponse.ok ? (await raidsPointsResponse.json()).points || {} : {};
      const raidsData = raidsDataResponse.ok ? await raidsDataResponse.json() : { raidsFaits: [], raidsRecus: [] };
      const discordPointsData = discordPointsResponse.ok ? (await discordPointsResponse.json()).points || {} : {};
      const eventsData = eventsResponse.ok ? await eventsResponse.json() : { events: [] };
      const followPointsData = followResponse.ok ? (await followResponse.json()).points || {} : {};
      const bonusesData = bonusesResponse.ok ? (await bonusesResponse.json()).bonuses || {} : {};
      const prevRaidsPointsData = prevRaidsPointsResponse.ok ? (await prevRaidsPointsResponse.json()).points || {} : {};
      const prevDiscordPointsData = prevDiscordPointsResponse.ok ? (await prevDiscordPointsResponse.json()).points || {} : {};
      const prevEventsData = prevEventsResponse.ok ? await prevEventsResponse.json() : { events: [] };
      const prevFollowPointsData = prevFollowResponse.ok ? (await prevFollowResponse.json()).points || {} : {};
      const prevBonusesData = prevBonusesResponse.ok ? (await prevBonusesResponse.json()).bonuses || {} : {};
      const currentFinalNotesData = currentFinalNotesResponse.ok ? await currentFinalNotesResponse.json() : { finalNotes: {} };
      const previousFinalNotesData = previousFinalNotesResponse.ok ? await previousFinalNotesResponse.json() : { finalNotes: {} };
      const overridesData = overridesResponse.ok ? await overridesResponse.json() : { logs: [] };

      setCurrentMonthFinalNotes(currentFinalNotesData.finalNotes || {});
      setPreviousMonthFinalNotes(previousFinalNotesData.finalNotes || {});
      setOverrideLogs(overridesData.logs || []);

      // Construire les données d'évaluation pour tous les membres (actifs ET inactifs/Communauté)
      const evaluationData: MemberEvaluationData[] = [];
      
      // Inclure TOUS les membres (actifs et inactifs/Communauté)
      const allMembers = membersData.filter((m: any) => m.twitchLogin);

      // Calculer les scores du mois précédent (M-1) pour le Delta.
      const previousScoresMap: Record<string, number> = {};
      const prevSpotlightEvents = (prevEventsData.events || []).filter((e: any) => (e.category || "") === "Spotlight");
      const prevSpotlightTotalCount = prevSpotlightEvents.length;
      const prevSpotlightPresencesMap = new Map<string, number>();
      if (prevSpotlightEvents.length > 0) {
        for (const event of prevSpotlightEvents) {
          for (const presence of event.presences || []) {
            const login = presence.twitchLogin?.toLowerCase();
            if (login && presence.present) {
              prevSpotlightPresencesMap.set(login, (prevSpotlightPresencesMap.get(login) || 0) + 1);
            }
          }
        }
      }
      const prevNonSpotlightEvents = (prevEventsData.events || []).filter((e: any) => (e.category || "") !== "Spotlight");
      const prevEventsTotal = prevNonSpotlightEvents.length;
      const prevEventsPresenceMap = new Map<string, number>();
      if (prevNonSpotlightEvents.length > 0) {
        for (const event of prevNonSpotlightEvents) {
          for (const presence of event.presences || []) {
            const login = presence.twitchLogin?.toLowerCase();
            if (login && presence.present) {
              prevEventsPresenceMap.set(login, (prevEventsPresenceMap.get(login) || 0) + 1);
            }
          }
        }
      }
      for (const member of allMembers) {
        const login = (member.twitchLogin || "").toLowerCase();
        if (!login) continue;
        const prevSpotlightPresences = prevSpotlightPresencesMap.get(login) || 0;
        const prevSpotlightPoints = prevSpotlightTotalCount > 0
          ? Math.round((5 * prevSpotlightPresences / prevSpotlightTotalCount) * 100) / 100
          : 0;
        const prevRaidsPoints = typeof prevRaidsPointsData[login] === "number" ? prevRaidsPointsData[login] : 0;
        const prevDiscordPoints = typeof prevDiscordPointsData[login] === "number" ? prevDiscordPointsData[login] : 0;
        const prevEventsPoints = (prevEventsPresenceMap.get(login) || 0) >= 1 ? 2 : 0;
        const prevFollowPoints = typeof prevFollowPointsData[login] === "number" ? prevFollowPointsData[login] : 0;
        const prevBonusInfo: MemberBonus | null = prevBonusesData[login] || null;
        const prevBonusTotal = calculateBonusTotal(prevBonusInfo);
        const { total: prevTotalHorsBonus } = calculateTotalHorsBonus(
          prevSpotlightPoints,
          prevRaidsPoints,
          prevDiscordPoints,
          prevEventsPoints,
          prevFollowPoints
        );
        const { total: prevCalculatedFinal } = calculateTotalAvecBonus(
          prevTotalHorsBonus,
          prevBonusTotal.timezoneBonus,
          prevBonusTotal.moderationBonus
        );
        const prevManualFinal = previousFinalNotesData?.finalNotes?.[login]?.finalNote;
        previousScoresMap[login] = prevManualFinal ?? prevCalculatedFinal;
      }
      setPreviousMonthCalculatedScores(previousScoresMap);
      
      // Créer des maps pour accès rapide
      const spotlightPointsMap = new Map<string, number>(); // Map des points Spotlight depuis l'API
      const raidsPointsMap = new Map<string, number>(); // Map des points Raids depuis l'API
      const raidsStatsMap = new Map<string, { done: number; received: number }>(); // Stats pour affichage
      const discordPointsMap = new Map<string, number>(); // Map des points Discord depuis l'API
      const eventsMap = new Map<string, { presences: number; total: number }>();
      const followPointsMap = new Map<string, number>(); // Map des points Follow depuis l'API (dernière évaluation connue)
      
      // Spotlight : événements catégorie "Spotlight" de /admin/events/presence
      // Note /5 = (présences validées sur ces events) / (nombre total de Spotlight du mois)
      // Ex. 2 Spotlight, la personne a assisté aux 2 → 2/2 = 5 pts
      const spotlightEvents = (eventsData.events || []).filter((e: any) => (e.category || "") === "Spotlight");
      const spotlightTotalCount = spotlightEvents.length;
      const spotlightPresencesMap = new Map<string, number>();
      if (spotlightEvents.length > 0) {
        for (const event of spotlightEvents) {
          for (const presence of event.presences || []) {
            const login = presence.twitchLogin?.toLowerCase();
            if (login && presence.present) {
              spotlightPresencesMap.set(login, (spotlightPresencesMap.get(login) || 0) + 1);
            }
          }
        }
        spotlightPresencesMap.forEach((count, login) => {
          const points = Math.round((5 * count / spotlightTotalCount) * 100) / 100;
          spotlightPointsMap.set(login, points);
        });
      }
      
      // Populate raids points map depuis l'API (points calculés depuis /admin/evaluation/a/raids)
      if (raidsPointsData && typeof raidsPointsData === 'object') {
        Object.entries(raidsPointsData).forEach(([login, points]) => {
          if (login && typeof points === 'number') {
            raidsPointsMap.set(login.toLowerCase(), points);
          }
        });
      }
      
      // Populate discord points map depuis l'API (note finale calculée depuis /admin/evaluation/b/discord)
      if (discordPointsData && typeof discordPointsData === 'object') {
        Object.entries(discordPointsData).forEach(([login, points]) => {
          if (login && typeof points === 'number') {
            discordPointsMap.set(login.toLowerCase(), points);
          }
        });
      }
      
      // Populate follow points map depuis l'API (points calculés depuis /admin/evaluation/c - dernière évaluation connue)
      if (followPointsData && typeof followPointsData === 'object') {
        Object.entries(followPointsData).forEach(([login, points]) => {
          if (login && typeof points === 'number') {
            followPointsMap.set(login.toLowerCase(), points);
          }
        });
      }
      
      // Populate raids stats map pour affichage (nombre de raids faits/reçus)
      if (raidsData.raidsFaits) {
        for (const raid of raidsData.raidsFaits) {
          const login = (raid.raiderTwitchLogin || raid.raiderLogin || raid.raider)?.toLowerCase();
          if (login) {
            const existing = raidsStatsMap.get(login) || { done: 0, received: 0 };
            existing.done = (existing.done || 0) + (raid.count || 1);
            raidsStatsMap.set(login, existing);
          }
        }
      }
      if (raidsData.raidsRecus) {
        for (const raid of raidsData.raidsRecus) {
          const login = (raid.targetTwitchLogin || raid.targetLogin || raid.target)?.toLowerCase();
          if (login) {
            const existing = raidsStatsMap.get(login) || { done: 0, received: 0 };
            existing.received = (existing.received || 0) + 1;
            raidsStatsMap.set(login, existing);
          }
        }
      }
      
      // Events serveur : hors Spotlight, présences validées uniquement (present === true)
      // 2 points si au moins une présence validée à un event du mois (hors Spotlight)
      const nonSpotlightEvents = (eventsData.events || []).filter((e: any) => (e.category || "") !== "Spotlight");
      const eventsTotal = nonSpotlightEvents.length;
      if (nonSpotlightEvents.length > 0) {
        for (const event of nonSpotlightEvents) {
          if (event.presences) {
            for (const presence of event.presences) {
              const login = presence.twitchLogin?.toLowerCase();
              if (login && presence.present) {
                const existing = eventsMap.get(login) || { presences: 0, total: eventsTotal };
                existing.presences = (existing.presences || 0) + 1;
                eventsMap.set(login, existing);
              }
            }
          }
        }
      }
      
      // Construire les données d'évaluation pour tous les membres
      for (const member of allMembers) {
        const login = member.twitchLogin?.toLowerCase();
        if (!login) continue;
        
        // Spotlight - Récupérer les points depuis l'API (calculés depuis /admin/evaluation/a/spotlights)
        const spotlightPoints = spotlightPointsMap.get(login) || 0;
        
        // Raids - Récupérer les points depuis l'API (calculés depuis /admin/evaluation/a/raids)
        const raidsPoints = raidsPointsMap.get(login) || 0;
        const raidsInfo = raidsStatsMap.get(login) || { done: 0, received: 0 };
        
        // Discord - Récupérer les points depuis l'API (note finale calculée depuis /admin/evaluation/b/discord)
        const discordPoints = discordPointsMap.get(login) || 0;
        
        // Events serveur : 2 pts si au moins une présence validée (hors Spotlight), sinon 0
        const eventsInfo = eventsMap.get(login) || { presences: 0, total: eventsTotal };
        const eventsPoints = eventsInfo.presences >= 1 ? 2 : 0;
        
        // Follow - Récupérer les points depuis l'API (dernière évaluation connue depuis /admin/evaluation/c)
        const followPoints = followPointsMap.get(login) || 0;
        
        // Bonus
        const bonusInfo: MemberBonus | null = bonusesData[login] || null;
        const bonusTotal = calculateBonusTotal(bonusInfo);
        
        // Calculs
        const { total: totalHorsBonus } = calculateTotalHorsBonus(spotlightPoints, raidsPoints, discordPoints, eventsPoints, followPoints);
        const { total: calculatedFinalScore } = calculateTotalAvecBonus(totalHorsBonus, bonusTotal.timezoneBonus, bonusTotal.moderationBonus);
        const manualFinalScore = currentFinalNotesData?.finalNotes?.[login]?.finalNote;
        const finalScore = manualFinalScore ?? calculatedFinalScore;
        const autoStatus = getAutoStatus(finalScore);
        
        evaluationData.push({
          twitchLogin: member.twitchLogin,
          displayName: member.displayName || member.twitchLogin,
          role: member.role || 'Affilié',
          avatar: member.avatar,
          createdAt: member.createdAt,
          isActive: member.isActive !== false,
          isVip: member.isVip || false,
          spotlightPoints,
          raidsPoints,
          discordPoints,
          eventsPoints,
          followPoints,
          timezoneBonusEnabled: bonusInfo?.timezoneBonusEnabled || false,
          moderationBonus: bonusInfo?.moderationBonus || 0,
          totalHorsBonus,
          bonusTotal: bonusTotal.total,
          finalScore,
          autoStatus,
          spotlightPresences: spotlightPresencesMap.get(login) || 0,
          spotlightTotal: spotlightTotalCount,
          raidsDone: raidsInfo.done,
          raidsReceived: raidsInfo.received,
          discordNbMessages: 0, // Non utilisé, les points viennent de l'API
          discordNbVocalMinutes: 0, // Non utilisé, les points viennent de l'API
          eventsPresences: eventsInfo.presences,
          eventsTotal: eventsInfo.total,
          followScore: followPoints,
        });
      }
      
      // Trier par ordre alphabétique
      evaluationData.sort((a, b) => a.displayName.localeCompare(b.displayName));
      
      setMembersData(evaluationData);
      
      // Calculer les statistiques générales
      calculateGeneralStats(evaluationData, eventsTotal || 0, spotlightTotalCount);
      
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoadingData(false);
    }
  }

  function calculateGeneralStats(data: MemberEvaluationData[], eventsTotal: number, spotlightTotal: number) {
    if (data.length === 0) {
      setGeneralStats({
        avgSpotlight: 0,
        avgRaids: 0,
        avgDiscord: 0,
        avgEvents: 0,
        avgFollow: 0,
        avgGeneral: 0,
        scoreGlobalHorsBonus: 0,
        scoreGlobalAvecBonus: 0,
        eventsPresenceRate: 0,
        eventsParticipants: 0,
        spotlightPresenceRate: 0,
        spotlightParticipants: 0,
        vipCount: 0,
        surveillerCount: 0,
      });
      return;
    }
    
    const avgSpotlight = data.reduce((sum, m) => sum + m.spotlightPoints, 0) / data.length;
    const avgRaids = data.reduce((sum, m) => sum + m.raidsPoints, 0) / data.length;
    const avgDiscord = data.reduce((sum, m) => sum + m.discordPoints, 0) / data.length;
    const avgEvents = data.reduce((sum, m) => sum + m.eventsPoints, 0) / data.length;
    const avgFollow = data.reduce((sum, m) => sum + m.followPoints, 0) / data.length;
    const avgGeneral = data.reduce((sum, m) => sum + m.totalHorsBonus, 0) / data.length;
    
    const scoreGlobalHorsBonus = data.reduce((sum, m) => sum + m.totalHorsBonus, 0);
    const scoreGlobalAvecBonus = data.reduce((sum, m) => sum + m.finalScore, 0);
    
    // Présences Events
    const eventsParticipants = new Set(data.filter(m => (m.eventsPresences || 0) > 0).map(m => m.twitchLogin)).size;
    const eventsPresenceRate = data.length > 0 ? (eventsParticipants / data.length) * 100 : 0;
    
    // Présences Spotlight
    const spotlightParticipants = new Set(data.filter(m => (m.spotlightPresences || 0) > 0).map(m => m.twitchLogin)).size;
    const spotlightPresenceRate = data.length > 0 ? (spotlightParticipants / data.length) * 100 : 0;
    
    // VIP / À surveiller
    const vipCount = data.filter(m => m.finalScore >= 16).length;
    const surveillerCount = data.filter(m => m.finalScore < 5).length;
    
    setGeneralStats({
      avgSpotlight: Math.round(avgSpotlight * 100) / 100,
      avgRaids: Math.round(avgRaids * 100) / 100,
      avgDiscord: Math.round(avgDiscord * 100) / 100,
      avgEvents: Math.round(avgEvents * 100) / 100,
      avgFollow: Math.round(avgFollow * 100) / 100,
      avgGeneral: Math.round(avgGeneral * 100) / 100,
      scoreGlobalHorsBonus: Math.round(scoreGlobalHorsBonus * 100) / 100,
      scoreGlobalAvecBonus: Math.round(scoreGlobalAvecBonus * 100) / 100,
      eventsPresenceRate: Math.round(eventsPresenceRate * 100) / 100,
      eventsParticipants,
      spotlightPresenceRate: Math.round(spotlightPresenceRate * 100) / 100,
      spotlightParticipants,
      vipCount,
      surveillerCount,
    });
  }

  async function saveAll() {
    setSaving(true);
    try {
      // Sauvegarder les bonus
      if (Object.keys(editingBonuses).length > 0) {
        const bonusUpdates = Object.entries(editingBonuses).map(([login, bonus]) => ({
          month: selectedMonth,
          twitchLogin: login,
          timezoneBonusEnabled: bonus.timezone,
          moderationBonus: bonus.moderation,
        }));
        
        for (const update of bonusUpdates) {
          const response = await fetch('/api/evaluations/bonus', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update),
          });
          
          if (!response.ok) {
            throw new Error(`Erreur lors de la sauvegarde du bonus pour ${update.twitchLogin}`);
          }
        }
      }
      
      // Sauvegarder les notes finales et statuts
      {
        const updates = [];
        
        // Récupérer tous les logins uniques
        const allLogins = new Set([
          ...Object.keys(editingFinalNotes),
          ...Object.keys(editingStatuses),
          ...Object.keys(editingRoles),
          ...Object.keys(editingVips),
        ]);
        
        for (const login of allLogins) {
          const normalizedLogin = login.toLowerCase(); // Normaliser en lowercase pour correspondre à l'API
          updates.push({
            twitchLogin: normalizedLogin,
            finalNote: editingFinalNotes[login] !== undefined ? editingFinalNotes[login] : undefined,
            finalNoteReason: editingFinalNoteReasons[login] || editingFinalNoteReasons[normalizedLogin] || "Override manuel depuis /admin/evaluation/synthese",
            isActive: editingStatuses[login] !== undefined ? editingStatuses[login] : undefined,
            role: editingRoles[login] !== undefined ? editingRoles[login] : undefined,
            isVip: editingVips[normalizedLogin] !== undefined ? editingVips[normalizedLogin] : undefined,
          });
        }
        
        const snapshots = membersData.map((member) => {
          const login = member.twitchLogin.toLowerCase();
          const bonusInEdit = editingBonuses[member.twitchLogin];
          const timezoneBonus = bonusInEdit?.timezone ?? member.timezoneBonusEnabled;
          const moderationBonus = bonusInEdit?.moderation ?? member.moderationBonus;
          const sectionDBonuses = (timezoneBonus ? TIMEZONE_BONUS_POINTS : 0) + moderationBonus;
          const sectionAPoints = Math.round(member.spotlightPoints + member.raidsPoints);
          const sectionBPoints = Math.round(member.discordPoints + member.eventsPoints);
          const sectionCPoints = Math.round(member.followPoints);
          const { total: totalPoints } = calculateTotalAvecBonus(
            member.totalHorsBonus,
            timezoneBonus ? TIMEZONE_BONUS_POINTS : 0,
            moderationBonus
          );
          return {
            twitchLogin: login,
            sectionAPoints,
            sectionBPoints,
            sectionCPoints,
            sectionDBonuses: Math.round(sectionDBonuses),
            totalPoints: Math.round(totalPoints),
          };
        });

        const snapshotChunks: typeof snapshots[] = [];
        for (let i = 0; i < snapshots.length; i += SYNTHESIS_SNAPSHOT_CHUNK_SIZE) {
          snapshotChunks.push(snapshots.slice(i, i + SYNTHESIS_SNAPSHOT_CHUNK_SIZE));
        }
        const chunksToSend = snapshotChunks.length > 0 ? snapshotChunks : [[] as typeof snapshots];

        const synthesisWarnings: string[] = [];
        for (let i = 0; i < chunksToSend.length; i++) {
          const response = await fetch('/api/evaluations/synthesis/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              month: selectedMonth,
              updates: i === 0 ? updates : [],
              snapshots: chunksToSend[i],
            }),
          });
          const bodyText = await response.text();
          let parsed: Record<string, unknown> = {};
          try {
            parsed = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {};
          } catch {
            throw new Error(
              synthesisSaveErrorMessage(response.status, bodyText, {})
            );
          }
          if (!response.ok) {
            throw new Error(synthesisSaveErrorMessage(response.status, bodyText, parsed));
          }
          const batchErrors = (parsed.results as { errors?: string[] } | undefined)?.errors;
          if (Array.isArray(batchErrors) && batchErrors.length > 0) {
            synthesisWarnings.push(...batchErrors);
          }
        }
        if (synthesisWarnings.length > 0) {
          console.warn('[synthèse] Avertissements sauvegarde:', synthesisWarnings);
        }
      }
      
      // Recharger les données
      await loadAllData();
      setEditingBonuses({});
      setEditingFinalNotes({});
      setEditingFinalNoteReasons({});
      setEditingStatuses({});
      setEditingRoles({});
      setEditingVips({});
      alert('✅ Toutes les modifications ont été enregistrées avec succès');
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert(`❌ Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  }
  
  // Fonction de compatibilité pour le bouton bonus (dépréciée)
  async function saveBonuses() {
    await saveAll();
  }

  function handleTimezoneToggle(login: string, enabled: boolean) {
    setEditingBonuses(prev => ({
      ...prev,
      [login]: {
        ...prev[login],
        timezone: enabled,
        moderation: prev[login]?.moderation ?? 0,
      },
    }));
  }

  function handleModerationChange(login: string, value: number) {
    setEditingBonuses(prev => ({
      ...prev,
      [login]: {
        ...prev[login],
        timezone: prev[login]?.timezone ?? false,
        moderation: Math.max(0, Math.min(5, value)),
      },
    }));
  }
  
  function handleFinalNoteChange(login: string, value: string) {
    const numValue = value === '' ? null : parseFloat(value);
    const normalizedLogin = login.toLowerCase(); // Normaliser en lowercase pour correspondre à l'API
    setEditingFinalNotes(prev => {
      if (numValue === null) {
        const { [normalizedLogin]: removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [normalizedLogin]: numValue,
      };
    });
  }

  function handleFinalNoteReasonChange(login: string, reason: string) {
    const normalizedLogin = login.toLowerCase();
    setEditingFinalNoteReasons((prev) => ({
      ...prev,
      [normalizedLogin]: reason,
    }));
  }
  
  function handleStatusChange(login: string, isActive: boolean) {
    setEditingStatuses(prev => ({
      ...prev,
      [login]: isActive,
    }));
  }
  
  function handleForceRole(login: string, role: 'Communauté' | 'VIP') {
    if (role === 'Communauté') {
      // Forcer Communauté = isActive = false, role = 'Communauté'
      setEditingStatuses(prev => ({
        ...prev,
        [login]: false,
      }));
      setEditingRoles(prev => ({
        ...prev,
        [login]: 'Communauté',
      }));
    } else if (role === 'VIP') {
      // Forcer VIP = isVip = true
      const normalizedLogin = login.toLowerCase();
      setEditingVips(prev => ({
        ...prev,
        [normalizedLogin]: true,
      }));
    }
  }
  
  function handleVipToggle(login: string, isVip: boolean) {
    const normalizedLogin = login.toLowerCase();
    setEditingVips(prev => ({
      ...prev,
      [normalizedLogin]: isVip,
    }));
  }
  
  // Fonction pour sauvegarder uniquement les modifications manuelles (notes finales)
  async function saveManualNotes() {
    setSaving(true);
    try {
      if (Object.keys(editingFinalNotes).length === 0) {
        alert('Aucune note finale manuelle à sauvegarder');
        return;
      }
      
      const updates = Object.keys(editingFinalNotes).map(login => ({
        twitchLogin: login.toLowerCase(), // Normaliser en lowercase pour correspondre à l'API
        finalNote: editingFinalNotes[login],
        finalNoteReason: editingFinalNoteReasons[login] || "Override manuel depuis /admin/evaluation/synthese",
      }));
      
      const response = await fetch('/api/evaluations/synthesis/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          updates,
        }),
      });
      const bodyText = await response.text();
      let parsed: Record<string, unknown> = {};
      try {
        parsed = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {};
      } catch {
        throw new Error(synthesisSaveErrorMessage(response.status, bodyText, {}));
      }
      if (!response.ok) {
        throw new Error(synthesisSaveErrorMessage(response.status, bodyText, parsed));
      }
      
      // Recharger les données
      await loadAllData();
      setEditingFinalNotes({});
      setEditingFinalNoteReasons({});
      alert('✅ Notes finales manuelles enregistrées avec succès');
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des notes finales manuelles:", error);
      alert(`❌ Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  }
  
  // Fonction pour calculer le nombre total de modifications en attente
  function getTotalPendingChanges(): number {
    return Object.keys(editingBonuses).length + 
           Object.keys(editingFinalNotes).length + 
           Object.keys(editingStatuses).length +
           Object.keys(editingRoles).length +
           Object.keys(editingVips).length;
  }

  function getPendingChangesBreakdown() {
    return {
      bonuses: Object.keys(editingBonuses).length,
      notes: Object.keys(editingFinalNotes).length,
      statuts: Object.keys(editingStatuses).length,
      roles: Object.keys(editingRoles).length,
      vip: Object.keys(editingVips).length,
    };
  }

  function getDataReliabilityBadge(member: MemberEvaluationData): { label: string; color: string; bg: string } {
    const missingSources = [
      member.spotlightTotal === 0,
      member.eventsTotal === 0,
      member.followScore === 0 && member.followPoints === 0,
    ].filter(Boolean).length;

    if (missingSources >= 2) {
      return { label: "Partielle", color: "#f59e0b", bg: "#f59e0b20" };
    }
    if (missingSources === 1) {
      return { label: "A surveiller", color: "#06b6d4", bg: "#06b6d420" };
    }
    return { label: "Complete", color: "#10b981", bg: "#10b98120" };
  }

  function getEntraideScore(member: MemberEvaluationData): { value: number; max: number } {
    const eventsNormalized = (member.eventsPoints / 2) * 2;
    const value = member.raidsPoints + member.discordPoints + eventsNormalized + member.followPoints;
    return { value, max: 17 };
  }

  function getTrendDelta(member: MemberEvaluationData): number | null {
    const login = member.twitchLogin.toLowerCase();
    const previous = previousMonthFinalNotes[login]?.finalNote ?? previousMonthCalculatedScores[login];
    if (previous === undefined || previous === null) return null;
    const inEdit = editingFinalNotes[login];
    const current = inEdit ?? currentMonthFinalNotes[login]?.finalNote ?? member.finalScore;
    if (current === undefined || current === null) return null;
    return Math.round((current - previous) * 100) / 100;
  }

  function exportFilteredCsv() {
    const headers = [
      "Membre",
      "Twitch",
      "Role",
      "Actif",
      "Spotlight",
      "Raids",
      "Discord",
      "Events",
      "Follow",
      "Total_hors_bonus",
      "Bonus_total",
      "Note_finale",
      "Delta_M_1",
      "Fiabilite",
    ];
    const rows = filteredMembers.map((member) => {
      const normalizedLogin = member.twitchLogin.toLowerCase();
      const bonusInEdit = editingBonuses[member.twitchLogin];
      const timezoneBonus = bonusInEdit?.timezone ?? member.timezoneBonusEnabled;
      const moderationBonus = bonusInEdit?.moderation ?? member.moderationBonus;
      const bonusTotal = (timezoneBonus ? TIMEZONE_BONUS_POINTS : 0) + moderationBonus;
      const finalInEdit = editingFinalNotes[normalizedLogin];
      const finalScore = finalInEdit ?? currentMonthFinalNotes[normalizedLogin]?.finalNote ?? member.finalScore;
      const delta = getTrendDelta(member);
      const reliability = getDataReliabilityBadge(member).label;
      return [
        member.displayName,
        member.twitchLogin,
        member.role,
        member.isActive ? "oui" : "non",
        member.spotlightPoints.toFixed(2),
        member.raidsPoints.toFixed(2),
        member.discordPoints.toFixed(2),
        member.eventsPoints.toFixed(2),
        member.followPoints.toFixed(2),
        member.totalHorsBonus.toFixed(2),
        bonusTotal.toFixed(2),
        (finalScore ?? 0).toFixed(2),
        delta !== null ? delta.toFixed(2) : "",
        reliability,
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluation-synthese-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function getMonthOptions(): string[] {
    const options: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      options.push(`${year}-${month}`);
    }
    return options;
  }

  function formatMonthKey(key: string): string {
    const [year, month] = key.split('-');
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  // Filtrage et tri
  const filteredMembers = useMemo(() => {
    let filtered = membersData;
    
    // Optionnel: filtrer uniquement les profils actifs
    if (showActiveOnly) {
      filtered = filtered.filter(m => m.isActive);
    }
    
    // Recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.displayName.toLowerCase().includes(query) ||
        m.twitchLogin.toLowerCase().includes(query) ||
        m.role.toLowerCase().includes(query)
      );
    }

    if (selectedPreset !== "all") {
      filtered = filtered.filter((m) => {
        const normalizedLogin = m.twitchLogin.toLowerCase();
        const bonusInEdit = editingBonuses[m.twitchLogin];
        const timezoneBonus = bonusInEdit?.timezone ?? m.timezoneBonusEnabled;
        const moderationBonus = bonusInEdit?.moderation ?? m.moderationBonus;
        const bonusTotal = (timezoneBonus ? TIMEZONE_BONUS_POINTS : 0) + moderationBonus;
        const finalInEdit = editingFinalNotes[normalizedLogin];
        const displayedFinal = finalInEdit ?? (currentMonthFinalNotes[normalizedLogin]?.finalNote ?? m.finalScore);
        const status = getAutoStatus(displayedFinal ?? 0);

        if (selectedPreset === "surveiller") return status === "surveiller";
        if (selectedPreset === "vip") return status === "vip";
        if (selectedPreset === "manual") return finalInEdit !== undefined;
        if (selectedPreset === "bonus") return bonusTotal > 0;
        return true;
      });
    }
    
    return filtered;
  }, [membersData, showActiveOnly, searchQuery, selectedPreset, editingBonuses, editingFinalNotes, currentMonthFinalNotes]);

  const pendingChanges = getPendingChangesBreakdown();
  const entraideGlobal = useMemo(() => {
    if (membersData.length === 0) return { avg: 0, max: 17 };
    const total = membersData.reduce((sum, member) => sum + getEntraideScore(member).value, 0);
    return {
      avg: Math.round((total / membersData.length) * 100) / 100,
      max: 17,
    };
  }, [membersData]);

  const pilotageBarData = useMemo(() => {
    if (!generalStats) return [];
    return [
      { key: "spotlight", label: "Spotlight", moy: generalStats.avgSpotlight, max: 5, fill: "#c084fc" },
      { key: "raids", label: "Raids", moy: generalStats.avgRaids, max: 5, fill: "#818cf8" },
      { key: "discord", label: "Discord", moy: generalStats.avgDiscord, max: 5, fill: "#5865F2" },
      { key: "events", label: "Events", moy: generalStats.avgEvents, max: 2, fill: "#34d399" },
      { key: "follow", label: "Follow", moy: generalStats.avgFollow, max: 5, fill: "#f472b6" },
    ];
  }, [generalStats]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <div className="rounded-lg border p-8" style={{ backgroundColor: 'var(--color-card)', borderColor: '#dc2626' }}>
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#dc2626' }}>Accès refusé</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Vous n'avez pas les permissions nécessaires.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
      <div className="mx-auto max-w-[1680px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <header className="relative mb-8 overflow-hidden rounded-2xl border-2 border-[#9146ff]/35 bg-gradient-to-br from-[var(--color-card)] via-[var(--color-card)] to-purple-950/20 p-6 shadow-xl shadow-purple-900/10 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#9146ff]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/admin/evaluation"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-black/10 px-3 py-1.5 text-sm font-medium backdrop-blur-sm transition hover:border-[#9146ff]/50 hover:bg-[#9146ff]/10"
                  style={{ color: "var(--color-text)" }}
                >
                  <ArrowLeft className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  Dashboard évaluation
                </Link>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-200">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Staff &amp; pilotage TENF
                </span>
              </div>
              <div>
                <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-black leading-tight tracking-tight">
                  <span className="bg-gradient-to-r from-white via-white to-[#c4b5fd] bg-clip-text text-transparent">
                    Synthèse &amp; bonus
                  </span>
                </h1>
                <p className="mt-2 max-w-3xl text-base leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  Vue consolidée du barème mensuel pour la communauté TENF : les mêmes chiffres servent à{" "}
                  <strong style={{ color: "var(--color-text)" }}>reconnaître l&apos;engagement</strong> des membres
                  (Spotlight, Raids, Discord, Événements, Follow) et à ajuster décalage horaire &amp; modération. Les
                  notes manuelles restent traçables dans l&apos;historique.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/15 px-2.5 py-1">
                  <Layers className="h-3.5 w-3.5 text-violet-300" aria-hidden />
                  Barème /32 (25 + 7 bonus)
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/15 px-2.5 py-1">
                  <Users className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
                  {membersData.length} membres chargés
                </span>
                {loadingData ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/15 px-2.5 py-1 text-amber-200/90">
                    <Zap className="h-3.5 w-3.5 animate-pulse" aria-hidden />
                    Synchronisation des sources…
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
              <Link
                href="/admin/migration/evaluations"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9146ff] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:bg-[#7c3aed]"
              >
                <Database className="h-4 w-4" aria-hidden />
                Migration des évaluations
              </Link>
              <Link
                href="/admin/evaluation/a"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-3 text-sm font-semibold transition hover:border-[#9146ff]/40"
                style={{ color: "var(--color-text)" }}
              >
                Sections A · B · C
              </Link>
            </div>
          </div>
        </header>

        {/* Barre d&apos;outils */}
        <div
          className="mb-8 rounded-2xl border p-4 shadow-sm sm:p-5"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#9146ff]" aria-hidden />
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
              Filtres &amp; export
            </h2>
          </div>
          <div className="flex flex-col gap-4 xl:flex-row xl:flex-wrap xl:items-end">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                Mois
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border px-4 py-2.5 text-sm font-medium outline-none ring-[#9146ff]/0 transition focus:ring-2 focus:ring-[#9146ff]/40"
                style={{
                  backgroundColor: "var(--color-bg)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
              >
                {getMonthOptions().map((option) => (
                  <option key={option} value={option}>
                    {formatMonthKey(option)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                Vue
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value as "all" | "surveiller" | "vip" | "manual" | "bonus")}
                className="rounded-xl border px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#9146ff]/40"
                style={{
                  backgroundColor: "var(--color-bg)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
              >
                <option value="all">Tous les profils</option>
                <option value="surveiller">À surveiller</option>
                <option value="vip">VIP</option>
                <option value="manual">Overrides manuels</option>
                <option value="bonus">Avec bonus</option>
              </select>
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition hover:bg-white/[0.03]" style={{ borderColor: "var(--color-border)" }}>
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded border-[var(--color-border)] text-[#9146ff] focus:ring-[#9146ff]/40"
              />
              Actifs seulement
            </label>

            <div className="relative min-w-[200px] flex-1 xl:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-45" aria-hidden />
              <input
                type="search"
                placeholder="Pseudo, nom ou rôle…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#9146ff]/35"
                style={{
                  backgroundColor: "var(--color-bg)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
              />
            </div>

            <div className="flex flex-wrap gap-2 xl:ml-auto">
              <button
                type="button"
                onClick={() => setCompactMode((prev) => !prev)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${compactMode ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-100" : ""}`}
                style={
                  compactMode
                    ? undefined
                    : {
                        backgroundColor: "var(--color-bg)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text)",
                      }
                }
              >
                Compact {compactMode ? "· on" : ""}
              </button>
              <button
                type="button"
                onClick={() => setShowAdvancedColumns((prev) => !prev)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${showAdvancedColumns ? "border-violet-500/50 bg-violet-500/15 text-violet-100" : ""}`}
                style={
                  showAdvancedColumns
                    ? undefined
                    : {
                        backgroundColor: "var(--color-bg)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text)",
                      }
                }
              >
                Colonnes + {showAdvancedColumns ? "· on" : ""}
              </button>
              <button
                type="button"
                onClick={exportFilteredCsv}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-sky-500"
              >
                <Download className="h-4 w-4" aria-hidden />
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div
          className="mb-8 flex flex-wrap gap-2 rounded-2xl border p-1.5"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          role="tablist"
          aria-label="Sections synthèse"
        >
          {(
            [
              { id: "pilotage" as const, label: "Pilotage", icon: LayoutDashboard },
              { id: "tableau" as const, label: "Tableau d’édition", icon: Table2 },
              { id: "historique" as const, label: "Historique overrides", icon: History },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition sm:flex-none sm:min-w-[160px] ${
                  active
                    ? "bg-gradient-to-br from-[#9146ff] to-[#6d28d9] text-white shadow-lg shadow-purple-900/25"
                    : "text-[var(--color-text-secondary)] hover:bg-white/[0.04]"
                }`}
                style={active ? undefined : { color: "var(--color-text-secondary)" }}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                {tab.label}
              </button>
            );
          })}
        </div>

      {/* Statistiques générales */}
      {activeTab === "pilotage" && generalStats && (
        <div className="mb-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight" style={{ color: "var(--color-text)" }}>
                Statistiques — {formatMonthKey(selectedMonth)}
              </h2>
              <p className="mt-1 max-w-2xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Moyennes communautaires sur le mois sélectionné ; utile pour calibrer le staff et expliquer le barème aux
                membres.
              </p>
            </div>
          </div>

          {/* Moyennes par domaine */}
          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold" style={{ color: "var(--color-text)" }}>
              <BarChart3 className="h-5 w-5 text-[#9146ff]" aria-hidden />
              Moyennes par domaine (hors bonus)
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              <StatCard
                title="Spotlight (/5)"
                value={generalStats.avgSpotlight.toFixed(2)}
                color="#c084fc"
                icon={<Star className="h-4 w-4" aria-hidden />}
              />
              <StatCard
                title="Raids (/5)"
                value={generalStats.avgRaids.toFixed(2)}
                color="#818cf8"
                icon={<HeartHandshake className="h-4 w-4" aria-hidden />}
              />
              <StatCard
                title="Discord (/5)"
                value={generalStats.avgDiscord.toFixed(2)}
                color="#5865F2"
                icon={<Mic2 className="h-4 w-4" aria-hidden />}
              />
              <StatCard
                title="Events (/2)"
                value={generalStats.avgEvents.toFixed(2)}
                color="#34d399"
                icon={<CalendarDays className="h-4 w-4" aria-hidden />}
              />
              <StatCard
                title="Follow (/5)"
                value={generalStats.avgFollow.toFixed(2)}
                color="#f472b6"
                icon={<Users className="h-4 w-4" aria-hidden />}
              />
              <StatCard
                title="Générale (/25)"
                value={generalStats.avgGeneral.toFixed(2)}
                color="#9146ff"
                icon={<Award className="h-4 w-4" aria-hidden />}
              />
            </div>
          </div>

          {pilotageBarData.length > 0 && (
            <div
              className="mb-8 rounded-2xl border p-5 shadow-inner sm:p-6"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <h3 className="mb-4 text-base font-bold" style={{ color: "var(--color-text)" }}>
                Lecture graphique des moyennes (échelle par pilier)
              </h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pilotageBarData} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" horizontal={false} />
                    <XAxis type="number" domain={[0, 5]} stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={72}
                      stroke="#64748b"
                      tick={{ fill: "#cbd5e1", fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const row = payload[0].payload as (typeof pilotageBarData)[0];
                        const pct = row.max > 0 ? Math.round((row.moy / row.max) * 100) : 0;
                        return (
                          <div className="rounded-lg border border-white/10 bg-[#1e293b] px-3 py-2 text-xs shadow-xl">
                            <p className="font-semibold text-white">{row.label}</p>
                            <p className="text-gray-300">
                              Moyenne : <span className="tabular-nums font-bold text-white">{row.moy.toFixed(2)}</span> /{" "}
                              {row.max}
                            </p>
                            <p className="text-gray-500">~{pct}% du plafond pilier</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="moy" radius={[0, 8, 8, 0]} maxBarSize={28}>
                      {pilotageBarData.map((entry) => (
                        <Cell key={entry.key} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                L&apos;axe Events est plafonné à 2 pts sur le graphique ; les barres restent comparables visuellement aux
                autres piliers à l&apos;échelle du mois.
              </p>
            </div>
          )}
          
          {/* Score global */}
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-bold" style={{ color: "var(--color-text)" }}>
              Score global communauté
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <StatCard
                title="Somme hors bonus"
                value={`${generalStats.scoreGlobalHorsBonus.toFixed(2)} / ${membersData.length * 25}`}
                subtitle="Total des points sur tous les membres (plafond théorique)"
                color="#9146ff"
                icon={<Layers className="h-4 w-4" aria-hidden />}
              />
              <StatCard
                title="Somme avec bonus"
                value={`${generalStats.scoreGlobalAvecBonus.toFixed(2)} / ${membersData.length * 32}`}
                subtitle="Inclut décalage horaire &amp; modération"
                color="#10b981"
                icon={<Gift className="h-4 w-4" aria-hidden />}
              />
            </div>
          </div>

          {/* Présences */}
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-bold" style={{ color: "var(--color-text)" }}>
              Présences
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <StatCard
                title="Taux présence Events"
                value={`${generalStats.eventsPresenceRate.toFixed(1)}%`}
                subtitle={`${generalStats.eventsParticipants} membres ont au moins une présence`}
                color="#5865F2"
                icon={<CalendarDays className="h-4 w-4" aria-hidden />}
              />
              <StatCard
                title="Taux présence Spotlights"
                value={`${generalStats.spotlightPresenceRate.toFixed(1)}%`}
                subtitle={`${generalStats.spotlightParticipants} membres présents sur les spotlights`}
                color="#c084fc"
                icon={<Star className="h-4 w-4" aria-hidden />}
              />
            </div>
          </div>

          {/* VIP / Alertes */}
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-bold" style={{ color: "var(--color-text)" }}>
              Signaux automatiques
            </h3>
            <div className="flex flex-wrap gap-3">
              <div
                className="flex items-center gap-3 rounded-xl border px-5 py-4 shadow-sm"
                style={{ backgroundColor: "#10b98118", borderColor: "#10b98155", color: "#34d399" }}
              >
                <Star className="h-8 w-8 shrink-0 opacity-90" aria-hidden />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide opacity-80">VIP (note ≥ 16)</p>
                  <p className="text-2xl font-black tabular-nums">{generalStats.vipCount}</p>
                </div>
              </div>
              <div
                className="flex items-center gap-3 rounded-xl border px-5 py-4 shadow-sm"
                style={{ backgroundColor: "#f59e0b18", borderColor: "#f59e0b55", color: "#fbbf24" }}
              >
                <ShieldAlert className="h-8 w-8 shrink-0 opacity-90" aria-hidden />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide opacity-80">À surveiller (&lt; 5)</p>
                  <p className="text-2xl font-black tabular-nums">{generalStats.surveillerCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 text-lg font-bold" style={{ color: "var(--color-text)" }}>
              Entraide &amp; brouillon
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <StatCard
                title="Moyenne entraide pure"
                value={`${entraideGlobal.avg.toFixed(2)} / ${entraideGlobal.max}`}
                subtitle="Raids + Discord + Events + Follow"
                color="#22c55e"
                icon={<HeartHandshake className="h-4 w-4" aria-hidden />}
              />
              <StatCard
                title="Modifs non enregistrées"
                value={getTotalPendingChanges()}
                subtitle={`Notes ${pendingChanges.notes} · Bonus ${pendingChanges.bonuses} · Statuts ${pendingChanges.statuts} · Rôles ${pendingChanges.roles} · VIP ${pendingChanges.vip}`}
                color="#f59e0b"
                icon={<Zap className="h-4 w-4" aria-hidden />}
              />
            </div>
          </div>
        </div>
      )}

      {/* Encadré explicatif des critères de notation */}
      {activeTab === "pilotage" && (
        <div
          className="mb-10 rounded-2xl border p-6 sm:p-8"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div className="mb-6 flex flex-wrap items-start gap-3">
            <div className="rounded-xl bg-[#9146ff]/15 p-3 text-[#c4b5fd]">
              <HelpCircle className="h-7 w-7" aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight" style={{ color: "var(--color-text)" }}>
                Barème expliqué — pour le staff &amp; la communauté
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                Chaque pilier est calculé à partir des mêmes sources que les pages d&apos;évaluation A / B / C. Tu peux t&apos;en
                servir pour contextualiser une note auprès d&apos;un membre TENF de façon transparente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                title: "Spotlight — /5",
                icon: Star,
                accent: "#c084fc",
                body: "Présence aux spotlights du mois et qualité perçue dans les évaluations streamer ; agrégé depuis les événements catégorie Spotlight.",
              },
              {
                title: "Raids — /5",
                icon: HeartHandshake,
                accent: "#818cf8",
                body: "Équilibre raids donnés / reçus sur la période ; reflète l&apos;entraide réseau Twitch au sein de TENF.",
              },
              {
                title: "Discord — /5",
                icon: Mic2,
                accent: "#5865F2",
                body: "Synthèse activité serveur (écrit + vocal) issue des imports et règles définies dans la section B Discord.",
              },
              {
                title: "Événements — /2",
                icon: CalendarDays,
                accent: "#34d399",
                body: "Présence validée à au moins un événement TENF hors spotlight sur le mois (oui/non → 2 pts ou 0).",
              },
              {
                title: "Follow — /5",
                icon: Users,
                accent: "#f472b6",
                body: "Suivi des autres membres sur Twitch selon les validations follow ; mis à jour lors des passages en revue.",
              },
              {
                title: "Bonus — /7",
                icon: Gift,
                accent: "#f59e0b",
                body: "+2 décalage horaire lorsque activé, +0 à +5 modération selon la grille staff.",
              },
            ].map((card) => {
              const IconCard = card.icon;
              return (
              <div
                key={card.title}
                className="group rounded-xl border p-4 transition hover:border-[var(--color-primary)]/35 hover:shadow-md"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="rounded-lg p-2 transition group-hover:scale-105"
                    style={{ backgroundColor: `${card.accent}22`, color: card.accent }}
                  >
                    <IconCard className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="font-bold" style={{ color: "var(--color-text)" }}>
                    {card.title}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {card.body}
                </p>
              </div>
            );
            })}
          </div>

          <details className="group mt-6 rounded-xl border border-dashed" style={{ borderColor: "var(--color-border)" }}>
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden" style={{ color: "var(--color-text)" }}>
              <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" aria-hidden />
              Règle de la note finale (/32) et statuts auto
            </summary>
            <div className="border-t px-4 py-3 text-xs leading-relaxed" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
              <p>
                <strong style={{ color: "var(--color-text)" }}>Note finale</strong> = total hors bonus (/25) + bonus (/7),
                plafonné à /32. Une note <strong>≥ 16</strong> correspond au signal « VIP » dans cette vue ; une note{" "}
                <strong>&lt; 5</strong> déclenche « À surveiller » pour relais humain côté staff.
              </p>
              <p className="mt-2">
                Les overrides manuels et leur motif restent visibles dans l&apos;onglet <strong>Historique</strong> pour la
                conformité et la confiance des membres.
              </p>
            </div>
          </details>
        </div>
      )}

      {/* Tableau récapitulatif */}
      {activeTab === "tableau" && (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
            Tableau récapitulatif ({filteredMembers.length} membres)
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={saveManualNotes}
              disabled={saving || Object.keys(editingFinalNotes).length === 0}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: saving || Object.keys(editingFinalNotes).length === 0 ? 'var(--color-surface)' : '#9146ff',
                color: 'white',
              }}
              title="Sauvegarder uniquement les notes finales manuelles"
            >
              {saving ? 'Enregistrement...' : `Sauvegarder notes manuelles (${Object.keys(editingFinalNotes).length})`}
            </button>
            <button
              onClick={saveAll}
              disabled={saving || getTotalPendingChanges() === 0}
              className="px-6 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: saving || getTotalPendingChanges() === 0 ? 'var(--color-surface)' : '#10b981',
                color: 'white',
              }}
            >
              {saving ? 'Enregistrement...' : `Enregistrer toutes les modifications (${getTotalPendingChanges()})`}
            </button>
          </div>
        </div>
        <div className="mb-4 rounded-lg border p-3 text-xs" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
          Legende: vert = VIP potentiel, orange = a surveiller, rouge = regression. Le badge "Fiabilite" signale la qualite des donnees sources.
        </div>
        
        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
            Aucun membre trouvé
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface)', borderBottomColor: 'var(--color-border)' }} className="border-b">
                  <th className="px-4 py-3 text-left font-semibold sticky left-0 z-20" style={{ color: 'var(--color-text)', backgroundColor: "var(--color-surface)" }}>Membre</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-text)' }}>Statut / Rôle</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-text)' }}>Ancienneté</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Fiabilité</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Entraide (/17)</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Spotlight (/5)</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Raids (/5)</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Discord (/5)</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Events (/2)</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Follow (/5)</th>
                  {showAdvancedColumns && <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Bonus décalage</th>}
                  {showAdvancedColumns && <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Bonus modération</th>}
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Total (hors bonus)</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Bonus total</th>
                  <th className="px-4 py-3 text-center font-semibold sticky right-0 z-20" style={{ color: 'var(--color-text)', backgroundColor: "var(--color-surface)" }}>Note finale</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Note finale retenue</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Delta M-1</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Note finale manuelle</th>
                  {showAdvancedColumns && <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Statut</th>}
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Statut auto</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, index) => {
                  const bonusInEdit = editingBonuses[member.twitchLogin];
                  const currentTimezoneBonus = bonusInEdit?.timezone ?? member.timezoneBonusEnabled;
                  const currentModerationBonus = bonusInEdit?.moderation ?? member.moderationBonus;
                  const bonusTotal = (currentTimezoneBonus ? TIMEZONE_BONUS_POINTS : 0) + currentModerationBonus;
                  
                  // Notes finales et statuts en cours d'édition
                  const normalizedLogin = member.twitchLogin?.toLowerCase() || '';
                  const finalNoteInEdit = editingFinalNotes[normalizedLogin];
                  const savedManualFinal = currentMonthFinalNotes[normalizedLogin]?.finalNote;
                  const { total: calculatedFinalScore } = calculateTotalAvecBonus(
                    member.totalHorsBonus,
                    currentTimezoneBonus ? TIMEZONE_BONUS_POINTS : 0,
                    currentModerationBonus
                  );
                  const finalScore = finalNoteInEdit ?? savedManualFinal ?? calculatedFinalScore;
                  const retainedFinalNote = finalScore;
                  const retainedFinalSource = (finalNoteInEdit !== undefined || savedManualFinal !== undefined) ? "manuelle" : "membre";
                  const autoStatus = getAutoStatus(finalScore);
                  const statusInEdit = editingStatuses[member.twitchLogin];
                  const roleInEdit = editingRoles[member.twitchLogin];
                  const vipInEdit = editingVips[normalizedLogin];
                  const currentIsActive = statusInEdit !== undefined ? statusInEdit : member.isActive;
                  const currentRole = roleInEdit !== undefined ? roleInEdit : member.role;
                  const currentIsVip = vipInEdit !== undefined ? vipInEdit : (member.isVip ?? false);
                  
                  // Vérifier si le membre est passé en Communauté (rouge)
                  const isPassedToCommunaute = (statusInEdit === false || roleInEdit === 'Communauté') && currentRole === 'Communauté';
                  
                  return (
                    <tr
                      key={member.twitchLogin}
                      className="border-b"
                      style={{
                        backgroundColor: index % 2 === 0 ? 'var(--color-card)' : 'var(--color-surface)',
                        borderBottomColor: 'var(--color-border)',
                      }}
                    >
                      <td className={`px-4 ${compactMode ? "py-1.5" : "py-3"} sticky left-0 z-10`} style={{ backgroundColor: index % 2 === 0 ? 'var(--color-card)' : 'var(--color-surface)' }}>
                        <div className="flex items-center gap-3">
                          {member.avatar && (
                            <img
                              src={member.avatar}
                              alt={member.displayName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium" style={{ color: 'var(--color-text)' }}>{member.displayName}</div>
                            {member.twitchLogin && (
                              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{member.twitchLogin}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={isPassedToCommunaute ? "role-badge role-badge--community" : getRoleBadgeClassName(currentRole)}
                        >
                          {getRoleBadgeLabel(currentRole)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {calculateSeniority(member.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(() => {
                          const reliability = getDataReliabilityBadge(member);
                          return (
                            <span
                              className="px-2 py-1 rounded-full text-xs font-semibold"
                              style={{ backgroundColor: reliability.bg, color: reliability.color }}
                            >
                              {reliability.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center font-medium" style={{ color: '#22c55e' }}>
                        {getEntraideScore(member).value.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--color-text)' }}>
                        <span title={`Presences: ${member.spotlightPresences || 0}/${member.spotlightTotal || 0}`}>
                          {member.spotlightPoints.toFixed(2)}
                        </span>
                        
                      </td>
                      <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--color-text)' }}>
                        <span title={`Raids faits: ${member.raidsDone || 0} · Raids recus: ${member.raidsReceived || 0}`}>
                          {member.raidsPoints.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--color-text)' }}>
                        <span title="Source: /api/evaluations/discord/points">
                          {member.discordPoints.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--color-text)' }}>
                        <span title={`Presences events: ${member.eventsPresences || 0}/${member.eventsTotal || 0}`}>
                          {member.eventsPoints.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--color-text)' }}>
                        <span title="Source: derniere validation de suivi connue">
                          {member.followPoints.toFixed(2)}
                        </span>
                      </td>
                      {showAdvancedColumns && (
                      <td className="px-4 py-3 text-center">
                        <label className="flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentTimezoneBonus}
                            onChange={(e) => handleTimezoneToggle(member.twitchLogin, e.target.checked)}
                            className="w-5 h-5 rounded border"
                            style={{ borderColor: 'var(--color-border)' }}
                          />
                        </label>
                      </td>
                      )}
                      {showAdvancedColumns && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.5"
                            value={currentModerationBonus}
                            onChange={(e) => handleModerationChange(member.twitchLogin, parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 rounded border text-center text-sm"
                            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                          />
                          <button
                            onClick={() => handleModerationChange(member.twitchLogin, currentModerationBonus)}
                            className="px-2 py-1 rounded text-xs transition-colors"
                            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                          >
                            OK
                          </button>
                        </div>
                      </td>
                      )}
                      <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--color-text)' }}>
                        {member.totalHorsBonus.toFixed(2)} / 25
                      </td>
                      <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--color-text)' }}>
                        {bonusTotal.toFixed(2)}
                      </td>
                      <td className={`px-4 ${compactMode ? "py-1.5" : "py-3"} text-center font-bold sticky right-0 z-10`} style={{ color: finalScore >= 16 ? '#10b981' : finalScore < 5 ? '#f59e0b' : 'var(--color-text)', backgroundColor: index % 2 === 0 ? 'var(--color-card)' : 'var(--color-surface)' }}>
                        {finalScore.toFixed(2)} / 32
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-semibold" style={{ color: 'var(--color-text)' }}>
                          {retainedFinalNote.toFixed(2)} / 32
                        </div>
                        <div className="text-xs" style={{ color: retainedFinalSource === "manuelle" ? '#10b981' : 'var(--color-text-secondary)' }}>
                          {retainedFinalSource === "manuelle" ? "Source: manuelle" : "Source: membre"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        {(() => {
                          const delta = getTrendDelta(member);
                          if (delta === null) {
                            return <span style={{ color: "var(--color-text-secondary)" }}>-</span>;
                          }
                          const color = delta > 0 ? "#10b981" : delta < 0 ? "#ef4444" : "var(--color-text-secondary)";
                          const prefix = delta > 0 ? "+" : "";
                          return <span style={{ color }}>{prefix}{delta.toFixed(2)}</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="32"
                          step="0.01"
                          placeholder={finalScore.toFixed(2)}
                          value={finalNoteInEdit !== undefined && finalNoteInEdit !== null ? finalNoteInEdit : ''}
                          onChange={(e) => handleFinalNoteChange(member.twitchLogin, e.target.value)}
                          className="w-20 px-2 py-1 rounded border text-center text-sm"
                          style={{ backgroundColor: finalNoteInEdit !== undefined ? '#10b98120' : 'var(--color-surface)', borderColor: finalNoteInEdit !== undefined ? '#10b981' : 'var(--color-border)', color: 'var(--color-text)' }}
                        />
                        {finalNoteInEdit !== undefined && (
                          <input
                            type="text"
                            value={editingFinalNoteReasons[normalizedLogin] || ""}
                            onChange={(e) => handleFinalNoteReasonChange(member.twitchLogin, e.target.value)}
                            placeholder="Pourquoi cet override ?"
                            className="mt-1 w-40 px-2 py-1 rounded border text-xs"
                            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                          />
                        )}
                      </td>
                      {showAdvancedColumns && (
                      <td className="px-4 py-3 text-center">
                        <label className="flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentIsActive}
                            onChange={(e) => handleStatusChange(member.twitchLogin, e.target.checked)}
                            className="w-5 h-5 rounded border"
                            style={{ borderColor: statusInEdit !== undefined ? '#10b981' : 'var(--color-border)' }}
                            title={currentIsActive ? "Actif (désactiver = rôle Communauté)" : "Inactif (activer pour réintégrer)"}
                          />
                        </label>
                        {statusInEdit !== undefined && (
                          <span className="text-xs ml-1" style={{ color: statusInEdit ? '#10b981' : '#f59e0b' }}>
                            {statusInEdit ? '✓' : '✗'}
                          </span>
                        )}
                      </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        {autoStatus === 'vip' && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#10b98120', color: '#10b981' }}>
                            VIP
                          </span>
                        )}
                        {autoStatus === 'surveiller' && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
                            À surveiller
                          </span>
                        )}
                        {autoStatus === 'neutre' && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
                            —
                          </span>
                        )}
                        {member.role === 'Communauté' && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold ml-2" style={{ backgroundColor: '#155e7520', color: '#06b6d4' }}>
                            Communauté
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleForceRole(member.twitchLogin, 'Communauté')}
                            className="px-3 py-1 rounded text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: member.role === 'Communauté' ? '#155e75' : '#155e7520',
                              color: member.role === 'Communauté' ? 'white' : '#06b6d4',
                              border: '1px solid #06b6d4',
                            }}
                            title="Forcer le rôle Communauté (isActive = false)"
                          >
                            Forcer Communauté
                          </button>
                          <button
                            onClick={() => handleVipToggle(member.twitchLogin, !currentIsVip)}
                            className="px-3 py-1 rounded text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: currentIsVip ? '#10b981' : '#10b98120',
                              color: currentIsVip ? 'white' : '#10b981',
                              border: '1px solid #10b981',
                            }}
                            title={currentIsVip ? "Désactiver le statut VIP" : "Activer le statut VIP"}
                          >
                            {currentIsVip ? 'VIP ✓' : 'VIP'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {activeTab === "historique" && (
        <div className="mb-8 rounded-lg border p-6" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
            Historique des overrides ({overrideLogs.length})
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            Trace qui / quand / pourquoi pour notes finales, bonus et changements de statut.
          </p>
          {overrideLogs.length === 0 ? (
            <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Aucun override enregistre pour ce mois.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderBottomColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Membre</th>
                    <th className="px-4 py-3 text-left">Par</th>
                    <th className="px-4 py-3 text-left">Pourquoi</th>
                  </tr>
                </thead>
                <tbody>
                  {overrideLogs.map((log) => (
                    <tr key={log.id} className="border-b" style={{ borderBottomColor: "var(--color-border)" }}>
                      <td className="px-4 py-3">{new Date(log.timestamp).toLocaleString("fr-FR")}</td>
                      <td className="px-4 py-3">{log.action}</td>
                      <td className="px-4 py-3">{log.resourceId || "-"}</td>
                      <td className="px-4 py-3">{log.actorUsername || log.actorDiscordId || "-"}</td>
                      <td className="px-4 py-3">{String(log.metadata?.reason || log.metadata?.sourcePage || "Non renseigne")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
