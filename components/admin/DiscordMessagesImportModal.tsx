"use client";

import { useState, useEffect } from "react";

interface DiscordMessagesImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Record<string, number>) => Promise<void>;
  month: string; // Format: "YYYY-MM"
}

interface ParseResult {
  success: boolean;
  data: Record<string, number>;
  unmatchedData: Record<string, number>; // Données des pseudos non reconnus
  summary: {
    linesRead: number;
    linesValid: number;
    matchedMembers: number;
    unmatchedUsernames: string[];
  };
  error?: string;
}

export default function DiscordMessagesImportModal({
  isOpen,
  onClose,
  onImport,
  month,
}: DiscordMessagesImportModalProps) {
  const [text, setText] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [activeMembers, setActiveMembers] = useState<Array<{ twitchLogin: string; displayName: string }>>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [selectedUnmatched, setSelectedUnmatched] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadActiveMembers();
    }
  }, [isOpen]);

  async function loadActiveMembers() {
    try {
      setLoadingMembers(true);
      const response = await fetch("/api/members/public", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const members = (data.members || [])
          .filter((m: any) => m.isActive !== false && m.twitchLogin)
          .map((m: any) => ({
            twitchLogin: (m.twitchLogin || '').toLowerCase(),
            displayName: m.displayName || m.twitchLogin || '',
          }));
        setActiveMembers(members);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
    } finally {
      setLoadingMembers(false);
    }
  }

  function normalizeUsername(username: string): string {
    return username.trim().toLowerCase().replace(/^@/, '');
  }

  function parseTSV(content: string): ParseResult {
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return {
        success: false,
        data: {},
        summary: {
          linesRead: 0,
          linesValid: 0,
          matchedMembers: 0,
          unmatchedUsernames: [],
        },
        error: "Aucune ligne trouvée",
      };
    }

    const messagesByUser: Record<string, number> = {};
    const unmatchedData: Record<string, number> = {};
    const unmatchedUsernames: string[] = [];
    const activeLogins = new Set(activeMembers.map(m => m.twitchLogin));

    for (const line of lines) {
      const hasTab = line.includes("\t");
      const columns = hasTab
        ? line.split("\t").map((col) => col.trim())
        : line.split(/\s+/).filter((col) => col.trim().length > 0);

      if (columns.length < 2) continue;

      let username: string;
      let messageCount: number;

      if (columns.length === 4) {
        // rank username userId messageCount
        username = normalizeUsername(columns[1]);
        const countStr = columns[3]?.trim();
        messageCount = parseInt(countStr || '0', 10);
      } else if (columns.length === 3) {
        // Détecter si col[0] est numérique (rank)
        const firstCol = columns[0]?.trim();
        const isRank = !isNaN(parseInt(firstCol || '', 10));
        
        if (isRank) {
          // rank username messageCount
          username = normalizeUsername(columns[1]);
          messageCount = parseInt(columns[2] || '0', 10);
        } else {
          // username userId messageCount
          username = normalizeUsername(columns[0]);
          messageCount = parseInt(columns[2] || '0', 10);
        }
      } else {
        // 2 colonnes : username messageCount (ou rank messageCount)
        const firstCol = columns[0]?.trim();
        const isRank = !isNaN(parseInt(firstCol || '', 10));
        
        if (isRank) {
          // rank messageCount (pas d'username, skip)
          continue;
        } else {
          username = normalizeUsername(columns[0]);
          messageCount = parseInt(columns[1] || '0', 10);
        }
      }

      if (!username || isNaN(messageCount)) continue;

      // Séparer les membres reconnus des non reconnus
      if (activeLogins.has(username)) {
        messagesByUser[username] = messageCount;
      } else {
        unmatchedData[username] = messageCount;
        if (!unmatchedUsernames.includes(username)) {
          unmatchedUsernames.push(username);
        }
      }
    }

    if (Object.keys(messagesByUser).length === 0 && Object.keys(unmatchedData).length === 0) {
      return {
        success: false,
        data: {},
        unmatchedData: {},
        summary: {
          linesRead: lines.length,
          linesValid: 0,
          matchedMembers: 0,
          unmatchedUsernames: [],
        },
        error: "Aucune donnée valide trouvée",
      };
    }

    return {
      success: true,
      data: messagesByUser,
      unmatchedData: unmatchedData,
      summary: {
        linesRead: lines.length,
        linesValid: Object.keys(messagesByUser).length + Object.keys(unmatchedData).length,
        matchedMembers: Object.keys(messagesByUser).length,
        unmatchedUsernames: unmatchedUsernames,
      },
    };
  }

  const handleAnalyze = () => {
    if (!text.trim()) {
      setParseResult({
        success: false,
        data: {},
        unmatchedData: {},
        summary: {
          linesRead: 0,
          linesValid: 0,
          matchedMembers: 0,
          unmatchedUsernames: [],
        },
        error: "Le texte est vide",
      });
      setSelectedUnmatched(new Set());
      return;
    }

    const result = parseTSV(text);
    setParseResult(result);
    setSelectedUnmatched(new Set());
  };

  const handleImport = async () => {
    if (!parseResult || !parseResult.success) {
      return;
    }

    // Combiner les données reconnues avec les pseudos non reconnus sélectionnés
    const finalData = { ...parseResult.data };
    for (const username of selectedUnmatched) {
      if (parseResult.unmatchedData[username] !== undefined) {
        finalData[username] = parseResult.unmatchedData[username];
      }
    }

    if (Object.keys(finalData).length === 0) {
      alert("Aucune donnée à importer");
      return;
    }

    setImporting(true);
    try {
      await onImport(finalData);
      setText("");
      setParseResult(null);
      setSelectedUnmatched(new Set());
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'import:", error);
      alert("Erreur lors de l'import des données");
    } finally {
      setImporting(false);
    }
  };

  const toggleUnmatched = (username: string) => {
    const newSelected = new Set(selectedUnmatched);
    if (newSelected.has(username)) {
      newSelected.delete(username);
    } else {
      newSelected.add(username);
    }
    setSelectedUnmatched(newSelected);
  };

  const selectAllUnmatched = () => {
    if (!parseResult) return;
    setSelectedUnmatched(new Set(parseResult.summary.unmatchedUsernames));
  };

  const deselectAllUnmatched = () => {
    setSelectedUnmatched(new Set());
  };

  const handleClose = () => {
    setText("");
    setParseResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            Import Messages (copier-coller)
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Colle ici les données exportées (TSV)
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-64 p-3 bg-[#0e0e10] border border-gray-600 rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
              placeholder="1 frostyquinn94 477791879866351623 1683&#10;2 red_shadow_31 1021398088474169414 1520"
              disabled={loadingMembers}
            />
            {loadingMembers && (
              <p className="text-xs text-gray-400 mt-1">Chargement des membres actifs...</p>
            )}
          </div>

          <div className="p-4 bg-[#0e0e10] border border-gray-600 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Format attendu
            </h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Colonnes : rank (optionnel), username, userId (optionnel), messageCount</li>
              <li>• Séparateur : tabulation ou espaces multiples</li>
              <li>• Seuls les membres actifs du site seront importés</li>
              <li>• Format mois : {month}</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={loadingMembers}
              className="flex-1 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Analyser
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>
          </div>

          {parseResult && (
            <div
              className={`p-4 rounded-lg border ${
                parseResult.success
                  ? "bg-green-900/20 border-green-700"
                  : "bg-red-900/20 border-red-700"
              }`}
            >
              {parseResult.success ? (
                <>
                  <h3 className="text-sm font-semibold text-green-300 mb-3">
                    Analyse réussie
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div>
                      <span className="font-medium">Lignes lues :</span>{" "}
                      {parseResult.summary.linesRead}
                    </div>
                    <div>
                      <span className="font-medium">Membres actifs trouvés :</span>{" "}
                      {parseResult.summary.matchedMembers}
                    </div>
                    {parseResult.summary.unmatchedUsernames.length > 0 && (
                      <div>
                        <span className="font-medium">Pseudos non reconnus :</span>{" "}
                        {parseResult.summary.unmatchedUsernames.join(", ")}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="mt-4 w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    {importing ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-red-300 mb-2">
                    Erreur d'analyse
                  </h3>
                  <p className="text-sm text-red-200">
                    {parseResult.error || "Erreur inconnue"}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

