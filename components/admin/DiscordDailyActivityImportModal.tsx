"use client";

import { useState, type ChangeEvent } from "react";

interface DiscordDailyActivityImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Array<{ date: string; value: number }>) => Promise<void>;
  type: 'messages' | 'vocals';
}

interface ParseResult {
  success: boolean;
  data: Array<{ date: string; value: number }>;
  summary: {
    linesRead: number;
    linesValid: number;
    firstDate: string | null;
    lastDate: string | null;
  };
  error?: string;
}

export default function DiscordDailyActivityImportModal({
  isOpen,
  onClose,
  onImport,
  type,
}: DiscordDailyActivityImportModalProps) {
  const [text, setText] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
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
        data: [],
        summary: {
          linesRead: 0,
          linesValid: 0,
          firstDate: null,
          lastDate: null,
        },
        error: "Aucune ligne trouvée",
      };
    }

    const parsed: Array<{ date: string; value: number }> = [];
    const dateMap = new Map<string, number>(); // Pour déduplication par date

    for (const line of lines) {
      // Détecter csv, tsv ou colonnes séparées par espaces
      const hasTab = line.includes("\t");
      const hasComma = line.includes(",") && !hasTab;
      const columns = hasTab
        ? line.split("\t").map((col) => col.trim())
        : hasComma
          ? parseCsvLine(line).map((col) => col.trim())
          : line.split(/\s+/).filter((col) => col.trim().length > 0);

      if (columns.length < 2) continue;

      const dateStr = columns[0]?.trim();
      const valueStr = columns[1]?.trim();

      if (!dateStr || !valueStr) continue;

      // Parser la date (ISO timestamp)
      let date: Date;
      try {
        date = new Date(dateStr);
        if (isNaN(date.getTime())) continue;
      } catch {
        continue;
      }

      // Formater la date en YYYY-MM-DD
      const dateFormatted = date.toISOString().split("T")[0];

      // Parser la valeur (nombre ou décimal)
      const value = parseNumericValue(valueStr);
      if (isNaN(value)) continue;

      // Déduplication : garder la dernière occurrence par date
      dateMap.set(dateFormatted, value);
    }

    // Convertir en tableau et trier par date
    const sortedData = Array.from(dateMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (sortedData.length === 0) {
      return {
        success: false,
        data: [],
        summary: {
          linesRead: lines.length,
          linesValid: 0,
          firstDate: null,
          lastDate: null,
        },
        error: "Aucune donnée valide trouvée",
      };
    }

    return {
      success: true,
      data: sortedData,
      summary: {
        linesRead: lines.length,
        linesValid: sortedData.length,
        firstDate: sortedData[0].date,
        lastDate: sortedData[sortedData.length - 1].date,
      },
    };
  }

  const handleAnalyze = () => {
    if (!text.trim()) {
      setParseResult({
        success: false,
        data: [],
        summary: {
          linesRead: 0,
          linesValid: 0,
          firstDate: null,
          lastDate: null,
        },
        error: "Le texte est vide",
      });
      return;
    }

    const result = parseTSV(text);
    setParseResult(result);
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      setText(content);
      setUploadedFileName(file.name);
      setParseResult(null);
    } catch (error) {
      console.error("Erreur lors de la lecture du fichier:", error);
      alert("Impossible de lire le fichier.");
    }
  };

  const handleImport = async () => {
    if (!parseResult || !parseResult.success) {
      return;
    }

    setImporting(true);
    try {
      await onImport(parseResult.data);
      setText("");
      setParseResult(null);
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'import:", error);
      alert("Erreur lors de l'import des données");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setText("");
    setParseResult(null);
    setUploadedFileName(null);
    onClose();
  };

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
            Import {type === 'messages' ? 'Messages' : 'Vocaux'} (copier-coller)
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
              placeholder={type === 'messages' 
                ? "2024-09-01T00:00:00.000Z\t146\n2024-09-02T00:00:00.000Z\t766"
                : "2024-09-02T00:00:00.000Z\t16.57\n2024-09-03T00:00:00.000Z\t22.07"
              }
            />
          </div>

          <div className="p-4 bg-[#0e0e10] border border-gray-600 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Format attendu
            </h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Colonnes : Date ISO (timestamp), {type === 'messages' ? 'Nombre de messages' : 'Heures décimales'}</li>
              <li>• Séparateur : virgule (CSV), tabulation, ou espaces multiples</li>
              <li>• Format date : ISO timestamp (ex: 2024-09-01T00:00:00.000Z)</li>
              <li>• Format valeur : {type === 'messages' ? 'Nombre entier' : 'Nombre décimal (ex: 16.57)'}</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              className="flex-1 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-colors"
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
                      <span className="font-medium">Points valides :</span>{" "}
                      {parseResult.summary.linesValid}
                    </div>
                    <div>
                      <span className="font-medium">Première date :</span>{" "}
                      {parseResult.summary.firstDate}
                    </div>
                    <div>
                      <span className="font-medium">Dernière date :</span>{" "}
                      {parseResult.summary.lastDate}
                    </div>
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

