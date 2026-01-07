"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import { hasAdminDashboardAccess } from "@/lib/admin";
import DiscordEngagementImportModal from "@/components/admin/DiscordEngagementImportModal";
import {
  parseDiscordEngagementTSV,
  calculateNoteEcrit,
  calculateNoteVocal,
  calculateNoteFinale,
  getAppreciation,
  type EngagementRow,
} from "@/lib/discordEngagement";
import { type MemberEngagement, type DiscordEngagementData } from "@/lib/discordEngagementStorage";

interface ActiveMember {
  discordId: string;
  displayName: string;
  twitchLogin: string;
  role?: string;
  createdAt?: string;
  avatar?: string;
}

export default function EvaluationBDiscordPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // Membres actifs
  const [activeMembers, setActiveMembers] = useState<ActiveMember[]>([]);
  const [membersMap, setMembersMap] = useState<Map<string, { discordId: string; displayName: string; twitchLogin: string }>>(new Map());
  
  // Données d'engagement
  const [engagementData, setEngagementData] = useState<Record<string, MemberEngagement>>({});
  const [hasMessagesImport, setHasMessagesImport] = useState(false);
  const [hasVocalsImport, setHasVocalsImport] = useState(false);
  const [messagesImportedAt, setMessagesImportedAt] = useState<string | undefined>();
  const [vocalsImportedAt, setVocalsImportedAt] = useState<string | undefined>();
  
  // UI
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showVocalsModal, setShowVocalsModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

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

  // Charger les membres actifs
  useEffect(() => {
    async function loadMembers() {
      try {
        const response = await fetch('/api/members/public', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          const members: ActiveMember[] = (data.members || [])
            .filter((m: any) => m.isActive !== false && m.discordId)
            .map((m: any) => ({
              discordId: m.discordId,
              displayName: m.displayName || m.twitchLogin,
              twitchLogin: m.twitchLogin,
              role: m.role,
              createdAt: m.createdAt,
              avatar: m.avatar,
            }))
            .sort((a: ActiveMember, b: ActiveMember) => a.displayName.localeCompare(b.displayName));

          setActiveMembers(members);

          // Créer le map pour le matching
          const map = new Map<string, { discordId: string; displayName: string; twitchLogin: string }>();
          for (const member of members) {
            map.set(member.discordId, {
              discordId: member.discordId,
              displayName: member.displayName,
              twitchLogin: member.twitchLogin,
            });
          }
          setMembersMap(map);
        }
      } catch (error) {
        console.error("Erreur chargement membres:", error);
      }
    }
    loadMembers();
  }, []);

  // Charger les données d'engagement pour le mois sélectionné
  useEffect(() => {
    async function loadEngagementData() {
      if (!selectedMonth) return;
      
      setLoadingData(true);
      try {
        const response = await fetch(`/api/discord-engagement/${selectedMonth}`, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setEngagementData(data.data.dataByMember || {});
            setHasMessagesImport(data.data.hasMessagesImport || false);
            setHasVocalsImport(data.data.hasVocalsImport || false);
            setMessagesImportedAt(data.data.messagesImportedAt);
            setVocalsImportedAt(data.data.vocalsImportedAt);
          } else {
            setEngagementData({});
            setHasMessagesImport(false);
            setHasVocalsImport(false);
            setMessagesImportedAt(undefined);
            setVocalsImportedAt(undefined);
          }
        }
      } catch (error) {
        console.error("Erreur chargement données engagement:", error);
        setEngagementData({});
      } finally {
        setLoadingData(false);
      }
    }
    loadEngagementData();
  }, [selectedMonth]);

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

  function formatMemberSince(createdAt?: string): string {
    if (!createdAt) return "—";
    try {
      const date = new Date(createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        return `${diffDays} jours`;
      } else {
        const diffMonths = Math.floor(diffDays / 30);
        return `${diffMonths} mois`;
      }
    } catch {
      return "—";
    }
  }

  // Calculer les données d'engagement pour chaque membre
  const membersWithEngagement = useMemo(() => {
    return activeMembers.map(member => {
      const engagement = engagementData[member.discordId] || {};
      const nbMessages = engagement.nbMessages || 0;
      const nbVocalMinutes = engagement.nbVocalMinutes || 0;
      
      const noteEcrit = calculateNoteEcrit(nbMessages);
      const noteVocal = calculateNoteVocal(nbVocalMinutes);
      const noteFinale = calculateNoteFinale(noteEcrit, noteVocal);
      
      return {
        ...member,
        nbMessages,
        nbVocalMinutes,
        noteEcrit,
        noteVocal,
        noteFinale,
        appreciation: getAppreciation(noteFinale),
      };
    });
  }, [activeMembers, engagementData]);

  // Calculer les stats globales
  const stats = useMemo(() => {
    const membersWithScore = membersWithEngagement.filter(m => m.noteFinale > 0);
    const avgScore = membersWithEngagement.length > 0
      ? membersWithEngagement.reduce((sum, m) => sum + m.noteFinale, 0) / membersWithEngagement.length
      : 0;
    
    return {
      avgScore: Math.round(avgScore * 100) / 100,
      scoredCount: membersWithScore.length,
      totalMembers: membersWithEngagement.length,
    };
  }, [membersWithEngagement]);

  const handleImportMessages = (rows: EngagementRow[]) => {
    const newData: Record<string, MemberEngagement> = { ...engagementData };
    
    // Réinitialiser les messages pour tous les membres
    for (const member of activeMembers) {
      if (!newData[member.discordId]) {
        newData[member.discordId] = {
          discordId: member.discordId,
          displayName: member.displayName,
          twitchLogin: member.twitchLogin,
          role: member.role,
          memberSince: member.createdAt,
        };
      }
      newData[member.discordId].nbMessages = 0;
    }
    
    // Mettre à jour avec les données importées
    for (const row of rows) {
      if (row.matchedMemberId && newData[row.matchedMemberId]) {
        newData[row.matchedMemberId].nbMessages = row.value;
      }
    }
    
    setEngagementData(newData);
    setHasMessagesImport(true);
    setMessagesImportedAt(new Date().toISOString());
    setShowMessagesModal(false);
  };

  const handleImportVocals = (rows: EngagementRow[]) => {
    const newData: Record<string, MemberEngagement> = { ...engagementData };
    
    // Réinitialiser les vocaux pour tous les membres
    for (const member of activeMembers) {
      if (!newData[member.discordId]) {
        newData[member.discordId] = {
          discordId: member.discordId,
          displayName: member.displayName,
          twitchLogin: member.twitchLogin,
          role: member.role,
          memberSince: member.createdAt,
        };
      }
      newData[member.discordId].nbVocalMinutes = 0;
    }
    
    // Mettre à jour avec les données importées
    for (const row of rows) {
      if (row.matchedMemberId && newData[row.matchedMemberId]) {
        newData[row.matchedMemberId].nbVocalMinutes = row.value;
      }
    }
    
    setEngagementData(newData);
    setHasVocalsImport(true);
    setVocalsImportedAt(new Date().toISOString());
    setShowVocalsModal(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Recalculer toutes les notes avant sauvegarde
      const dataByMember: Record<string, MemberEngagement> = {};
      for (const member of activeMembers) {
        const engagement = engagementData[member.discordId] || {};
        const nbMessages = engagement.nbMessages || 0;
        const nbVocalMinutes = engagement.nbVocalMinutes || 0;
        
        const noteEcrit = calculateNoteEcrit(nbMessages);
        const noteVocal = calculateNoteVocal(nbVocalMinutes);
        const noteFinale = calculateNoteFinale(noteEcrit, noteVocal);
        
        dataByMember[member.discordId] = {
          discordId: member.discordId,
          displayName: member.displayName,
          twitchLogin: member.twitchLogin,
          role: member.role,
          memberSince: member.createdAt,
          nbMessages,
          nbVocalMinutes,
          noteEcrit,
          noteVocal,
          noteFinale,
          appreciation: getAppreciation(noteFinale),
        };
      }

      const response = await fetch(`/api/discord-engagement/${selectedMonth}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataByMember,
          hasMessagesImport,
          hasVocalsImport,
          messagesImportedAt,
          vocalsImportedAt,
        }),
      });

      if (response.ok) {
        alert('✅ Données enregistrées avec succès');
        // Recharger les données
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`❌ Erreur: ${error.error || 'Impossible de sauvegarder'}`);
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  function getNoteBadgeColor(note: number): string {
    if (note === 0) return "bg-gray-800 text-gray-400 border-gray-700";
    if (note <= 2) return "bg-red-900/30 text-red-300 border-red-700";
    if (note === 3) return "bg-yellow-900/30 text-yellow-300 border-yellow-700";
    if (note === 4) return "bg-blue-900/30 text-blue-300 border-blue-700";
    return "bg-green-900/30 text-green-300 border-green-700";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff]"></div>
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
        <h1 className="text-4xl font-bold text-white mb-2">Discord — Engagement Communautaire</h1>
        <p className="text-gray-400">Évaluation de l'engagement Discord (messages + vocaux)</p>
      </div>

      {/* Boutons d'import */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowMessagesModal(true)}
          className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
        >
          📥 Importer messages
        </button>
        <button
          onClick={() => setShowVocalsModal(true)}
          className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
        >
          🎤 Importer vocaux
        </button>
      </div>

      {/* Sélecteur de mois */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-semibold text-gray-300">Mois :</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
        >
          {getMonthOptions().map(option => (
            <option key={option} value={option}>
              {formatMonthKey(option)}
            </option>
          ))}
        </select>
        {loadingData && <span className="text-sm text-gray-400">Chargement...</span>}
      </div>

      {/* Cartes de stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Score moyen</p>
          <p className="text-3xl font-bold text-[#9146ff]">{stats.avgScore}/5</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Membres scorés (>0)</p>
          <p className="text-3xl font-bold text-white">{stats.scoredCount}/{stats.totalMembers}</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Sources importées</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm text-white">
              Messages: {hasMessagesImport ? `✅ ${messagesImportedAt ? new Date(messagesImportedAt).toLocaleDateString('fr-FR') : ''}` : '❌'}
            </p>
            <p className="text-sm text-white">
              Vocaux: {hasVocalsImport ? `✅ ${vocalsImportedAt ? new Date(vocalsImportedAt).toLocaleDateString('fr-FR') : ''}` : '❌'}
            </p>
          </div>
        </div>
      </div>

      {/* Tableau principal */}
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0a0a0c] sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Membre</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Rôle</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Membre depuis</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Messages</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Vocaux (min)</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Note écrit /5</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Note vocal /5</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Note finale /5</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {membersWithEngagement.map((member) => (
                <tr key={member.discordId} className="border-t border-gray-800 hover:bg-[#0e0e10]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {member.avatar && (
                        <img src={member.avatar} alt="" className="w-8 h-8 rounded-full" />
                      )}
                      <span className="font-medium">{member.displayName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{member.role || "—"}</td>
                  <td className="px-4 py-3 text-gray-300">{formatMemberSince(member.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-300">{member.nbMessages || 0}</td>
                  <td className="px-4 py-3 text-gray-300">{member.nbVocalMinutes ? Math.round(member.nbVocalMinutes * 100) / 100 : 0}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getNoteBadgeColor(member.noteEcrit)}`}>
                      {member.noteEcrit}/5
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getNoteBadgeColor(member.noteVocal)}`}>
                      {member.noteVocal}/5
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getNoteBadgeColor(member.noteFinale)}`}>
                      {member.noteFinale}/5
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{member.appreciation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bouton Enregistrer */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !hasMessagesImport && !hasVocalsImport}
          className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>

      {/* Modals */}
      <DiscordEngagementImportModal
        isOpen={showMessagesModal}
        onClose={() => setShowMessagesModal(false)}
        onImport={handleImportMessages}
        title="Importer messages Discord"
        membersMap={membersMap}
      />
      <DiscordEngagementImportModal
        isOpen={showVocalsModal}
        onClose={() => setShowVocalsModal(false)}
        onImport={handleImportVocals}
        title="Importer vocaux Discord"
        membersMap={membersMap}
      />
    </div>
  );
}
