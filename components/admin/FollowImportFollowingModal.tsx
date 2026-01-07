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

interface FollowImportFollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthKey: string;
  staffSlug: string;
  onImportComplete: () => void;
}

export default function FollowImportFollowingModal({
  isOpen,
  onClose,
  monthKey,
  staffSlug,
  onImportComplete,
}: FollowImportFollowingModalProps) {
  const [rawText, setRawText] = useState("");
  const [parsedLines, setParsedLines] = useState<ParsedLine[]>([]);
  const [members, setMembers] = useState<Array<{ twitchLogin: string; displayName: string }>>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);

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
    // trim, lowercase, remplacer espaces multiples par 1 espace
    return login.trim().toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function parseDate(dateStr: string): string | undefined {
    // Format attendu: YYYY-MM-DD
    const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    return undefined;
  }

  function parseFollowingText(text: string): ParsedLine[] {
    const lines = text.split('\n').filter(line => line.trim());
    const parsed: ParsedLine[] = [];
    const memberMap = new Map<string, { twitchLogin: string; displayName: string }>();
    
    // Créer un map des membres TENF normalisés
    members.forEach(m => {
      const normalized = normalizeLogin(m.twitchLogin);
      memberMap.set(normalized, m);
      // Aussi ajouter le displayName normalisé si différent
      const normalizedDisplay = normalizeLogin(m.displayName);
      if (normalizedDisplay !== normalized) {
        memberMap.set(normalizedDisplay, m);
      }
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
      alert("Veuillez coller la liste des following");
      return;
    }

    setAnalyzing(true);
    try {
      const parsed = parseFollowingText(rawText);
      setParsedLines(parsed);
    } catch (error) {
      console.error("Erreur analyse:", error);
      alert("Erreur lors de l'analyse du texte");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleApply() {
    if (parsedLines.length === 0) {
      alert("Aucune ligne à appliquer. Veuillez d'abord analyser.");
      return;
    }

    const matchedLines = parsedLines.filter(line => line.status === 'matched');
    if (matchedLines.length === 0) {
      alert("Aucun membre TENF détecté dans l'import.");
      return;
    }

    setApplying(true);
    try {
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

      // Créer un set des logins TENF qui sont dans l'import
      const importedLogins = new Set<string>();
      matchedLines.forEach(line => {
        if (line.matchedMember) {
          importedLogins.add(normalizeLogin(line.matchedMember.twitchLogin));
        }
      });

      // Mettre à jour les membres : jeSuis = true pour les membres dans l'import, false pour les autres
      const updatedMembers = currentMembers.map((m: any) => {
        const normalizedLogin = normalizeLogin(m.twitchLogin);
        const isInImport = importedLogins.has(normalizedLogin);
        
        return {
          ...m,
          jeSuis: isInImport,
        };
      });

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

      alert(`Import réussi : ${matchedLines.length} membres TENF mis à jour (${parsedLines.length - matchedLines.length} lignes ignorées)`);
      onImportComplete();
      onClose();
      setRawText("");
      setParsedLines([]);
    } catch (error) {
      console.error("Erreur application import:", error);
      alert("Erreur lors de l'application de l'import");
    } finally {
      setApplying(false);
    }
  }

  if (!isOpen) return null;

  const matchedLines = parsedLines.filter(l => l.status === 'matched');
  const unmatchedLines = parsedLines.filter(l => l.status === 'unmatched');

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
          <div>
            <h2 className="text-2xl font-bold text-white">Importer following (Je suis)</h2>
            <p className="text-sm text-gray-400 mt-1">
              Seuls les membres TENF (présents sur le site) sont comptabilisés. Les autres lignes sont ignorées.
            </p>
          </div>
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
              Coller la liste des following
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Shinyden    2022-08-14   1241&#10;Nexou31     2024-02-17   690"
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff] min-h-[150px] font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              Format : pseudo (tab ou espaces) date (optionnel, YYYY-MM-DD) autres colonnes (ignorées)
            </p>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !rawText.trim()}
              className="mt-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {analyzing ? "Analyse..." : "Analyser"}
            </button>
          </div>

          {/* Résultats de l'analyse */}
          {parsedLines.length > 0 && (
            <div className="space-y-4">
              {/* Compteur */}
              <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                <p className="text-white font-semibold">
                  {matchedLines.length} lignes TENF retenues / {unmatchedLines.length} lignes ignorées
                </p>
              </div>

              {/* Membres TENF détectés */}
              {matchedLines.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Membres TENF détectés ({matchedLines.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 px-3 text-sm font-semibold text-gray-300">Membre</th>
                          <th className="text-left py-2 px-3 text-sm font-semibold text-gray-300">Pseudo importé</th>
                          <th className="text-left py-2 px-3 text-sm font-semibold text-gray-300">Date follow</th>
                          <th className="text-left py-2 px-3 text-sm font-semibold text-gray-300">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchedLines.map((line, index) => (
                          <tr key={index} className="border-b border-gray-700 hover:bg-[#0e0e10]">
                            <td className="py-2 px-3 text-white text-sm">
                              {line.matchedMember?.displayName}
                            </td>
                            <td className="py-2 px-3 text-gray-400 text-sm font-mono">{line.login}</td>
                            <td className="py-2 px-3 text-gray-400 text-sm">
                              {line.followedAt
                                ? new Date(line.followedAt).toLocaleDateString('fr-FR')
                                : "—"}
                            </td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                                ✅ OK
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Lignes ignorées */}
              {unmatchedLines.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Lignes ignorées (hors TENF) ({unmatchedLines.length})
                  </h3>
                  <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                    <div className="space-y-2">
                      {unmatchedLines.map((line, index) => (
                        <div key={index} className="text-gray-400 text-sm font-mono">
                          {line.login}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
          <button
            onClick={handleApply}
            disabled={applying || parsedLines.length === 0 || matchedLines.length === 0}
            className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {applying ? "Enregistrement..." : `Enregistrer (${matchedLines.length} membre(s))`}
          </button>
        </div>
      </div>
    </div>
  );
}

