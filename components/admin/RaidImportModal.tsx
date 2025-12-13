"use client";

import { useState, useEffect } from "react";

interface DetectedRaid {
  raider: string;
  target: string;
  lineNumber: number;
  originalText: string;
  date: string; // ISO timestamp
  raiderMember?: {
    discordId: string;
    displayName: string;
    twitchLogin: string;
  };
  targetMember?: {
    discordId: string;
    displayName: string;
    twitchLogin: string;
  };
  ignoreRaider: boolean; // Ignorer le raider (ne pas compter le raid fait)
  ignoreTarget: boolean; // Ignorer la cible (ne pas compter le raid reçu)
  obsolete?: boolean; // Marquer comme obsolète (ignoré complètement, ne sera pas enregistré)
}

interface Member {
  discordId: string;
  displayName: string;
  twitchLogin: string;
  discordUsername?: string;
}

interface RaidImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: string;
  onImportComplete: () => void;
  getMemberDisplayName: (twitchLogin: string) => string;
}

export default function RaidImportModal({
  isOpen,
  onClose,
  month,
  onImportComplete,
  getMemberDisplayName,
}: RaidImportModalProps) {
  const [inputText, setInputText] = useState("");
  const [detectedRaids, setDetectedRaids] = useState<DetectedRaid[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [searchQueries, setSearchQueries] = useState<Record<string, { raider: string; target: string }>>({});
  const [showResults, setShowResults] = useState<Record<string, { raider: boolean; target: boolean }>>({});

  // Regex pour détecter les dates : DD/MM/YYYY HH:mm
  const DATE_PATTERN = /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/;

  // Regex pour détecter les raids : @Raider a raid @Cible ou @Raider à raid @Cible
  // Capture les pseudos avec espaces, Unicode, et ignore les annotations entre parenthèses
  const RAID_PATTERN = /@(.+?)\s+(?:a|à)\s+raid\s+@([^\n(]+)/giu;
  
  // Fonction pour nettoyer un pseudo en supprimant les annotations entre parenthèses
  function cleanPseudo(pseudo: string): string {
    // Supprimer le contenu entre parenthèses (y compris les parenthèses)
    return pseudo.replace(/\s*\([^)]*\)/g, '').trim();
  }

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen]);

  async function loadMembers() {
    try {
      setMembersLoading(true);
      const response = await fetch("/api/admin/members", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const members = (data.members || []).map((m: any) => ({
          discordId: m.discordId || '',
          displayName: m.displayName || m.twitchLogin || '',
          twitchLogin: m.twitchLogin || '',
          discordUsername: m.discordUsername || m.discordName || '',
        }));
        setAllMembers(members);
      } else {
        // Fallback: essayer l'API publique
        try {
          const publicResponse = await fetch("/api/members/public", {
            cache: 'no-store',
          });
          if (publicResponse.ok) {
            const publicData = await publicResponse.json();
            const members = (publicData.members || []).map((m: any) => ({
              discordId: m.discordId || '',
              displayName: m.displayName || m.twitchLogin || '',
              twitchLogin: m.twitchLogin || '',
              discordUsername: m.discordUsername || '',
            }));
            setAllMembers(members);
          }
        } catch (err) {
          console.error("[Raid Import] Erreur fallback membres:", err);
        }
      }
    } catch (error) {
      console.error("[Raid Import] Erreur lors du chargement des membres:", error);
    } finally {
      setMembersLoading(false);
    }
  }

  function parseDate(dateStr: string): Date | null {
    const match = dateStr.match(DATE_PATTERN);
    if (!match) return null;
    
    const [, day, month, year, hour, minute] = match;
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    );
    
    // Vérifier que la date est valide
    if (isNaN(date.getTime())) return null;
    
    return date;
  }

  function normalize(text: string | undefined | null): string {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function filterMembers(query: string): Member[] {
    if (!query || query.trim().length === 0) {
      return [];
    }
    
    const normalizedQuery = normalize(query);
    
    return allMembers.filter((member) => {
      const normalizedDisplayName = normalize(member.displayName);
      const normalizedTwitchLogin = normalize(member.twitchLogin);
      const normalizedDiscordUsername = normalize(member.discordUsername);
      const discordId = member.discordId || "";
      
      return (
        normalizedDisplayName.includes(normalizedQuery) ||
        normalizedTwitchLogin.includes(normalizedQuery) ||
        normalizedDiscordUsername.includes(normalizedQuery) ||
        (discordId && discordId.toLowerCase().includes(query.toLowerCase()))
      );
    });
  }

  function findMember(identifier: string): Member | undefined {
    return allMembers.find(m => 
      m.twitchLogin?.toLowerCase() === identifier.toLowerCase() ||
      m.discordId === identifier ||
      m.displayName?.toLowerCase() === identifier.toLowerCase()
    );
  }

  function analyzeText() {
    if (!inputText.trim()) {
      setError("Veuillez coller du texte à analyser");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setDetectedRaids([]);
    setSearchQueries({});
    setShowResults({});

    try {
      const lines = inputText.split("\n");
      const raids: DetectedRaid[] = [];
      let lineNumber = 0;
      let currentDate: Date | null = null;

      for (const line of lines) {
        lineNumber++;
        const trimmedLine = line.trim();
        if (!trimmedLine) continue; // Ignorer les lignes vides

        // Vérifier si la ligne contient une date
        const dateMatch = trimmedLine.match(DATE_PATTERN);
        if (dateMatch) {
          const parsedDate = parseDate(trimmedLine);
          if (parsedDate) {
            currentDate = parsedDate;
            continue; // Passer à la ligne suivante
          }
        }

        // Chercher les raids dans la ligne
        RAID_PATTERN.lastIndex = 0;
        let match;
        while ((match = RAID_PATTERN.exec(trimmedLine)) !== null) {
          // Nettoyer les pseudos capturés en supprimant les annotations entre parenthèses
          let raider = cleanPseudo(match[1].trim());
          let target = cleanPseudo(match[2].trim());

          if (!raider || !target || raider.length < 1 || target.length < 1) continue;
          if (raider.toLowerCase() === target.toLowerCase()) continue;

          // Utiliser la date actuelle si aucune date n'a été trouvée
          const raidDate = currentDate || new Date();
          
          // Trouver les membres correspondants
          const raiderMember = findMember(raider);
          const targetMember = findMember(target);

          raids.push({
            raider,
            target,
            lineNumber,
            originalText: trimmedLine,
            date: raidDate.toISOString(),
            raiderMember: raiderMember ? {
              discordId: raiderMember.discordId,
              displayName: raiderMember.displayName,
              twitchLogin: raiderMember.twitchLogin,
            } : undefined,
            targetMember: targetMember ? {
              discordId: targetMember.discordId,
              displayName: targetMember.displayName,
              twitchLogin: targetMember.twitchLogin,
            } : undefined,
            // Par défaut : rien n'est ignoré (tout est compté)
            ignoreRaider: false,
            ignoreTarget: false,
            // Marquer comme obsolète si aucun des deux membres n'est reconnu
            obsolete: !raiderMember && !targetMember,
          });

          // Initialiser les recherches (utiliser l'index réel)
          const raidIndex = raids.length;
          setSearchQueries(prev => ({
            ...prev,
            [`${raidIndex}`]: {
              raider: raiderMember ? raiderMember.displayName : raider,
              target: targetMember ? targetMember.displayName : target,
            },
          }));
        }
      }

      if (raids.length === 0) {
        setError("Aucun raid détecté dans le texte. Format attendu : @Raider a raid @Cible");
      } else {
        setDetectedRaids(raids);
        setError(null);
      }
    } catch (err) {
      setError(`Erreur lors de l'analyse : ${err instanceof Error ? err.message : "Erreur inconnue"}`);
    } finally {
      setAnalyzing(false);
    }
  }

  function selectMember(member: Member, field: 'raider' | 'target', raidIndex: number) {
    const raid = detectedRaids[raidIndex];
    if (!raid) return;

    const updatedRaids = [...detectedRaids];
    if (field === 'raider') {
      updatedRaids[raidIndex] = {
        ...raid,
        raiderMember: {
          discordId: member.discordId,
          displayName: member.displayName,
          twitchLogin: member.twitchLogin,
        },
        // Ne pas ignorer le raider quand un membre est sélectionné
        ignoreRaider: false,
      };
    } else {
      updatedRaids[raidIndex] = {
        ...raid,
        targetMember: {
          discordId: member.discordId,
          displayName: member.displayName,
          twitchLogin: member.twitchLogin,
        },
        // Ne pas ignorer la cible quand un membre est sélectionné
        ignoreTarget: false,
      };
    }
    setDetectedRaids(updatedRaids);

    setSearchQueries(prev => ({
      ...prev,
      [`${raidIndex}`]: {
        ...prev[`${raidIndex}`],
        [field]: member.displayName || member.twitchLogin,
      },
    }));

    setShowResults(prev => ({
      ...prev,
      [`${raidIndex}`]: {
        ...prev[`${raidIndex}`],
        [field]: false,
      },
    }));
  }

  function clearMember(field: 'raider' | 'target', raidIndex: number) {
    const raid = detectedRaids[raidIndex];
    if (!raid) return;

    const updatedRaids = [...detectedRaids];
    if (field === 'raider') {
      updatedRaids[raidIndex] = {
        ...raid,
        raiderMember: undefined,
        // Ignorer le raider quand le membre est supprimé
        ignoreRaider: true,
      };
    } else {
      updatedRaids[raidIndex] = {
        ...raid,
        targetMember: undefined,
        // Ignorer la cible quand le membre est supprimé
        ignoreTarget: true,
      };
    }
    setDetectedRaids(updatedRaids);

    setSearchQueries(prev => ({
      ...prev,
      [`${raidIndex}`]: {
        ...prev[`${raidIndex}`],
        [field]: field === 'raider' ? raid.raider : raid.target,
      },
    }));
  }

  function renderMemberSelector(field: 'raider' | 'target', raidIndex: number, raid: DetectedRaid) {
    const searchQuery = searchQueries[`${raidIndex}`]?.[field] || '';
    const showResult = showResults[`${raidIndex}`]?.[field] || false;
    const selectedMember = field === 'raider' ? raid.raiderMember : raid.targetMember;
    const fieldLabel = field === 'raider' ? 'Raider' : 'Cible';
    const placeholder = field === 'raider' ? raid.raider : raid.target;

    return (
      <div className="relative">
        <label className="block text-xs font-semibold text-gray-300 mb-1">
          {fieldLabel}
        </label>
        <div className="flex items-center gap-1">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => {
                const query = e.target.value;
                setSearchQueries(prev => ({
                  ...prev,
                  [raidIndex]: {
                    ...prev[raidIndex],
                    [field]: query,
                  },
                }));
                
                if (query.trim().length > 0) {
                  setShowResults(prev => ({
                    ...prev,
                    [raidIndex]: {
                      ...prev[raidIndex],
                      [field]: true,
                    },
                  }));
                } else {
                  clearMember(field, raidIndex);
                }
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) {
                  setShowResults(prev => ({
                    ...prev,
                    [raidIndex]: {
                      ...prev[raidIndex],
                      [field]: true,
                    },
                  }));
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowResults(prev => ({
                    ...prev,
                    [raidIndex]: {
                      ...prev[raidIndex],
                      [field]: false,
                    },
                  }));
                }, 200);
              }}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#9146ff]"
              disabled={analyzing || saving || membersLoading}
            />
            {showResult && (() => {
              const results = filterMembers(searchQuery);
              return results.length > 0 ? (
                <div className="absolute z-10 w-full mt-1 bg-[#1a1a1d] border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {results.map((member) => (
                    <button
                      key={member.discordId}
                      type="button"
                      onClick={() => selectMember(member, field, raidIndex)}
                      className="w-full text-left px-3 py-2 hover:bg-[#0e0e10] text-xs transition-colors"
                    >
                      <div className="font-semibold text-white">{member.displayName}</div>
                      <div className="text-gray-400 text-xs">
                        {member.twitchLogin} {member.discordUsername && `• ${member.discordUsername}`}
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim().length > 0 ? (
                <div className="absolute z-10 w-full mt-1 bg-[#1a1a1d] border border-gray-700 rounded-lg shadow-lg p-2">
                  <div className="text-gray-400 text-xs text-center">Aucun membre trouvé</div>
                </div>
              ) : null;
            })()}
          </div>
          {selectedMember && (
            <button
              onClick={() => clearMember(field, raidIndex)}
              className="bg-red-600/20 hover:bg-red-600/30 text-red-300 px-2 py-1 rounded text-xs transition-colors"
              title="Supprimer la sélection"
            >
              ✕
            </button>
          )}
        </div>
        {selectedMember && (
          <div className="mt-1 text-xs text-green-400">
            ✅ {selectedMember.displayName}
          </div>
        )}
      </div>
    );
  }

  function formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  async function saveRaids() {
    if (detectedRaids.length === 0) {
      setError("Aucun raid à enregistrer");
      return;
    }

    // Filtrer les raids qui ne sont pas obsolètes et qui ont au moins un côté non ignoré
    // Les raids obsolètes ou avec les deux côtés ignorés ne seront pas enregistrés
    const raidsToSave = detectedRaids.filter(r => 
      !r.obsolete && (!r.ignoreRaider || !r.ignoreTarget)
    );
    
    // Ne pas bloquer la validation même si tous les raids sont ignorés
    // L'utilisateur peut vouloir simplement nettoyer la liste

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/discord/raids/import-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month,
          raids: raidsToSave.map(r => ({
              // Utiliser le membre sélectionné (celui avec la coche verte) pour l'enregistrement
              // Ne pas inclure si ignoré ou si aucun membre n'est sélectionné
              raider: !r.ignoreRaider && r.raiderMember ? (r.raiderMember.discordId || r.raiderMember.twitchLogin) : null,
              target: !r.ignoreTarget && r.targetMember ? (r.targetMember.discordId || r.targetMember.twitchLogin) : null,
              date: r.date,
              countFrom: !r.ignoreRaider && !!r.raiderMember,
              countTo: !r.ignoreTarget && !!r.targetMember,
            })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      const obsoleteCount = detectedRaids.filter(r => r.obsolete).length;
      const fullyIgnoredCount = detectedRaids.filter(r => !r.obsolete && r.ignoreRaider && r.ignoreTarget).length;
      const partialIgnoredCount = detectedRaids.filter(r => !r.obsolete && (r.ignoreRaider || r.ignoreTarget) && !(r.ignoreRaider && r.ignoreTarget)).length;
      const totalIgnored = obsoleteCount + fullyIgnoredCount;
      setSuccess(`${raidsToSave.length} raid(s) enregistré(s) avec succès !${totalIgnored > 0 ? ` (${obsoleteCount > 0 ? `${obsoleteCount} obsolète(s), ` : ''}${fullyIgnoredCount > 0 ? `${fullyIgnoredCount} complètement ignoré(s), ` : ''}${partialIgnoredCount > 0 ? `${partialIgnoredCount} partiellement ignoré(s)` : ''})` : ''}`);
      
      setTimeout(() => {
        setInputText("");
        setDetectedRaids([]);
        setSearchQueries({});
        setShowResults({});
        setSuccess(null);
        onImportComplete();
        onClose();
      }, 2000);
    } catch (err) {
      setError(`Erreur : ${err instanceof Error ? err.message : "Erreur inconnue"}`);
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (!saving) {
      setInputText("");
      setDetectedRaids([]);
      setSearchQueries({});
      setShowResults({});
      setError(null);
      setSuccess(null);
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Importer des raids manuellement</h2>
          <button
            onClick={handleClose}
            disabled={saving}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Instructions */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <p className="text-sm text-blue-300 mb-2">
              <strong>Format attendu :</strong>
            </p>
            <ul className="text-xs text-blue-400 list-disc list-inside space-y-1">
              <li>Dates : <code className="bg-blue-900/50 px-1 rounded">DD/MM/YYYY HH:mm</code> (optionnel, définit le contexte temporel)</li>
              <li>Raids : <code className="bg-blue-900/50 px-1 rounded">@Raider a raid @Cible</code> ou <code className="bg-blue-900/50 px-1 rounded">@Raider à raid @Cible</code></li>
              <li>Les dates s'appliquent à tous les raids suivants jusqu'à la prochaine date</li>
            </ul>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Messages à analyser :
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="03/12/2025 13:25&#10;@membre1 a raid @membre2&#10;@membre3 à raid @membre4&#10;04/12/2025 10:00&#10;@membre5 a raid @membre6"
              className="w-full h-48 bg-[#0e0e10] border border-gray-700 rounded-lg p-4 text-white font-mono text-sm focus:outline-none focus:border-[#9146ff] resize-none"
              disabled={analyzing || saving}
            />
          </div>

          {/* Bouton Analyser */}
          <div className="flex justify-end">
            <button
              onClick={analyzeText}
              disabled={analyzing || saving || !inputText.trim()}
              className="bg-[#9146ff] hover:bg-[#5a32b4] text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? "Analyse en cours..." : "🔍 Analyser"}
            </button>
          </div>

          {/* Messages d'erreur/succès */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          )}

          {/* Aperçu des raids détectés */}
          {detectedRaids.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Aperçu des raids détectés ({detectedRaids.length})
              </h3>
              <div className="bg-[#0e0e10] border border-gray-700 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800/50 sticky top-0">
                      <tr>
                        <th className="text-left py-2 px-3 text-gray-300 font-semibold text-xs">Ligne</th>
                        <th className="text-left py-2 px-3 text-gray-300 font-semibold text-xs">Date/Heure</th>
                        <th className="text-left py-2 px-3 text-gray-300 font-semibold text-xs">Raider</th>
                        <th className="text-left py-2 px-3 text-gray-300 font-semibold text-xs">Cible</th>
                        <th className="text-left py-2 px-3 text-gray-300 font-semibold text-xs">Résultats</th>
                        <th className="text-left py-2 px-3 text-gray-300 font-semibold text-xs">Texte original</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detectedRaids.map((raid, idx) => {
                        const raiderOk = !!raid.raiderMember;
                        const targetOk = !!raid.targetMember;
                        const statusOk = raiderOk && targetOk;
                        
                        return (
                          <tr
                            key={idx}
                            className={`border-t border-gray-700 hover:bg-gray-800/30 ${
                              raid.obsolete ? "bg-gray-800/50 opacity-60" : !statusOk ? "bg-yellow-900/10" : ""
                            }`}
                          >
                            <td className="py-2 px-3 text-gray-400 text-xs">{raid.lineNumber}</td>
                            <td className="py-2 px-3 text-gray-400 text-xs">{formatDate(raid.date)}</td>
                            <td className="py-2 px-3">
                              {renderMemberSelector('raider', idx, raid)}
                            </td>
                            <td className="py-2 px-3">
                              {renderMemberSelector('target', idx, raid)}
                            </td>
                            <td className="py-2 px-3">
                              <div className="space-y-2">
                                {/* Ligne 1: Raid fait */}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">Raid fait :</span>
                                  <span className="text-xs text-white font-medium">
                                    {raid.raiderMember ? raid.raiderMember.displayName : (raid.ignoreRaider ? <span className="text-gray-500 italic">Ignoré</span> : raid.raider)}
                                  </span>
                                  <label className="flex items-center cursor-pointer ml-auto">
                                    <input
                                      type="checkbox"
                                      checked={raid.ignoreRaider || false}
                                      onChange={(e) => {
                                        const updatedRaids = [...detectedRaids];
                                        updatedRaids[idx] = { ...raid, ignoreRaider: e.target.checked };
                                        setDetectedRaids(updatedRaids);
                                      }}
                                      disabled={saving || raid.obsolete}
                                      className="w-3 h-3 text-orange-500 rounded focus:ring-orange-500"
                                      title="Ignorer ce raid fait"
                                    />
                                    <span className="text-xs text-gray-500 ml-1">Ignorer</span>
                                  </label>
                                </div>
                                {/* Ligne 2: Raid reçu */}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">Raid reçu :</span>
                                  <span className="text-xs text-white font-medium">
                                    {raid.targetMember ? raid.targetMember.displayName : (raid.ignoreTarget ? <span className="text-gray-500 italic">Ignoré</span> : raid.target)}
                                  </span>
                                  <label className="flex items-center cursor-pointer ml-auto">
                                    <input
                                      type="checkbox"
                                      checked={raid.ignoreTarget || false}
                                      onChange={(e) => {
                                        const updatedRaids = [...detectedRaids];
                                        updatedRaids[idx] = { ...raid, ignoreTarget: e.target.checked };
                                        setDetectedRaids(updatedRaids);
                                      }}
                                      disabled={saving || raid.obsolete}
                                      className="w-3 h-3 text-orange-500 rounded focus:ring-orange-500"
                                      title="Ignorer ce raid reçu"
                                    />
                                    <span className="text-xs text-gray-500 ml-1">Ignorer</span>
                                  </label>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-gray-400 text-xs font-mono truncate max-w-xs">
                              {raid.originalText}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pied de page avec boutons */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={handleClose}
            disabled={saving}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={saveRaids}
            disabled={saving || detectedRaids.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Enregistrement..." : `Enregistrer ${detectedRaids.length > 0 ? `(${detectedRaids.length})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
