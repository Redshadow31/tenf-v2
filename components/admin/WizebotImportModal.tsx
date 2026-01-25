"use client";

import { useState, useEffect } from "react";

interface ParsedLine {
  rawLine: string;
  login: string;
  normalizedLogin: string;
  followedAt?: string; // ISO date string
  matchedMember?: {
    twitchLogin: string;
    displayName: string;
  };
  status: 'matched' | 'unmatched';
}

interface WizebotImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthKey: string;
  staffSlug: string;
  onImportComplete: () => void;
}

export default function WizebotImportModal({
  isOpen,
  onClose,
  monthKey,
  staffSlug,
  onImportComplete,
}: WizebotImportModalProps) {
  const [rawText, setRawText] = useState("");
  const [parsedLines, setParsedLines] = useState<ParsedLine[]>([]);
  const [members, setMembers] = useState<Array<{ twitchLogin: string; displayName: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [manualMatches, setManualMatches] = useState<Record<string, string>>({}); // normalizedLogin -> twitchLogin
  const [changes, setChanges] = useState<Array<{
    twitchLogin: string;
    displayName: string;
    currentValue: boolean | null;
    newValue: boolean;
    action: 'update' | 'add';
  }>>([]);
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());
  const [showChanges, setShowChanges] = useState(false);

  // Charger les membres au montage
  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen]);

  async function loadMembers() {
    try {
      const response = await fetch('/api/members/public', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        const activeMembers = (data.members || [])
          .filter((m: any) => m.isActive !== false)
          .map((m: any) => ({
            twitchLogin: m.twitchLogin || '',
            displayName: m.displayName || m.twitchLogin || '',
          }))
          .filter((m: any) => m.twitchLogin);
        setMembers(activeMembers);
      }
    } catch (error) {
      console.error("Erreur chargement membres:", error);
    }
  }

  function normalizeLogin(login: string): string {
    return login.trim().toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, ''); // Retirer caractères invisibles
  }

  function parseDate(dateStr: string): string | undefined {
    // Format attendu: DD/MM/YYYY HH:mm:ss
    const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, day, month, year, hour, minute, second] = match;
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
      );
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    return undefined;
  }

  function parseWizebotText(text: string): ParsedLine[] {
    const lines = text.split('\n').filter(line => line.trim());
    const parsed: ParsedLine[] = [];
    const memberMap = new Map<string, { twitchLogin: string; displayName: string }>();
    
    members.forEach(m => {
      memberMap.set(normalizeLogin(m.twitchLogin), m);
    });

    for (const line of lines) {
      // Séparer par tabulations ou espaces multiples
      const parts = line.split(/\t|\s{2,}/).filter(p => p.trim());
      if (parts.length === 0) continue;

      const rawLogin = parts[0].trim();
      const normalizedLogin = normalizeLogin(rawLogin);
      
      // Chercher une date dans le reste de la ligne
      let followedAt: string | undefined;
      for (let i = 1; i < parts.length; i++) {
        const dateMatch = parseDate(parts[i]);
        if (dateMatch) {
          followedAt = dateMatch;
          break;
        }
      }

      // Chercher un match avec les membres TENF
      const matchedMember = memberMap.get(normalizedLogin);

      parsed.push({
        rawLine: line,
        login: rawLogin,
        normalizedLogin,
        followedAt,
        matchedMember: matchedMember || undefined,
        status: matchedMember ? 'matched' : 'unmatched',
      });
    }

    return parsed;
  }

  async function handleAnalyze() {
    if (!rawText.trim()) {
      alert("Veuillez coller la liste Wizebot");
      return;
    }

    setAnalyzing(true);
    try {
      const parsed = parseWizebotText(rawText);
      setParsedLines(parsed);
    } catch (error) {
      console.error("Erreur analyse:", error);
      alert("Erreur lors de l'analyse du texte");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleAnalyzeAndDetectChanges() {
    if (parsedLines.length === 0) {
      alert("Aucune ligne à analyser. Veuillez d'abord analyser.");
      return;
    }

    setAnalyzing(true);
    try {
      // Préparer les données d'import
      const matchedLines = parsedLines.filter(line => 
        line.status === 'matched' || manualMatches[line.normalizedLogin]
      );

      // Récupérer les données actuelles
      const validationResponse = await fetch(`/api/follow/validations/${monthKey}/${staffSlug}`, {
        cache: 'no-store',
      });
      
      let currentMembers: any[] = [];
      
      if (validationResponse.ok) {
        const validationData = await validationResponse.json();
        if (validationData.validation?.members) {
          currentMembers = validationData.validation.members;
        }
      }

      // Si pas de validation existante, charger les membres depuis l'API publique
      if (currentMembers.length === 0) {
        const membersResponse = await fetch('/api/members/public', { cache: 'no-store' });
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          currentMembers = (membersData.members || [])
            .filter((m: any) => m.isActive !== false)
            .map((m: any) => ({
              twitchLogin: m.twitchLogin,
              displayName: m.displayName || m.twitchLogin,
              role: m.role,
              status: 'unknown' as const,
              jeSuis: false,
              meSuit: null,
            }));
        }
      }

      // Détecter les changements
      const detectedChanges: Array<{
        twitchLogin: string;
        displayName: string;
        currentValue: boolean | null;
        newValue: boolean;
        action: 'update' | 'add';
      }> = [];

      currentMembers.forEach((m: any) => {
        const normalizedLogin = normalizeLogin(m.twitchLogin);
        
        // Chercher si ce membre est dans les lignes importées
        const matchedLine = matchedLines.find(line => {
          if (line.matchedMember && normalizeLogin(line.matchedMember.twitchLogin) === normalizedLogin) {
            return true;
          }
          if (manualMatches[line.normalizedLogin] && normalizeLogin(manualMatches[line.normalizedLogin]) === normalizedLogin) {
            return true;
          }
          return false;
        });

        if (matchedLine) {
          const currentValue = m.meSuit ?? null;
          const newValue = true;
          
          // Si la valeur change, ajouter au changement
          if (currentValue !== newValue) {
            detectedChanges.push({
              twitchLogin: m.twitchLogin,
              displayName: m.displayName || m.twitchLogin,
              currentValue,
              newValue,
              action: currentValue !== null ? 'update' : 'add',
            });
          }
        }
      });

      // Si des changements sont détectés, les afficher pour confirmation
      if (detectedChanges.length > 0) {
        setChanges(detectedChanges);
        setSelectedChanges(new Set(detectedChanges.map(c => c.twitchLogin)));
        setShowChanges(true);
      } else {
        // Si aucun changement, appliquer directement
        await handleApplyDirect();
      }
    } catch (error) {
      console.error("Erreur détection changements:", error);
      alert("Erreur lors de la détection des changements");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleApplyDirect() {
    if (parsedLines.length === 0) {
      alert("Aucune ligne à appliquer. Veuillez d'abord analyser.");
      return;
    }

    setApplying(true);
    try {
      // Préparer les données d'import
      const matchedLines = parsedLines.filter(line => 
        line.status === 'matched' || manualMatches[line.normalizedLogin]
      );

      // Récupérer les données actuelles
      const validationResponse = await fetch(`/api/follow/validations/${monthKey}/${staffSlug}`, {
        cache: 'no-store',
      });
      
      let currentMembers: any[] = [];
      let moderatorComments = '';
      
      if (validationResponse.ok) {
        const validationData = await validationResponse.json();
        if (validationData.validation?.members) {
          currentMembers = validationData.validation.members;
          moderatorComments = validationData.validation.moderatorComments || '';
        }
      }

      // Si pas de validation existante, charger les membres depuis l'API publique
      if (currentMembers.length === 0) {
        const membersResponse = await fetch('/api/members/public', { cache: 'no-store' });
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          currentMembers = (membersData.members || [])
            .filter((m: any) => m.isActive !== false)
            .map((m: any) => ({
              twitchLogin: m.twitchLogin,
              displayName: m.displayName || m.twitchLogin,
              role: m.role,
              status: 'unknown' as const,
              jeSuis: false,
              meSuit: null,
            }));
        }
      }

      // Appliquer uniquement les changements sélectionnés (si showChanges est true)
      let updatedMembers: any[];
      
      if (showChanges && changes.length > 0) {
        const changesToApply = changes.filter(c => selectedChanges.has(c.twitchLogin));
        
        updatedMembers = currentMembers.map((m: any) => {
          const normalizedLogin = normalizeLogin(m.twitchLogin);
          const change = changesToApply.find(c => normalizeLogin(c.twitchLogin) === normalizedLogin);
          
          if (change) {
            return {
              ...m,
              meSuit: change.newValue,
            };
          }
          
          return m;
        });
      } else {
        // Appliquer tous les changements (comportement original)
        updatedMembers = currentMembers.map((m: any) => {
          const normalizedLogin = normalizeLogin(m.twitchLogin);
          const matchedLine = matchedLines.find(line => {
            if (line.matchedMember && normalizeLogin(line.matchedMember.twitchLogin) === normalizedLogin) {
              return true;
            }
            if (manualMatches[line.normalizedLogin] && normalizeLogin(manualMatches[line.normalizedLogin]) === normalizedLogin) {
              return true;
            }
            return false;
          });

          if (matchedLine) {
            return {
              ...m,
              meSuit: true,
            };
          }
          
          return m;
        });
      }

      // Sauvegarder via l'API
      const saveResponse = await fetch(`/api/follow/validations/${monthKey}/${staffSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          members: updatedMembers,
          moderatorComments,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      // Enregistrer les événements dans l'historique
      const importLog = {
        staffKey: staffSlug,
        month: monthKey,
        importedAt: new Date().toISOString(),
        totalLines: parsedLines.length,
        matchedCount: matchedLines.length,
        unmatchedCount: parsedLines.length - matchedLines.length,
      };

      // Enregistrer un événement pour chaque membre mis à jour
      for (const matchedLine of matchedLines) {
        const memberLogin = matchedLine.matchedMember?.twitchLogin || manualMatches[matchedLine.normalizedLogin];
        if (memberLogin) {
          try {
            const eventResponse = await fetch('/api/admin/members/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                memberId: memberLogin,
                type: 'follow_import_wizebot',
                source: 'manual',
                actor: 'admin', // Sera remplacé par l'ID admin côté serveur
                payload: {
                  staff: staffSlug,
                  source: 'wizebot',
                  followedAt: matchedLine.followedAt,
                  importLog,
                },
              }),
            });
            if (!eventResponse.ok) {
              console.warn(`Événement non enregistré pour ${memberLogin}`);
            }
          } catch (error) {
            console.error(`Erreur enregistrement événement pour ${memberLogin}:`, error);
          }
        }
      }

      const appliedCount = showChanges ? changes.filter(c => selectedChanges.has(c.twitchLogin)).length : matchedLines.length;
      alert(`Import réussi : ${appliedCount} changement(s) appliqué(s)`);
      onImportComplete();
      setShowChanges(false);
      setChanges([]);
      setSelectedChanges(new Set());
      setRawText("");
      setParsedLines([]);
      setManualMatches({});
    } catch (error) {
      console.error("Erreur application import:", error);
      alert("Erreur lors de l'application de l'import");
    } finally {
      setApplying(false);
    }
  }

  function handleManualMatch(normalizedLogin: string, twitchLogin: string) {
    setManualMatches(prev => ({
      ...prev,
      [normalizedLogin]: twitchLogin,
    }));
    
    // Mettre à jour le statut de la ligne
    setParsedLines(prev => prev.map(line => {
      if (line.normalizedLogin === normalizedLogin) {
        const matchedMember = members.find(m => normalizeLogin(m.twitchLogin) === normalizeLogin(twitchLogin));
        return {
          ...line,
          matchedMember: matchedMember || { twitchLogin, displayName: twitchLogin },
          status: 'matched',
        };
      }
      return line;
    }));
  }

  if (!isOpen) return null;

  const matchedCount = parsedLines.filter(l => l.status === 'matched' || manualMatches[l.normalizedLogin]).length;
  const unmatchedCount = parsedLines.filter(l => l.status === 'unmatched' && !manualMatches[l.normalizedLogin]).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1d] border border-gray-700 rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">📋 Importer followers (Wizebot)</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Textarea */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Coller la liste Wizebot
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Nexou31  21/02/2024 19:25:16  685&#10;AutreMembre  22/02/2024 10:30:00  123"
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff] min-h-[150px] font-mono text-sm"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !rawText.trim()}
                className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {analyzing ? "Analyse..." : "Analyser"}
              </button>
              {parsedLines.length > 0 && (
                <button
                  onClick={handleAnalyzeAndDetectChanges}
                  disabled={analyzing}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {analyzing ? "Détection..." : "Détecter les changements"}
                </button>
              )}
            </div>
          </div>

              {/* Tableau d'aperçu */}
          {parsedLines.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Aperçu des lignes détectées</h3>
                <div className="text-sm text-gray-400">
                  {matchedCount} reconnu(s) / {unmatchedCount} inconnu(s)
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-300">Pseudo importé</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-300">Date follow</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-300">Membre TENF</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-300">Pseudo Twitch</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-300">Statut</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-300">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedLines.map((line, index) => {
                      const isMatched = line.status === 'matched' || manualMatches[line.normalizedLogin];
                      const matchedMember = line.matchedMember || (manualMatches[line.normalizedLogin] ? members.find(m => normalizeLogin(m.twitchLogin) === normalizeLogin(manualMatches[line.normalizedLogin])) : undefined);
                      return (
                        <tr key={index} className="border-b border-gray-700 hover:bg-[#0e0e10]">
                          <td className="py-2 px-3 text-white text-sm font-mono">{line.login}</td>
                          <td className="py-2 px-3 text-gray-400 text-sm">
                            {line.followedAt
                              ? new Date(line.followedAt).toLocaleString('fr-FR')
                              : "—"}
                          </td>
                          <td className="py-2 px-3 text-white text-sm">
                            {matchedMember ? matchedMember.displayName : "—"}
                          </td>
                          <td className="py-2 px-3 text-gray-400 text-sm font-mono">
                            {matchedMember ? `@${matchedMember.twitchLogin}` : "—"}
                          </td>
                          <td className="py-2 px-3">
                            {isMatched ? (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                                ✅ Reconnu
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-500/20 text-gray-300 border border-gray-500/30">
                                ❓ Non reconnu
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {!isMatched && (
                              <select
                                value={manualMatches[line.normalizedLogin] || ""}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleManualMatch(line.normalizedLogin, e.target.value);
                                  } else {
                                    setManualMatches(prev => {
                                      const updated = { ...prev };
                                      delete updated[line.normalizedLogin];
                                      return updated;
                                    });
                                  }
                                }}
                                className="bg-[#0e0e10] border border-gray-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#9146ff] min-w-[200px]"
                              >
                                <option value="">Sélectionner un membre...</option>
                                {members.map(m => (
                                  <option key={m.twitchLogin} value={m.twitchLogin}>
                                    {m.displayName} (@{m.twitchLogin})
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Affichage des changements détectés */}
          {showChanges && changes.length > 0 && (
            <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-orange-400 mb-2">
                    ⚠️ Changements détectés ({changes.length})
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Les données suivantes vont être modifiées. Sélectionnez les changements à appliquer.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedChanges(new Set(changes.map(c => c.twitchLogin)))}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={() => setSelectedChanges(new Set())}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    Tout ignorer
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {changes.map((change, idx) => {
                  const isSelected = selectedChanges.has(change.twitchLogin);
                  
                  return (
                    <div
                      key={idx}
                      className={`p-3 border rounded transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const newSelected = new Set(selectedChanges);
                            if (isSelected) {
                              newSelected.delete(change.twitchLogin);
                            } else {
                              newSelected.add(change.twitchLogin);
                            }
                            setSelectedChanges(newSelected);
                          }}
                          className="w-4 h-4 text-orange-500 border-gray-600 rounded focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{change.displayName}</span>
                            <span className="text-gray-500 text-xs">({change.twitchLogin})</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            <span className="text-red-300">
                              Actuel: {change.currentValue === null ? 'Non défini' : change.currentValue ? 'Me suit' : 'Ne me suit pas'}
                            </span>
                            {' → '}
                            <span className="text-green-300">
                              Nouveau: {change.newValue ? 'Me suit' : 'Ne me suit pas'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex-shrink-0 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Annuler
          </button>
          {showChanges ? (
            <>
              <button
                onClick={() => {
                  setShowChanges(false);
                  setChanges([]);
                  setSelectedChanges(new Set());
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleApplyDirect}
                disabled={applying || selectedChanges.size === 0}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {applying ? "Application..." : `Appliquer ${selectedChanges.size} changement(s)`}
              </button>
            </>
          ) : (
              <button
                onClick={handleApplyDirect}
                disabled={applying || parsedLines.length === 0 || matchedCount === 0}
                className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {applying ? "Application..." : `Appliquer (${matchedCount} membre(s))`}
              </button>
          )}
        </div>
      </div>
    </div>
  );
}

