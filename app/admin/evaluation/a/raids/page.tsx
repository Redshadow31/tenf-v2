"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import { hasAdminDashboardAccess } from "@/lib/admin";

interface MemberRaidStats {
  twitchLogin: string;
  displayName: string;
  raidsDone: number;
  raidsReceived: number;
  calculatedPoints: number; // Points calculés automatiquement selon la logique
  manualPoints?: number; // Points manuels (0-5), si défini, remplace les points calculés
  note?: string; // Commentaire manuel optionnel
}

/**
 * Calcule les points selon la logique :
 * - 0 raid fait = 0 point
 * - 1-2 raids faits = 1 point
 * - 3 raids faits = 2 points
 * - 4 raids faits = 3 points
 * - 5 raids faits = 4 points
 * - 6+ raids faits = 5 points (sur 5)
 */
function calculatePoints(raidsDone: number): number {
  if (raidsDone === 0) return 0;
  if (raidsDone >= 1 && raidsDone <= 2) return 1;
  if (raidsDone === 3) return 2;
  if (raidsDone === 4) return 3;
  if (raidsDone === 5) return 4;
  if (raidsDone >= 6) return 5;
  return 0;
}

interface RaidStats {
  totalRaidsFaits: number;
  totalRaidsRecus: number;
  activeRaiders: number;
  uniqueTargets: number;
}

type SortColumn = 'membre' | 'raidsDone' | 'raidsReceived' | 'points' | 'note';
type SortDirection = 'asc' | 'desc';

