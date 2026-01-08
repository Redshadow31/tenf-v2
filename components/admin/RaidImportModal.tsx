"use client";

import { useState, useEffect } from "react";
import { normalizeHandle, normalizeHandleForDisplay, parseDate, DATE_PATTERN, RAID_PATTERN } from "@/lib/raidParserUtils";

interface DetectedRaid {
  raider: string; // Handle brut extrait
  target: string; // Handle brut extrait
  raiderNormalized: string; // Handle normalisé pour matching
  targetNormalized: string; // Handle normalisé pour matching
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
  status: 'ok' | 'unknown' | 'ignored'; // Statut du raid
  ignored: boolean; // Si le raid a été explicitement ignoré
}

interface Member {
  discordId: string;
  displayName: string;
  twitchLogin: string;
  discordUsername?: string;
  isActive?: boolean;
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
  const [ignoredRaids, setIgnoredRaids] = useState<Set<string>>(new Set()); // Set de "raiderNormalized|targetNormalized"
  const [showIgnored, setShowIgnored] = useState(false); // Filtre pour afficher les ignorés

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      loadIgnoredRaids();
    }
  }, [isOpen, month]);

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
        // Filtrer uniquement les membres actifs
        const members = (data.members || [])
          .filter((m: any) => m.isActive !== false) // Seulement membres actifs
          .map((m: any) => ({
            discordId: m.discordId || '',
            displayName: m.displayName || m.twitchLogin || '',
            twitchLogin: m.twitchLogin || '',
            discordUsername: m.discordUsername || m.discordName || '',
            isActive: m.isActive !== false,
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
            // Filtrer uniquement les membres actifs
            const members = (publicData.members || [])
              .filter((m: any) => m.isActive !== false) // Seulement membres actifs
              .map((m: any) => ({
                discordId: m.discordId || '',
                displayName: m.displayName || m.twitchLogin || '',
                twitchLogin: m.twitchLogin || '',
                discordUsername: m.discordUsername || '',
                isActive: m.isActive !== false,
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

  async function loadIgnoredRaids() {
    try {
      const response = await fetch(`/api/discord/raids/ignored?month=${month}`, {
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        const ignored = data.ignored || [];
        const ignoredSet = new Set<string>();
        
        ignored.forEach((r: any) => {
          ignoredSet.add(`${r.raiderNormalized}|${r.targetNormalized}`);
        });
        
        setIgnoredRaids(ignoredSet);
      }
    } catch (error) {
      console.error("[Raid Import] Erreur chargement raids ignorés:", error);
    }
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

  /**
   * Trouve un membre actif par handle normalisé
   */
  function findMemberByNormalizedHandle(normalizedHandle: string): Member | undefined {
    // Chercher d'abord par twitchLogin normalisé
    return allMembers.find(m => {
      if (!m.isActive) return false; // Seulement les membres actifs
      
      const normalizedTwitch = normalizeHandle(m.twitchLogin || '');
      const normalizedDiscord = normalizeHandle(m.discordUsername || '');
      const normalizedDisplay = normalizeHandle(m.displayName || '');
      
      return normalizedTwitch === normalizedHandle ||
             normalizedDiscord === normalizedHandle ||
             normalizedDisplay === normalizedHandle;
    });
  }

  function findMember(identifier: string): Member | undefined {
    const normalized = normalizeHandle(identifier);
    return findMemberByNormalizedHandle(normalized);
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

        // Ignorer les lignes parasites communes
        const lowerLine = trimmedLine.toLowerCase();
        if (lowerLine.match(/^(oups|transféré|transféré|n/a|^$)/i)) {
          continue;
        }

        // Vérifier si la ligne contient une date (format: DD/MM/YYYY HH:mm)
        const dateMatch = trimmedLine.match(DATE_PATTERN);
        if (dateMatch) {
          const parsedDate = parseDate(trimmedLine);
          if (parsedDate) {
            currentDate = parsedDate;
            continue; // Passer à la ligne suivante
          }
        }

        // Chercher TOUS les raids dans la ligne (supporte plusieurs raids par ligne)
        const matches = Array.from(trimmedLine.matchAll(RAID_PATTERN));
        
        for (const match of matches) {
          // Extraire raider et target bruts
          let raiderRaw = normalizeHandleForDisplay(match[1].trim());
          let targetRaw = normalizeHandleForDisplay(match[2].trim());

          // Supprimer le texte après le @ de la cible (ex: "sur Avatar", "^^", etc.)
          // On prend seulement jusqu'au premier espace après le @
          targetRaw = targetRaw.split(/\s+/)[0];

          if (!raiderRaw || !targetRaw || raiderRaw.length < 1 || targetRaw.length < 1) continue;
          if (raiderRaw.toLowerCase() === targetRaw.toLowerCase()) continue;

          // Normaliser pour le matching
          const raiderNormalized = normalizeHandle(raiderRaw);
          const targetNormalized = normalizeHandle(targetRaw);

          // Vérifier si la cible a un @ (si pas de @, c'est probablement une erreur de parsing)
          // On accepte quand même mais on le marquera comme "unknown" si pas trouvé dans la DB
          if (!match[2].includes('@')) {
            // Cible sans @ - on l'accepte quand même mais statut sera unknown si pas dans DB
          }

          // Utiliser la date actuelle si aucune date n'a été trouvée
          const raidDate = currentDate || new Date();
          
          // Vérifier si ce raid est déjà ignoré
          const ignoredKey = `${raiderNormalized}|${targetNormalized}`;
          const isIgnored = ignoredRaids.has(ignoredKey);
          
          // Trouver les membres correspondants (seulement membres actifs)
          const raiderMember = raiderNormalized ? findMemberByNormalizedHandle(raiderNormalized) : undefined;
          const targetMember = targetNormalized ? findMemberByNormalizedHandle(targetNormalized) : undefined;

          // Déterminer le statut
          let status: 'ok' | 'unknown' | 'ignored' = 'unknown';
          if (isIgnored) {
            status = 'ignored';
          } else if (raiderMember && targetMember) {
            status = 'ok';
          } else {
            status = 'unknown';
          }

          raids.push({
            raider: raiderRaw,
            target: targetRaw,
            raiderNormalized,
            targetNormalized,
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
            status,
            ignored: isIgnored,
          });

          // Initialiser les recherches
          const raidIndex = raids.length;
          setSearchQueries(prev => ({
            ...prev,
            [`${raidIndex}`]: {
              raider: raiderMember ? raiderMember.displayName : raiderRaw,
              target: targetMember ? targetMember.displayName : targetRaw,
            },
          }));
        }
      }

      if (raids.length === 0) {
        setError("Aucun raid détecté dans le texte. Formats supportés : @Raider a raid @Cible, @Raider à raid @Cible, @Raider raid @Cible, @Raider vers @Cible, @Raider chez @Cible");
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

  async function ignoreRaid(raidIndex: number) {
    const raid = detectedRaids[raidIndex];
    if (!raid) return;

    try {
      const response = await fetch('/api/discord/raids/ignored', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          raiderNormalized: raid.raiderNormalized,
          targetNormalized: raid.targetNormalized,
          rawText: raid.originalText,
        }),
      });

      if (response.ok) {
        // Mettre à jour le statut local
        const updatedRaids = [...detectedRaids];
        updatedRaids[raidIndex] = {
          ...raid,
          status: 'ignored',
          ignored: true,
        };
        setDetectedRaids(updatedRaids);

        // Ajouter à la liste locale des ignorés
        const ignoredKey = `${raid.raiderNormalized}|${raid.targetNormalized}`;
        setIgnoredRaids(prev => new Set(prev).add(ignoredKey));
      }
    } catch (error) {
      console.error("[Raid Import] Erreur lors de l'ignorance du raid:", error);
      alert('Erreur lors de l\'ignorance du raid');
    }
  }

  function selectMember(member: Member, field: 'raider' | 'target', raidIndex: number) {
    const raid = detectedRaids[raidIndex];
    if (!raid) return;

    const updatedRaids = [...detectedRaids];
    if (field === 'raider') {
      const newRaid = {
        ...raid,
        raiderMember: {
          discordId: member.discordId,
          displayName: member.displayName,
          twitchLogin: member.twitchLogin,
        },
      };
      // Mettre à jour le statut si maintenant OK
      newRaid.status = (newRaid.raiderMember && newRaid.targetMember) ? 'ok' : 'unknown';
      updatedRaids[raidIndex] = newRaid;
    } else {
      const newRaid = {
        ...raid,
        targetMember: {
          discordId: member.discordId,
          displayName: member.displayName,
          twitchLogin: member.twitchLogin,
        },
      };
      // Mettre à jour le statut si maintenant OK
      newRaid.status = (newRaid.raiderMember && newRaid.targetMember) ? 'ok' : 'unknown';
      updatedRaids[raidIndex] = newRaid;
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
      const newRaid = {
        ...raid,
        raiderMember: undefined,
      };
      newRaid.status = newRaid.targetMember ? 'unknown' : 'unknown';
      updatedRaids[raidIndex] = newRaid;
    } else {
      const newRaid = {
        ...raid,
        targetMember: undefined,
      };
      newRaid.status = newRaid.raiderMember ? 'unknown' : 'unknown';
      updatedRaids[raidIndex] = newRaid;
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

    // Filtrer les raids avec statut 'ok' (raider ET cible sont membres actifs)
    // OU ceux qui ont été manuellement sélectionnés par l'utilisateur
    const raidsToSave = detectedRaids.filter(r => {
      if (r.status === 'ignored' || r.ignored) return false; // Ne pas sauvegarder les ignorés
      // Uniquement les raids où raider ET cible sont membres actifs
      return r.status === 'ok' && r.raiderMember && r.targetMember;
    });

    if (raidsToSave.length === 0) {
      setError("Aucun raid valide à enregistrer. Seuls les raids où le raider ET la cible sont membres actifs peuvent être enregistrés.");
      return;
    }

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
            raider: r.raiderMember!.discordId || r.raiderMember!.twitchLogin,
            target: r.targetMember!.discordId || r.targetMember!.twitchLogin,
            date: r.date,
            countFrom: true,
            countTo: true,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      const unknownCount = detectedRaids.filter(r => r.status === 'unknown' && !r.ignored).length;
      const ignoredCount = detectedRaids.filter(r => r.status === 'ignored' || r.ignored).length;
      
      setSuccess(`${raidsToSave.length} raid(s) enregistré(s) avec succès !${unknownCount > 0 || ignoredCount > 0 ? ` (${unknownCount} inconnu(s), ${ignoredCount} ignoré(s))` : ''}`);
      
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">
                  Aperçu des raids détectés ({detectedRaids.filter(r => showIgnored || r.status !== 'ignored').length}/{detectedRaids.length})
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showIgnored}
                    onChange={(e) => setShowIgnored(e.target.checked)}
                    className="w-4 h-4 text-[#9146ff] rounded"
                  />
                  <span className="text-sm text-gray-300">Afficher ignorés</span>
                </label>
              </div>
              
              {/* Compteurs */}
              <div className="flex gap-4 mb-3 text-xs">
                <span className="text-green-400">✅ OK: {detectedRaids.filter(r => r.status === 'ok').length}</span>
                <span className="text-yellow-400">⚠️ Inconnu: {detectedRaids.filter(r => r.status === 'unknown' && !r.ignored).length}</span>
                <span className="text-gray-400">🚫 Ignoré: {detectedRaids.filter(r => r.status === 'ignored' || r.ignored).length}</span>
              </div>

              <div className="bg-[#0e0e10] border border-gray-700 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800/50 sticky top-0">
                      <tr>
                        <th className="text-left py-2 px-3 text-gray-300 font-semibold text-xs">Ligne</th>
                        <th className="text-left py-2 px-3 text-gray-300 font-semibold text-xs">Date/Heure</th>
                        <th className="text-left py-2 px-3 text-gray-300 font-semibold text-xs">Raider</th>
                        <th className="text-left py-2 px-3 text-gray-300 font-semibold text-xs">Cible</th>
                        <th className="text-left py-2 px-3 text-gray-300 font-semibold text-xs">Statut</th>
                        <th className="text-left py-2 px-3 text-gray-300 font-semibold text-xs">Actions</th>
                        <th className="text-left py-2 px-3 text-gray-300 font-semibold text-xs">Texte original</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detectedRaids
                        .map((raid, originalIdx) => {
                          // Ignorer les raids ignorés si le filtre est désactivé
                          if (!showIgnored && raid.status === 'ignored') {
                            return null;
                          }
                          
                          return (
                            <tr
                              key={originalIdx}
                          const statusColor = {
                            'ok': 'text-green-400',
                            'unknown': 'text-yellow-400',
                            'ignored': 'text-gray-400',
                          }[raid.status];
                          
                          const statusText = {
                            'ok': '✅ OK',
                            'unknown': '⚠️ Inconnu',
                            'ignored': '🚫 Ignoré',
                          }[raid.status];
                          
                          return (
                            <tr
                              key={originalIdx}
                              className={`border-t border-gray-700 hover:bg-gray-800/30 ${
                                raid.status === 'ignored' ? "bg-gray-800/50 opacity-60" : 
                                raid.status === 'unknown' ? "bg-yellow-900/10" : ""
                              }`}
                            >
                              <td className="py-2 px-3 text-gray-400 text-xs">{raid.lineNumber}</td>
                              <td className="py-2 px-3 text-gray-400 text-xs">{formatDate(raid.date)}</td>
                              <td className="py-2 px-3">
                                {raid.status === 'ignored' ? (
                                  <span className="text-gray-500 text-xs">{raid.raider}</span>
                                ) : (
                                  renderMemberSelector('raider', originalIdx, raid)
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {raid.status === 'ignored' ? (
                                  <span className="text-gray-500 text-xs">{raid.target}</span>
                                ) : (
                                  renderMemberSelector('target', originalIdx, raid)
                                )}
                              </td>
                              <td className="py-2 px-3">
                                <span className={`text-xs font-semibold ${statusColor}`}>
                                  {statusText}
                                </span>
                                {raid.status === 'unknown' && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {!raid.raiderMember && <div>Raider non trouvé</div>}
                                    {!raid.targetMember && <div>Cible non trouvée</div>}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {raid.status === 'unknown' && !raid.ignored && (
                                  <button
                                    onClick={() => ignoreRaid(originalIdx)}
                                    disabled={saving}
                                    className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded transition-colors disabled:opacity-50"
                                    title="Ignorer ce raid (ne sera plus affiché lors des prochains imports)"
                                  >
                                    Ignorer
                                  </button>
                                )}
                              </td>
                              <td className="py-2 px-3 text-gray-400 text-xs font-mono truncate max-w-xs" title={raid.originalText}>
                                {raid.originalText}
                              </td>
                            </tr>
                          );
                        }).filter(Boolean)}
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
