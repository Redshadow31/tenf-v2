"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import { hasAdminDashboardAccess } from "@/lib/admin";
import {
  calculateSpotlightPoints,
  calculateRaidPoints,
  calculateTotalHorsBonus,
  calculateTotalAvecBonus,
  getAutoStatus,
  calculateSeniority,
} from "@/lib/evaluationSynthesisHelpers";
import { calculateNoteEcrit, calculateNoteVocal, calculateNoteFinale } from "@/lib/discordEngagement";
import { calculateBonusTotal, TIMEZONE_BONUS_POINTS, type MemberBonus } from "@/lib/evaluationBonusHelpers";
import { getRoleBadgeStyles } from "@/lib/roleColors";

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
  vipCount: number; // Membres avec note finale > 16
  surveillerCount: number; // Membres avec note finale < 5
}

// ============================================
// COMPOSANTS
// ============================================

function StatCard({ title, value, subtitle, color = "#9146ff" }: { title: string; value: string | number; subtitle?: string; color?: string }) {
  return (
    <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
        {title}
      </p>
      <p className="text-2xl font-bold mb-1" style={{ color }}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {subtitle}
        </p>
      )}
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
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  
  // États pour les bonus (édition en ligne)
  const [editingBonuses, setEditingBonuses] = useState<Record<string, { timezone: boolean; moderation: number }>>({});

  useEffect(() => {
    async function checkAccess() {
      try {
        const user = await getDiscordUser();
        if (user) {
          const access = hasAdminDashboardAccess(user.id);
          setHasAccess(access);
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
      // Charger toutes les données en parallèle
      const [
        membersResponse,
        spotlightResponse,
        raidsResponse,
        discordResponse,
        eventsResponse,
        followResponse,
        bonusesResponse,
      ] = await Promise.all([
        fetch("/api/admin/members", { cache: 'no-store' }),
        fetch(`/api/spotlight/presence/monthly?month=${selectedMonth}`, { cache: 'no-store' }),
        fetch(`/api/discord/raids/data-v2?month=${selectedMonth}`, { cache: 'no-store' }),
        fetch(`/api/discord-engagement/${selectedMonth}`, { cache: 'no-store' }),
        fetch(`/api/admin/events/presence?month=${selectedMonth}`, { cache: 'no-store' }).catch(() => ({ ok: false, json: () => ({ events: [] }) })),
        fetch(`/api/follow/validations/${selectedMonth}`, { cache: 'no-store' }).catch(() => ({ ok: false, json: () => ({ validations: [] }) })),
        fetch(`/api/evaluations/bonus?month=${selectedMonth}`, { cache: 'no-store' }),
      ]);

      // Parser les réponses
      const membersData = membersResponse.ok ? (await membersResponse.json()).members || [] : [];
      const spotlightData = spotlightResponse.ok ? await spotlightResponse.json() : { totalSpotlights: 0, members: [] };
      const raidsData = raidsResponse.ok ? await raidsResponse.json() : { raidsFaits: [], raidsRecus: [] };
      const discordData = discordResponse.ok ? await discordResponse.json() : { dataByMember: {} };
      const eventsData = eventsResponse.ok ? await eventsResponse.json() : { events: [] };
      const followData = followResponse.ok ? await followResponse.json() : { validations: [] };
      const bonusesData = bonusesResponse.ok ? (await bonusesResponse.json()).bonuses || {} : {};

      // Construire les données d'évaluation pour chaque membre actif
      const evaluationData: MemberEvaluationData[] = [];
      
      // Filtrer uniquement les membres actifs
      const activeMembers = membersData.filter(m => m.isActive !== false && m.twitchLogin);
      
      // Créer des maps pour accès rapide
      const spotlightMap = new Map<string, { presences: number; total: number }>();
      const raidsMap = new Map<string, { done: number; received: number }>();
      const discordMap = new Map<string, { nbMessages: number; nbVocalMinutes: number; noteFinale: number }>();
      const eventsMap = new Map<string, { presences: number; total: number }>();
      const followMap = new Map<string, number>();
      
      // Populate spotlight map
      if (spotlightData.members) {
        for (const member of spotlightData.members) {
          const login = member.twitchLogin?.toLowerCase();
          if (login) {
            spotlightMap.set(login, {
              presences: member.presences || 0,
              total: spotlightData.totalSpotlights || 0,
            });
          }
        }
      }
      
      // Populate raids map
      if (raidsData.raidsFaits) {
        for (const raid of raidsData.raidsFaits) {
          const login = raid.raiderLogin?.toLowerCase();
          if (login) {
            const existing = raidsMap.get(login) || { done: 0, received: 0 };
            existing.done = (existing.done || 0) + 1;
            raidsMap.set(login, existing);
          }
        }
      }
      if (raidsData.raidsRecus) {
        for (const raid of raidsData.raidsRecus) {
          const login = raid.targetLogin?.toLowerCase();
          if (login) {
            const existing = raidsMap.get(login) || { done: 0, received: 0 };
            existing.received = (existing.received || 0) + 1;
            raidsMap.set(login, existing);
          }
        }
      }
      
      // Populate discord map
      if (discordData.dataByMember) {
        for (const [discordId, engagement] of Object.entries(discordData.dataByMember) as [string, any][]) {
          const login = engagement.twitchLogin?.toLowerCase();
          if (login) {
            discordMap.set(login, {
              nbMessages: engagement.nbMessages || 0,
              nbVocalMinutes: engagement.nbVocalMinutes || 0,
              noteFinale: engagement.noteFinale || 0,
            });
          }
        }
      }
      
      // Populate events map (simplifié - à compléter selon l'API réelle)
      // Pour l'instant, placeholder
      const eventsTotal = eventsData.events?.length || 0;
      if (eventsData.events) {
        for (const event of eventsData.events) {
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
      
      // Populate follow map (simplifié - basé sur computeScores de la page C)
      if (followData.validations && Array.isArray(followData.validations)) {
        const memberLogins = membersData.map(m => m.twitchLogin?.toLowerCase()).filter(Boolean) as string[];
        const totalSheets = followData.validations.length;
        
        for (const login of memberLogins) {
          let count = 0;
          for (const sheet of followData.validations) {
            // Utiliser la même logique que computeScores (simplifié)
            if (sheet.membersArray) {
              const member = sheet.membersArray.find((m: any) => (m.twitchLogin || '').toLowerCase() === login);
              if (member?.meSuit) count++;
            }
          }
          const taux = totalSheets > 0 ? count / totalSheets : 0;
          const score = Math.round(taux * 5 * 100) / 100;
          followMap.set(login, score);
        }
      }
      
      // Construire les données d'évaluation pour chaque membre actif
      for (const member of activeMembers) {
        const login = member.twitchLogin?.toLowerCase();
        if (!login) continue;
        
        // Spotlight
        const spotlightInfo = spotlightMap.get(login) || { presences: 0, total: spotlightData.totalSpotlights || 0 };
        const spotlightPoints = calculateSpotlightPoints(spotlightInfo.presences, spotlightInfo.total);
        
        // Raids
        const raidsInfo = raidsMap.get(login) || { done: 0, received: 0 };
        const raidsPoints = calculateRaidPoints(raidsInfo.done);
        
        // Discord
        const discordInfo = discordMap.get(login) || { nbMessages: 0, nbVocalMinutes: 0, noteFinale: 0 };
        let discordPoints = discordInfo.noteFinale;
        if (!discordPoints) {
          const noteEcrit = calculateNoteEcrit(discordInfo.nbMessages);
          const noteVocal = calculateNoteVocal(discordInfo.nbVocalMinutes);
          discordPoints = calculateNoteFinale(noteEcrit, noteVocal);
        }
        
        // Events (simplifié - sur /2 pour l'instant, à adapter selon l'API réelle)
        const eventsInfo = eventsMap.get(login) || { presences: 0, total: eventsTotal };
        // Calcul simplifié : si présent à au moins 50% des events = 2, sinon proportionnel
        const eventsRate = eventsInfo.total > 0 ? eventsInfo.presences / eventsInfo.total : 0;
        const eventsPoints = Math.round(eventsRate * 2 * 100) / 100;
        
        // Follow
        const followPoints = followMap.get(login) || 0;
        
        // Bonus
        const bonusInfo: MemberBonus | null = bonusesData[login] || null;
        const bonusTotal = calculateBonusTotal(bonusInfo);
        
        // Calculs
        const { total: totalHorsBonus } = calculateTotalHorsBonus(spotlightPoints, raidsPoints, discordPoints, eventsPoints, followPoints);
        const { total: finalScore } = calculateTotalAvecBonus(totalHorsBonus, bonusTotal.timezoneBonus, bonusTotal.moderationBonus);
        const autoStatus = getAutoStatus(finalScore);
        
        evaluationData.push({
          twitchLogin: member.twitchLogin,
          displayName: member.displayName || member.twitchLogin,
          role: member.role || 'Affilié',
          avatar: member.avatar,
          createdAt: member.createdAt,
          isActive: member.isActive !== false,
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
          spotlightPresences: spotlightInfo.presences,
          spotlightTotal: spotlightInfo.total,
          raidsDone: raidsInfo.done,
          raidsReceived: raidsInfo.received,
          discordNbMessages: discordInfo.nbMessages,
          discordNbVocalMinutes: discordInfo.nbVocalMinutes,
          eventsPresences: eventsInfo.presences,
          eventsTotal: eventsInfo.total,
          followScore: followPoints,
        });
      }
      
      // Trier par ordre alphabétique
      evaluationData.sort((a, b) => a.displayName.localeCompare(b.displayName));
      
      setMembersData(evaluationData);
      
      // Calculer les statistiques générales
      calculateGeneralStats(evaluationData, eventsTotal || 0, spotlightData.totalSpotlights || 0);
      
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
    const vipCount = data.filter(m => m.finalScore > 16).length;
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

  async function saveBonuses() {
    setSaving(true);
    try {
      const updates = Object.entries(editingBonuses).map(([login, bonus]) => ({
        month: selectedMonth,
        twitchLogin: login,
        timezoneBonusEnabled: bonus.timezone,
        moderationBonus: bonus.moderation,
      }));
      
      // Sauvegarder chaque bonus
      for (const update of updates) {
        const response = await fetch('/api/evaluations/bonus', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        });
        
        if (!response.ok) {
          throw new Error(`Erreur lors de la sauvegarde du bonus pour ${update.twitchLogin}`);
        }
      }
      
      // Recharger les données
      await loadAllData();
      setEditingBonuses({});
      alert('✅ Bonus enregistrés avec succès');
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des bonus:", error);
      alert('❌ Erreur lors de la sauvegarde des bonus');
    } finally {
      setSaving(false);
    }
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
    
    // Filtre actifs seulement
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
    
    return filtered;
  }, [membersData, showActiveOnly, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }} className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }} className="p-8">
        <div className="rounded-lg border p-8" style={{ backgroundColor: 'var(--color-card)', borderColor: '#dc2626' }}>
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#dc2626' }}>Accès refusé</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Vous n'avez pas les permissions nécessaires.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <div className="mb-8">
        <Link
          href="/admin/evaluation"
          className="mb-4 inline-block transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
        >
          ← Retour au Hub Évaluation
        </Link>
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>D. Synthèse & Bonus</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Synthèse globale et bonus</p>
      </div>

      {/* Sélecteur de mois et filtres */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Mois :</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-lg px-4 py-2 text-sm border"
          style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          {getMonthOptions().map(option => (
            <option key={option} value={option}>
              {formatMonthKey(option)}
            </option>
          ))}
        </select>
        
        <label className="text-sm font-semibold ml-4" style={{ color: 'var(--color-text-secondary)' }}>
          <input
            type="checkbox"
            checked={showActiveOnly}
            onChange={(e) => setShowActiveOnly(e.target.checked)}
            className="mr-2"
          />
          Actifs seulement
        </label>
        
        <input
          type="text"
          placeholder="Rechercher un membre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 max-w-xs rounded-lg px-4 py-2 text-sm border"
          style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        />
      </div>

      {/* Statistiques générales */}
      {generalStats && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Statistiques générales — {formatMonthKey(selectedMonth)}
          </h2>
          
          {/* Moyennes par domaine */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Moyennes par domaine (hors bonus)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard title="Moyenne Spotlight (/5)" value={generalStats.avgSpotlight.toFixed(2)} />
              <StatCard title="Moyenne Raids (/5)" value={generalStats.avgRaids.toFixed(2)} />
              <StatCard title="Moyenne Discord (/5)" value={generalStats.avgDiscord.toFixed(2)} />
              <StatCard title="Moyenne Events (/2)" value={generalStats.avgEvents.toFixed(2)} />
              <StatCard title="Moyenne Follow (/5)" value={generalStats.avgFollow.toFixed(2)} />
              <StatCard title="Moyenne générale (/25)" value={generalStats.avgGeneral.toFixed(2)} />
            </div>
          </div>
          
          {/* Score global */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Score global</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                title="Score global hors bonus"
                value={`${generalStats.scoreGlobalHorsBonus.toFixed(2)} / ${membersData.length * 25}`}
                color="#9146ff"
              />
              <StatCard
                title="Score global avec bonus"
                value={`${generalStats.scoreGlobalAvecBonus.toFixed(2)} / ${membersData.length * 32}`}
                color="#10b981"
              />
            </div>
          </div>
          
          {/* Présences */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Présences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                title="Taux de présence Events"
                value={`${generalStats.eventsPresenceRate.toFixed(1)}%`}
                subtitle={`${generalStats.eventsParticipants} participants`}
                color="#5865F2"
              />
              <StatCard
                title="Taux moyen présence Spotlights"
                value={`${generalStats.spotlightPresenceRate.toFixed(1)}%`}
                subtitle={`${generalStats.spotlightParticipants} participants`}
                color="#9146ff"
              />
            </div>
          </div>
          
          {/* VIP / Alertes */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>VIP / Alertes</h3>
            <div className="flex flex-wrap gap-4">
              <div className="px-4 py-2 rounded-lg border" style={{ backgroundColor: '#10b98120', borderColor: '#10b981', color: '#10b981' }}>
                <span className="font-semibold">VIP: {generalStats.vipCount}</span>
              </div>
              <div className="px-4 py-2 rounded-lg border" style={{ backgroundColor: '#f59e0b20', borderColor: '#f59e0b', color: '#f59e0b' }}>
                <span className="font-semibold">À surveiller: {generalStats.surveillerCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tableau récapitulatif */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
            Tableau récapitulatif ({filteredMembers.length} membres)
          </h2>
          <button
            onClick={saveBonuses}
            disabled={saving || Object.keys(editingBonuses).length === 0}
            className="px-6 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: saving || Object.keys(editingBonuses).length === 0 ? 'var(--color-surface)' : 'var(--color-primary)',
              color: 'white',
            }}
          >
            {saving ? 'Enregistrement...' : `Enregistrer bonus (${Object.keys(editingBonuses).length})`}
          </button>
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
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-text)' }}>Membre</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-text)' }}>Statut / Rôle</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-text)' }}>Ancienneté</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Spotlight (/5)</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Raids (/5)</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Discord (/5)</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Events (/2)</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Follow (/5)</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Bonus décalage</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Bonus modération</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Total (hors bonus)</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Bonus total</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Note finale</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text)' }}>Statut auto</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, index) => {
                  const roleStyles = getRoleBadgeStyles(member.role);
                  const bonusInEdit = editingBonuses[member.twitchLogin];
                  const currentTimezoneBonus = bonusInEdit?.timezone ?? member.timezoneBonusEnabled;
                  const currentModerationBonus = bonusInEdit?.moderation ?? member.moderationBonus;
                  const bonusTotal = (currentTimezoneBonus ? TIMEZONE_BONUS_POINTS : 0) + currentModerationBonus;
                  const { total: finalScore } = calculateTotalAvecBonus(member.totalHorsBonus, currentTimezoneBonus ? TIMEZONE_BONUS_POINTS : 0, currentModerationBonus);
                  const autoStatus = getAutoStatus(finalScore);
                  
                  return (
                    <tr
                      key={member.twitchLogin}
                      className="border-b"
                      style={{
                        backgroundColor: index % 2 === 0 ? 'var(--color-card)' : 'var(--color-surface)',
                        borderBottomColor: 'var(--color-border)',
                      }}
                    >
                      <td className="px-4 py-3">
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
                          className="px-2 py-1 rounded-full text-xs font-semibold border"
                          style={{
                            backgroundColor: roleStyles.bg,
                            color: roleStyles.text,
                            borderColor: roleStyles.border || roleStyles.bg,
                          }}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {calculateSeniority(member.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--color-text)' }}>
                        {member.spotlightPoints.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--color-text)' }}>
                        {member.raidsPoints.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--color-text)' }}>
                        {member.discordPoints.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--color-text)' }}>
                        {member.eventsPoints.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--color-text)' }}>
                        {member.followPoints.toFixed(2)}
                      </td>
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
                      <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--color-text)' }}>
                        {member.totalHorsBonus.toFixed(2)} / 25
                      </td>
                      <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--color-text)' }}>
                        {bonusTotal.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center font-bold" style={{ color: finalScore > 16 ? '#10b981' : finalScore < 5 ? '#f59e0b' : 'var(--color-text)' }}>
                        {finalScore.toFixed(2)} / 32
                      </td>
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