export default function EvaluationARaidsPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [members, setMembers] = useState<MemberRaidStats[]>([]);
  const [raidStats, setRaidStats] = useState<RaidStats | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [manualPoints, setManualPoints] = useState<Record<string, number | undefined>>({});
  const [sortColumn, setSortColumn] = useState<SortColumn>('membre');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingMember, setEditingMember] = useState<{ twitchLogin: string; note: string; manualPoints?: number } | null>(null);
  const [saving, setSaving] = useState(false);

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

    // Initialiser avec le mois en cours
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${year}-${month}`);
  }, []);

  useEffect(() => {
    if (hasAccess && selectedMonth) {
      loadData();
    }
  }, [hasAccess, selectedMonth]);

  async function loadData() {
    if (!selectedMonth) return;
    
    try {
      setLoading(true);

      // Charger les données de raids
      const raidsResponse = await fetch(`/api/discord/raids/data-v2?month=${selectedMonth}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      let raidsData: any = { raidsFaits: [], raidsRecus: [] };
      if (raidsResponse.ok) {
        raidsData = await raidsResponse.json();
      }

      // Charger tous les membres actifs depuis la base de données centralisée (comme /admin/membres/gestion)
      const membersResponse = await fetch("/api/admin/members", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      let allMembers: any[] = [];
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        // Filtrer uniquement les membres actifs (isActive === true, ou undefined/null = actif par défaut)
        // Certains membres peuvent ne pas avoir isActive défini explicitement, on les considère comme actifs
        allMembers = (membersData.members || []).filter((m: any) => {
          // Si isActive est explicitement false, on exclut le membre
          // Sinon, on l'inclut (isActive === true ou undefined/null)
          return m.isActive !== false;
        });
        console.log(`[Evaluation Raids] Total membres de l'API: ${(membersData.members || []).length}, membres actifs: ${allMembers.length}`);
      } else {
        const errorText = await membersResponse.text().catch(() => 'Erreur inconnue');
        console.error("Erreur lors du chargement des membres:", membersResponse.status, membersResponse.statusText, errorText);
      }

      // Charger les notes d'évaluation
      const notesResponse = await fetch(`/api/evaluations/raids/notes?month=${selectedMonth}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      let notesData: Record<string, string> = {};
      let manualPointsData: Record<string, number | undefined> = {};
      if (notesResponse.ok) {
        const notesResult = await notesResponse.json();
        // Convertir les notes et points manuels au format { twitchLogin: { note, manualPoints } }
        if (notesResult.notes && typeof notesResult.notes === 'object') {
          Object.entries(notesResult.notes).forEach(([key, value]: [string, any]) => {
            const loginLower = key.toLowerCase();
            if (value && typeof value === 'object') {
              if (value.note !== undefined) {
                notesData[loginLower] = value.note;
              }
              if (value.manualPoints !== undefined && value.manualPoints !== null) {
                manualPointsData[loginLower] = Number(value.manualPoints);
              }
            } else if (typeof value === 'string') {
              // Format direct : { twitchLogin: "note" } (ancien format, pour compatibilité)
              notesData[loginLower] = value;
            }
          });
        }
      }
      setNotes(notesData);
      setManualPoints(manualPointsData);

      // Calculer les statistiques par membre
      const memberStatsMap = new Map<string, { done: number; received: number }>();

      // Compter les raids faits
      (raidsData.raidsFaits || []).forEach((raid: any) => {
        const twitchLogin = raid.raiderTwitchLogin || raid.raider;
        if (twitchLogin) {
          const loginLower = twitchLogin.toLowerCase();
          if (!memberStatsMap.has(loginLower)) {
            memberStatsMap.set(loginLower, { done: 0, received: 0 });
          }
          const stats = memberStatsMap.get(loginLower)!;
          stats.done += raid.count || 1;
        }
      });

      // Compter les raids reçus
      (raidsData.raidsRecus || []).forEach((raid: any) => {
        const twitchLogin = raid.targetTwitchLogin || raid.target;
        if (twitchLogin) {
          const loginLower = twitchLogin.toLowerCase();
          if (!memberStatsMap.has(loginLower)) {
            memberStatsMap.set(loginLower, { done: 0, received: 0 });
          }
          const stats = memberStatsMap.get(loginLower)!;
          stats.received += 1;
        }
      });

      // Créer la liste des membres avec leurs stats (tous les membres actifs, même sans raids)
      console.log(`[Evaluation Raids] Membres actifs chargés: ${allMembers.length}`);
      console.log(`[Evaluation Raids] Stats de raids:`, memberStatsMap.size, 'membres avec raids');
      
      const membersList: MemberRaidStats[] = allMembers
        .filter((member: any) => {
          // Filtrer les membres sans twitchLogin (mais garder ceux avec displayName)
          const hasTwitchLogin = member.twitchLogin && member.twitchLogin.trim() !== '';
          if (!hasTwitchLogin) {
            console.warn(`[Evaluation Raids] Membre sans twitchLogin ignoré:`, member.displayName || member.nom || 'Inconnu');
          }
          return hasTwitchLogin;
        })
        .map((member: any) => {
          const loginLower = (member.twitchLogin || '').toLowerCase();
          const stats = memberStatsMap.get(loginLower) || { done: 0, received: 0 };
          const calculatedPts = calculatePoints(stats.done);
          const manualPts = manualPointsData[loginLower];
          return {
            twitchLogin: member.twitchLogin || '',
            displayName: member.displayName || member.nom || member.twitchLogin || '',
            raidsDone: stats.done,
            raidsReceived: stats.received,
            calculatedPoints: calculatedPts,
            manualPoints: manualPts,
            note: notesData[loginLower],
          };
        });
      
      console.log(`[Evaluation Raids] Liste finale des membres: ${membersList.length}`);

      // Trier par ordre alphabétique par défaut
      membersList.sort((a, b) => {
        return a.displayName.localeCompare(b.displayName, 'fr', { sensitivity: 'base' });
      });

      setMembers(membersList);

      // Calculer les statistiques globales
      const totalRaidsFaits = (raidsData.raidsFaits || []).reduce((sum: number, r: any) => sum + (r.count || 1), 0);
      const totalRaidsRecus = (raidsData.raidsRecus || []).length;
      const activeRaidersSet = new Set((raidsData.raidsFaits || []).map((r: any) => (r.raiderTwitchLogin || r.raider)?.toLowerCase()).filter(Boolean));
      const uniqueTargetsSet = new Set((raidsData.raidsRecus || []).map((r: any) => (r.targetTwitchLogin || r.target)?.toLowerCase()).filter(Boolean));

      setRaidStats({
        totalRaidsFaits,
        totalRaidsRecus,
        activeRaiders: activeRaidersSet.size,
        uniqueTargets: uniqueTargetsSet.size,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
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

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'membre' || column === 'note' ? 'asc' : 'desc');
    }
  }
  
  // Helper pour obtenir les points affichés (manuel si défini, sinon calculé)
  function getDisplayPoints(member: MemberRaidStats): number {
    return member.manualPoints !== undefined && member.manualPoints !== null ? member.manualPoints : member.calculatedPoints;
  }

  // Calculer les statistiques des points pour l'affichage (calculées dynamiquement depuis members)
  const totalPoints = members.reduce((sum, m) => sum + getDisplayPoints(m), 0);
  const averagePoints = members.length > 0 ? (totalPoints / members.length).toFixed(2) : '0';

  function getSortedMembers(): MemberRaidStats[] {
    const sorted = [...members];
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'membre':
          comparison = a.displayName.localeCompare(b.displayName, 'fr', { sensitivity: 'base' });
          break;
        case 'raidsDone':
          comparison = a.raidsDone - b.raidsDone;
          break;
        case 'raidsReceived':
          comparison = a.raidsReceived - b.raidsReceived;
          break;
        case 'points':
          comparison = getDisplayPoints(a) - getDisplayPoints(b);
          break;
        case 'note':
          const noteA = (a.note || '').toLowerCase();
          const noteB = (b.note || '').toLowerCase();
          comparison = noteA.localeCompare(noteB, 'fr', { sensitivity: 'base' });
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }

  async function handleSaveMember(twitchLogin: string, note: string, manualPoints?: number) {
    try {
      setSaving(true);
      const response = await fetch('/api/evaluations/raids/notes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: selectedMonth,
          twitchLogin,
          note: note.trim() || undefined,
          manualPoints: manualPoints !== undefined && manualPoints !== null ? Number(manualPoints) : undefined,
        }),
      });

      if (response.ok) {
        const loginLower = twitchLogin.toLowerCase();
        
        // Mettre à jour localement
        const updatedNotes = { ...notes };
        if (note.trim()) {
          updatedNotes[loginLower] = note.trim();
        } else {
          delete updatedNotes[loginLower];
        }
        setNotes(updatedNotes);

        const updatedManualPoints = { ...manualPoints };
        if (manualPoints !== undefined && manualPoints !== null) {
          updatedManualPoints[loginLower] = Number(manualPoints);
        } else {
          delete updatedManualPoints[loginLower];
        }
        setManualPoints(updatedManualPoints);

        // Mettre à jour la liste des membres
        setMembers(members.map(m => 
          m.twitchLogin.toLowerCase() === loginLower
            ? { 
                ...m, 
                note: note.trim() || undefined,
                manualPoints: manualPoints !== undefined && manualPoints !== null ? Number(manualPoints) : undefined
              }
            : m
        ));

        setEditingMember(null);
      } else {
        const error = await response.json();
        alert(`Erreur : ${error.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !members.length) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des données...</p>
        </div>
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

  const sortedMembers = getSortedMembers();

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white p-8">
      <div className="mb-8">
        <Link
          href="/admin/evaluation/a"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour à A. Présence Active
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Raids — Présence Active</h1>
        <p className="text-gray-400">Évaluation mensuelle des raids effectués</p>
      </div>

      {/* Sélecteur de mois */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-semibold text-gray-300">Mois :</label>
        <select
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            setSortColumn('membre');
            setSortDirection('asc');
          }}
          className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
        >
          {getMonthOptions().map(option => (
            <option key={option} value={option}>
              {formatMonthKey(option)}
            </option>
          ))}
        </select>
      </div>

      {/* Statistiques globales */}
      {raidStats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-6">
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Total Raids Faits</p>
            <p className="text-3xl font-bold text-[#9146ff]">{raidStats.totalRaidsFaits}</p>
          </div>
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Total Raids Reçus</p>
            <p className="text-3xl font-bold text-green-400">{raidStats.totalRaidsRecus}</p>
          </div>
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Raiders Actifs</p>
            <p className="text-3xl font-bold text-white">{raidStats.activeRaiders}</p>
          </div>
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Cibles Uniques</p>
            <p className="text-3xl font-bold text-yellow-400">{raidStats.uniqueTargets}</p>
          </div>
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Points Total</p>
            <p className="text-3xl font-bold text-purple-400">{totalPoints}</p>
          </div>
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Moyenne Points</p>
            <p className="text-3xl font-bold text-blue-400">{averagePoints}</p>
          </div>
        </div>
      )}

      {/* Tableau des membres */}
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/50">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  <button
                    onClick={() => handleSort('membre')}
                    className="flex items-center gap-2 hover:text-[#9146ff] transition-colors cursor-pointer"
                  >
                    Membre
                    {sortColumn === 'membre' && (
                      <span className="text-[#9146ff]">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  <button
                    onClick={() => handleSort('raidsDone')}
                    className="flex items-center gap-2 hover:text-[#9146ff] transition-colors cursor-pointer"
                  >
                    Raids Faits
                    {sortColumn === 'raidsDone' && (
                      <span className="text-[#9146ff]">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  <button
                    onClick={() => handleSort('raidsReceived')}
                    className="flex items-center gap-2 hover:text-[#9146ff] transition-colors cursor-pointer"
                  >
                    Raids Reçus
                    {sortColumn === 'raidsReceived' && (
                      <span className="text-[#9146ff]">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  <button
                    onClick={() => handleSort('points')}
                    className="flex items-center gap-2 hover:text-[#9146ff] transition-colors cursor-pointer"
                    title="Points (cliquez sur Modifier pour éditer manuellement): 0 raid=0pt, 1-2 raids=1pt, 3 raids=2pt, 4 raids=3pt, 5 raids=4pt, 6+=5pt. (M) = Points manuels"
                  >
                    Points (sur 5)
                    {sortColumn === 'points' && (
                      <span className="text-[#9146ff]">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  <button
                    onClick={() => handleSort('note')}
                    className="flex items-center gap-2 hover:text-[#9146ff] transition-colors cursor-pointer"
                  >
                    Notes
                    {sortColumn === 'note' && (
                      <span className="text-[#9146ff]">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  Modifier
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Aucun membre actif trouvé
                  </td>
                </tr>
              ) : (
                sortedMembers.map((member) => (
                  <tr
                    key={member.twitchLogin}
                    className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-semibold text-white">{member.displayName}</div>
                        <div className="text-gray-500 text-xs">{member.twitchLogin}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-white font-semibold">{member.raidsDone}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-white font-semibold">{member.raidsReceived}</span>
                    </td>
                    <td className="py-4 px-6">
                      {editingMember?.twitchLogin === member.twitchLogin ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.5"
                            value={editingMember.manualPoints !== undefined && editingMember.manualPoints !== null ? editingMember.manualPoints : ''}
                            onChange={(e) => {
                              const val = e.target.value.trim();
                              if (val === '') {
                                setEditingMember({ ...editingMember, manualPoints: undefined });
                              } else {
                                const numVal = Number(val);
                                if (!isNaN(numVal) && numVal >= 0 && numVal <= 5) {
                                  setEditingMember({ ...editingMember, manualPoints: numVal });
                                }
                              }
                            }}
                            placeholder="Auto"
                            className="w-20 bg-[#0e0e10] border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[#9146ff]"
                          />
                          <span className="text-xs text-gray-500">/5</span>
                          {editingMember.manualPoints === undefined && (
                            <span className="text-xs text-gray-500">
                              (Auto: {member.calculatedPoints})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${
                            getDisplayPoints(member) === 0 ? 'text-gray-500' :
                            getDisplayPoints(member) === 5 ? 'text-green-400' :
                            getDisplayPoints(member) >= 3 ? 'text-yellow-400' :
                            'text-orange-400'
                          }`}>
                            {getDisplayPoints(member)}/5
                          </span>
                          {member.manualPoints !== undefined && member.manualPoints !== null && (
                            <span className="text-xs text-purple-400" title="Points manuels">(M)</span>
                          )}
                          {member.raidsDone > 0 && member.manualPoints === undefined && (
                            <span className="text-xs text-gray-500">
                              ({member.raidsDone} raid{member.raidsDone > 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-md">
                        {editingMember?.twitchLogin === member.twitchLogin ? (
                          <textarea
                            value={editingMember.note}
                            onChange={(e) => setEditingMember({ ...editingMember, note: e.target.value })}
                            className="w-full bg-[#0e0e10] border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#9146ff] resize-none"
                            rows={2}
                            placeholder="Ajouter un commentaire (optionnel)..."
                          />
                        ) : (
                          <div className="text-gray-300 text-sm">
                            {member.note ? (
                              <div className="whitespace-pre-wrap">{member.note}</div>
                            ) : (
                              <span className="text-gray-500 italic">Aucun commentaire</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {editingMember?.twitchLogin === member.twitchLogin ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveMember(member.twitchLogin, editingMember.note, editingMember.manualPoints)}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {saving ? '...' : '✓'}
                          </button>
                          <button
                            onClick={() => setEditingMember(null)}
                            disabled={saving}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingMember({ 
                            twitchLogin: member.twitchLogin, 
                            note: member.note || '',
                            manualPoints: member.manualPoints
                          })}
                          className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold px-4 py-2 rounded text-sm transition-colors"
                        >
                          Modifier
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
