"use client";

import { useState, useEffect, type ChangeEvent } from "react";

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
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [activeMembers, setActiveMembers] = useState<Array<{ twitchLogin: string; displayName: string; discordId?: string; discordUsername?: string }>>([]);
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
            discordId: m.discordId,
            discordUsername: m.discordUsername,
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

  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        // Double quote escaped inside quoted value.
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  function parseNumericValue(raw: string): number {
    const cleaned = raw.replace(/\s+/g, "").replace(",", ".");
    return Number.parseFloat(cleaned);
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
        unmatchedData: {},
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
    // Créer une map discordId -> twitchLogin pour recherche par ID Discord
    const discordIdMap = new Map<string, string>();
    activeMembers.forEach(m => {
      if (m.discordId) {
        discordIdMap.set(m.discordId, m.twitchLogin);
      }
    });

    for (const line of lines) {
      const hasTab = line.includes("\t");
      const hasComma = line.includes(",") && !hasTab;
      const columns = hasComma
        ? parseCsvLine(line).map((col) => col.trim())
        : hasTab
          ? line.split("\t").map((col) => col.trim())
          : line.split(/\s+/).filter((col) => col.trim().length > 0);

      if (columns.length < 2) continue;

      // Ignorer l'en-tête CSV exporté (ex: rang,nom d'utilisateur,id,compter)
      const col0 = normalizeUsername(columns[0] || "");
      const col1 = normalizeUsername(columns[1] || "");
      if (col0 === "rang" || col1 === "nom d'utilisateur" || col1 === "nom dutilisateur") {
        continue;
      }

      let username: string;
      let userId: string | undefined;
      let messageCount: number;

      if (columns.length === 4) {
        // rank username userId messageCount
        username = normalizeUsername(columns[1]);
        userId = columns[2]?.trim();
        const countStr = columns[3]?.trim();
        messageCount = Math.round(parseNumericValue(countStr || "0"));
      } else if (columns.length === 3) {
        // Détecter si col[0] est numérique (rank)
        const firstCol = columns[0]?.trim();
        const isRank = !isNaN(parseInt(firstCol || '', 10));
        
        if (isRank) {
          // rank username messageCount
          username = normalizeUsername(columns[1]);
          messageCount = Math.round(parseNumericValue(columns[2] || "0"));
        } else {
          // username userId messageCount
          username = normalizeUsername(columns[0]);
          userId = columns[1]?.trim();
          messageCount = Math.round(parseNumericValue(columns[2] || "0"));
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
          messageCount = Math.round(parseNumericValue(columns[1] || "0"));
        }
      }

      if (!username || isNaN(messageCount)) continue;

      // Essayer de matcher par pseudo d'abord
      let matchedLogin: string | undefined;
      if (activeLogins.has(username)) {
        matchedLogin = username;
      } else if (userId && discordIdMap.has(userId)) {
        // Si pseudo non reconnu, essayer de matcher par ID Discord
        matchedLogin = discordIdMap.get(userId);
      }

      if (matchedLogin) {
        messagesByUser[matchedLogin] = messageCount;
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

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      setText(content);
      setUploadedFileName(file.name);
      setParseResult(null);
      setSelectedUnmatched(new Set());
    } catch (error) {
      console.error("Erreur lors de la lecture du fichier:", error);
      alert("Impossible de lire le fichier.");
    }
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
    setUploadedFileName(null);
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
              Source des données (copier-coller OU fichier)
            </label>
            <div className="mb-3">
              <input
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/plain"
                onChange={handleFileUpload}
                disabled={loadingMembers}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-[#5865F2] file:text-white hover:file:bg-[#4752C4]"
              />
              {uploadedFileName && (
                <p className="text-xs text-gray-400 mt-1">
                  Fichier chargé: {uploadedFileName}
                </p>
              )}
            </div>
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
              <li>• Compatible CSV (ex: rang, nom d'utilisateur, id, compter)</li>
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

