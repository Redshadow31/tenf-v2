"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { X, Search } from "lucide-react";
import {
  parseDiscordEngagementTSV,
  type EngagementParseResult,
  type EngagementRow,
} from "@/lib/discordEngagement";

interface DiscordEngagementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rows: EngagementRow[]) => void;
  title: string;
  membersMap: Map<string, { discordId: string; displayName: string; twitchLogin: string }>;
  existingData?: Record<string, { value: number }>; // Pour prévisualiser les valeurs existantes
}

export default function DiscordEngagementImportModal({
  isOpen,
  onClose,
  onImport,
  title,
  membersMap,
  existingData = {},
}: DiscordEngagementImportModalProps) {
  const [text, setText] = useState("");
  const [parseResult, setParseResult] = useState<EngagementParseResult | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  /** Index dans ignoredRows -> discordId du membre associé (ou vide = garder ignoré) */
  const [manualMappings, setManualMappings] = useState<Record<number, string>>({});

  const membersList = useMemo(
    () => Array.from(membersMap.values()),
    [membersMap]
  );

  /** Ligne dont le menu "Associer à un membre" est ouvert (recherche rapide) */
  const [openRowIndex, setOpenRowIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const comboRef = useRef<HTMLDivElement>(null);

  /** Filtrer les membres par recherche (displayName, twitchLogin) */
  const filteredMembers = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return membersList;
    return membersList.filter(
      (m) =>
        (m.displayName || "").toLowerCase().includes(q) ||
        (m.twitchLogin || "").toLowerCase().includes(q) ||
        (m.discordId || "").includes(q)
    );
  }, [membersList, searchQuery]);

  useEffect(() => {
    if (openRowIndex !== null) {
      setSearchQuery("");
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [openRowIndex]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setOpenRowIndex(null);
      }
    }
    if (openRowIndex !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openRowIndex]);

  if (!isOpen) return null;

  const handleAnalyze = () => {
    if (!text.trim()) {
      alert("Veuillez coller des données dans le champ texte");
      return;
    }

    const result = parseDiscordEngagementTSV(text, membersMap);
    setParseResult(result);
    setManualMappings({});
  };

  const setMapping = (ignoredIndex: number, discordId: string) => {
    if (!discordId) {
      const next = { ...manualMappings };
      delete next[ignoredIndex];
      setManualMappings(next);
    } else {
      setManualMappings((prev) => ({ ...prev, [ignoredIndex]: discordId }));
    }
  };

  const handleApply = () => {
    if (!parseResult) {
      alert("Aucune donnée à importer");
      return;
    }

    const rowsToImport: EngagementRow[] = [...parseResult.rows];
    parseResult.ignoredRows.forEach((row, idx) => {
      const assignedId = manualMappings[idx];
      if (assignedId) {
        rowsToImport.push({ ...row, matchedMemberId: assignedId });
      }
    });

    if (rowsToImport.length === 0) {
      alert("Aucune donnée valide à importer (associez des lignes ignorées à un membre ou importez des lignes matchées)");
      return;
    }

    setIsApplying(true);
    try {
      onImport(rowsToImport);
      setText("");
      setParseResult(null);
      setManualMappings({});
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'import:", error);
      alert("Erreur lors de l'import des données");
    } finally {
      setIsApplying(false);
    }
  };

  const appliedCount = parseResult
    ? parseResult.rows.length + Object.keys(manualMappings).length
    : 0;
  const canApply = parseResult && appliedCount > 0 && !isApplying;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info */}
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-200 text-sm">
              Seuls les membres TENF actifs (présents sur le site) sont comptabilisés.
              Les lignes non matchées peuvent être <strong>associées à un membre</strong> ou <strong>ignorées</strong> avant validation.
            </p>
            <p className="text-blue-300 text-xs mt-2">
              Format attendu : RANG (tab) PSEUDO (tab) DISCORD_ID (tab) VALEUR
              {title.includes("vocaux") && " (en heures décimales)"}
            </p>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Coller les données :
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-48 bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff] font-mono text-sm"
              placeholder="1&#9;frostyquinn94&#9;477791879866351623&#9;1683&#10;2&#9;facebcd&#9;1297107200623513645&#9;1477"
            />
          </div>

          {/* Bouton Analyser */}
          <div>
            <button
              onClick={handleAnalyze}
              className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Analyser
            </button>
          </div>

          {/* Résultats de l'analyse */}
          {parseResult && (
            <div className="space-y-4">
              {/* Résumé */}
              <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Résultat de l'analyse</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Total lignes</p>
                    <p className="text-white font-semibold">{parseResult.totalLines}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Matchés TENF</p>
                    <p className="text-green-400 font-semibold">{parseResult.matched}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Ignorés (associables ou à ignorer)</p>
                    <p className="text-yellow-400 font-semibold">{parseResult.ignoredRows.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Erreurs</p>
                    <p className="text-red-400 font-semibold">{parseResult.errors.length}</p>
                  </div>
                </div>
              </div>

              {/* Membres TENF détectés */}
              {parseResult.rows.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">
                    Membres TENF détectés ({parseResult.rows.length})
                  </h3>
                  <div className="bg-[#0e0e10] border border-gray-700 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-[#0a0a0c] sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-300">Pseudo importé</th>
                            <th className="px-4 py-2 text-left text-gray-300">Membre TENF</th>
                            <th className="px-4 py-2 text-left text-gray-300">Valeur</th>
                            <th className="px-4 py-2 text-left text-gray-300">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parseResult.rows.map((row, idx) => {
                            const member = membersMap.get(row.matchedMemberId || '');
                            return (
                              <tr key={idx} className="border-t border-gray-700">
                                <td className="px-4 py-2 text-gray-300">{row.pseudo}</td>
                                <td className="px-4 py-2 text-white">
                                  {member?.displayName || row.matchedMemberId}
                                </td>
                                <td className="px-4 py-2 text-gray-300">{row.value}</td>
                                <td className="px-4 py-2">
                                  <span className="text-green-400 text-xs">✓ Matché</span>
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

              {/* Lignes ignorées : associer à un membre ou garder ignorées */}
              {parseResult.ignoredRows.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">
                    Lignes non matchées — associer à un membre ou ignorer ({parseResult.ignoredRows.length})
                  </h3>
                  <div className="bg-[#0e0e10] border border-gray-700 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-[#0a0a0c] sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-300">Pseudo</th>
                            <th className="px-4 py-2 text-left text-gray-300">Discord ID</th>
                            <th className="px-4 py-2 text-left text-gray-300">Valeur</th>
                            <th className="px-4 py-2 text-left text-gray-300">Associer à un membre</th>
                            <th className="px-4 py-2 text-left text-gray-300">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parseResult.ignoredRows.map((row, idx) => {
                            const assignedId = manualMappings[idx];
                            const member = assignedId ? membersMap.get(assignedId) : null;
                            return (
                              <tr key={idx} className="border-t border-gray-700">
                                <td className="px-4 py-2 text-gray-300">{row.pseudo}</td>
                                <td className="px-4 py-2 text-gray-400 font-mono text-xs">{row.discordId || "—"}</td>
                                <td className="px-4 py-2 text-gray-300">{row.value}</td>
                                <td className="px-4 py-2 align-top">
                                  <div ref={openRowIndex === idx ? comboRef : undefined} className="relative min-w-[200px]">
                                    {openRowIndex === idx ? (
                                      <div className="border border-[#9146ff] rounded-lg bg-[#1a1a1d] shadow-lg overflow-hidden">
                                        <div className="flex items-center gap-2 px-2 py-1.5 border-b border-gray-700">
                                          <Search className="w-4 h-4 text-gray-400 shrink-0" />
                                          <input
                                            ref={searchInputRef}
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Rechercher un membre…"
                                            className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-500 min-w-0"
                                          />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setMapping(idx, "");
                                              setOpenRowIndex(null);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                                          >
                                            — Garder ignoré
                                          </button>
                                          {filteredMembers.length === 0 ? (
                                            <div className="px-3 py-2 text-xs text-gray-500">Aucun membre trouvé</div>
                                          ) : (
                                            filteredMembers.map((m) => (
                                              <button
                                                key={m.discordId}
                                                type="button"
                                                onClick={() => {
                                                  setMapping(idx, m.discordId);
                                                  setOpenRowIndex(null);
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#9146ff]/30 transition-colors"
                                              >
                                                {m.displayName} ({m.twitchLogin})
                                              </button>
                                            ))
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setOpenRowIndex(idx)}
                                        className="w-full flex items-center gap-2 bg-[#1a1a1d] border border-gray-600 rounded px-2 py-1.5 text-left text-sm text-white hover:border-[#9146ff] focus:outline-none focus:border-[#9146ff] min-w-[180px]"
                                      >
                                        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        {member ? (
                                          <span className="truncate">{member.displayName} ({member.twitchLogin})</span>
                                        ) : (
                                          <span className="text-gray-500">— Garder ignoré</span>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  {assignedId ? (
                                    <span className="text-green-400 text-xs">→ {member?.displayName ?? assignedId}</span>
                                  ) : (
                                    <span className="text-gray-500 text-xs">Ignoré</span>
                                  )}
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

              {/* Erreurs */}
              {parseResult.errors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-red-400 mb-2">
                    Erreurs de parsing ({parseResult.errors.length})
                  </h3>
                  <div className="bg-[#0e0e10] border border-red-700 rounded-lg p-4 max-h-32 overflow-y-auto">
                    <div className="space-y-1">
                      {parseResult.errors.slice(0, 10).map((error, idx) => (
                        <div key={idx} className="text-xs text-red-400">
                          Ligne {error.line}: {error.reason}
                        </div>
                      ))}
                      {parseResult.errors.length > 10 && (
                        <div className="text-xs text-gray-500">
                          ... et {parseResult.errors.length - 10} autres erreurs
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleApply}
            disabled={!canApply}
            className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? "Application..." : `Appliquer (${appliedCount} ligne(s))`}
          </button>
        </div>
      </div>
    </div>
  );
}

