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
  points: number; // Points calculés automatiquement selon la logique
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
  const [sortColumn, setSortColumn] = useState<SortColumn>('membre');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingNote, setEditingNote] = useState<{ twitchLogin: string; note: string } | null>(null);
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

      // Charger tous les membres actifs
      const membersResponse = await fetch("/api/members/public", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      let allMembers: any[] = [];
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        allMembers = (membersData.members || []).filter((m: any) => m.isActive === true);
      }

      // Charger les notes d'évaluation
      const notesResponse = await fetch(`/api/evaluations/raids/notes?month=${selectedMonth}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      let notesData: Record<string, string> = {};
      if (notesResponse.ok) {
        const notesResult = await notesResponse.json();
        // Convertir les notes au format { twitchLogin: note }
        if (notesResult.notes && typeof notesResult.notes === 'object') {
          Object.entries(notesResult.notes).forEach(([key, value]: [string, any]) => {
            if (value && typeof value === 'object' && value.note) {
              notesData[key.toLowerCase()] = value.note;
            } else if (typeof value === 'string') {
              // Format direct : { twitchLogin: "note" }
              notesData[key.toLowerCase()] = value;
            }
          });
        }
      }
      setNotes(notesData);

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
      const membersList: MemberRaidStats[] = allMembers
        .filter((member: any) => member.twitchLogin) // Filtrer les membres sans twitchLogin
        .map((member: any) => {
          const loginLower = member.twitchLogin?.toLowerCase() || '';
          const stats = memberStatsMap.get(loginLower) || { done: 0, received: 0 };
          return {
            twitchLogin: member.twitchLogin || '',
            displayName: member.displayName || member.twitchLogin || '',
            raidsDone: stats.done,
            raidsReceived: stats.received,
            points: calculatePoints(stats.done),
            note: notesData[loginLower],
          };
        });

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
  
  // Calculer les statistiques des points pour l'affichage (calculées dynamiquement depuis members)
  const totalPoints = members.reduce((sum, m) => sum + m.points, 0);
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
          comparison = a.points - b.points;
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

  async function handleSaveNote(twitchLogin: string, note: string) {
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
        }),
      });

      if (response.ok) {
        // Mettre à jour localement
        const updatedNotes = { ...notes };
        if (note.trim()) {
          updatedNotes[twitchLogin.toLowerCase()] = note.trim();
        } else {
          delete updatedNotes[twitchLogin.toLowerCase()];
        }
        setNotes(updatedNotes);

        // Mettre à jour la liste des membres
        setMembers(members.map(m => 
          m.twitchLogin.toLowerCase() === twitchLogin.toLowerCase()
            ? { ...m, note: note.trim() || undefined }
            : m
        ));

        setEditingNote(null);
      } else {
        const error = await response.json();
        alert(`Erreur : ${error.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la note:", error);
      alert("Erreur lors de la sauvegarde de la note");
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
                    title="Points calculés: 0 raid=0pt, 1-2 raids=1pt, 3 raids=2pt, 4 raids=3pt, 5 raids=4pt, 6+=5pt"
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
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${
                          member.points === 0 ? 'text-gray-500' :
                          member.points === 5 ? 'text-green-400' :
                          member.points >= 3 ? 'text-yellow-400' :
                          'text-orange-400'
                        }`}>
                          {member.points}/5
                        </span>
                        {member.raidsDone > 0 && (
                          <span className="text-xs text-gray-500">
                            ({member.raidsDone} raid{member.raidsDone > 1 ? 's' : ''})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-md">
                        {editingNote?.twitchLogin === member.twitchLogin ? (
                          <textarea
                            value={editingNote.note}
                            onChange={(e) => setEditingNote({ ...editingNote, note: e.target.value })}
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
                      {editingNote?.twitchLogin === member.twitchLogin ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveNote(member.twitchLogin, editingNote.note)}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {saving ? '...' : '✓'}
                          </button>
                          <button
                            onClick={() => setEditingNote(null)}
                            disabled={saving}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingNote({ twitchLogin: member.twitchLogin, note: member.note || '' })}
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
