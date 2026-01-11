"use client";

import { useState } from "react";

interface DiscordGrowthImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Array<{ date: string; members: number; avg21?: number | null }>) => Promise<void>;
}

interface ParsedData {
  date: string; // Format YYYY-MM-DD
  members: number;
  avg21?: number | null;
}

interface ParseResult {
  success: boolean;
  data: ParsedData[];
  summary: {
    linesRead: number;
    linesValid: number;
    firstDate: string | null;
    lastDate: string | null;
    pointsCount: number;
  };
  error?: string;
}

export default function DiscordGrowthImportModal({
  isOpen,
  onClose,
  onImport,
}: DiscordGrowthImportModalProps) {
  const [text, setText] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  // Fonction pour parser le TSV
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
          pointsCount: 0,
        },
        error: "Aucune ligne trouvée",
      };
    }

    // Détecter si la première ligne est un en-tête
    const firstLine = lines[0].toLowerCase();
    const hasHeader =
      firstLine.includes("horodatage") && firstLine.includes("membres");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const parsed: ParsedData[] = [];
    const dateMap = new Map<string, ParsedData>(); // Pour déduplication par date

    for (const line of dataLines) {
      // Détecter si c'est tabulation ou espaces multiples
      const hasTab = line.includes("\t");
      const columns = hasTab
        ? line.split("\t").map((col) => col.trim())
        : line.split(/\s+/).filter((col) => col.trim().length > 0);

      if (columns.length < 2) continue;

      // Extraire les colonnes
      const horodatage = columns[0]?.trim();
      let membresIndex = columns.length - 1; // Par défaut, la dernière colonne
      let avg21Index = -1;

      // Si 3 colonnes, la moyenne est au milieu
      if (columns.length === 3) {
        avg21Index = 1;
        membresIndex = 2;
      }

      if (!horodatage) continue;

      // Parser la date (ISO date string)
      let date: Date;
      try {
        date = new Date(horodatage);
        if (isNaN(date.getTime())) continue;
      } catch {
        continue;
      }

      // Formater la date en YYYY-MM-DD
      const dateStr = date.toISOString().split("T")[0];

      // Parser les membres (entier)
      const membresStr = columns[membresIndex]?.trim();
      if (!membresStr) continue;
      const membres = parseInt(membresStr, 10);
      if (isNaN(membres)) continue;

      // Parser la moyenne 21 jours (optionnel, float)
      let avg21: number | null = null;
      if (avg21Index >= 0 && columns[avg21Index]) {
        const avg21Str = columns[avg21Index].trim();
        if (avg21Str && avg21Str !== "null" && avg21Str !== "") {
          const avg21Val = parseFloat(avg21Str);
          if (!isNaN(avg21Val)) {
            avg21 = avg21Val;
          }
        }
      }

      // Déduplication : garder la dernière occurrence par date
      dateMap.set(dateStr, {
        date: dateStr,
        members: membres,
        avg21: avg21,
      });
    }

    // Convertir en tableau et trier par date
    const sortedData = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Validation : au moins 2 points
    if (sortedData.length < 2) {
      return {
        success: false,
        data: [],
        summary: {
          linesRead: lines.length,
          linesValid: sortedData.length,
          firstDate: sortedData[0]?.date || null,
          lastDate: sortedData[sortedData.length - 1]?.date || null,
          pointsCount: sortedData.length,
        },
        error: "Au moins 2 points valides sont nécessaires",
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
        pointsCount: sortedData.length,
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
          pointsCount: 0,
        },
        error: "Le texte est vide",
      });
      return;
    }

    const result = parseTSV(text);
    setParseResult(result);
  };

  const handleImport = async () => {
    if (!parseResult || !parseResult.success || parseResult.data.length === 0) {
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
            Importer des données (copier-coller)
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
              placeholder="horodatage	21 jours moy	membres&#10;2024-09-01T00:00:00.000Z	17&#10;2024-09-22T00:00:00.000Z	61.52	75"
            />
          </div>

          <div className="p-4 bg-[#0e0e10] border border-gray-600 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Format attendu
            </h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• 1ère ligne = headers (facultatif, peut être ignoré)</li>
              <li>• Colonnes attendues : horodatage, membres</li>
              <li>• La colonne "21 jours moy" est optionnelle</li>
              <li>
                • Séparateur : tabulation ou espaces multiples (détecté
                automatiquement)
              </li>
              <li>
                • Format date : ISO date string (ex:
                2024-09-01T00:00:00.000Z)
              </li>
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
                      <span className="font-medium">Lignes valides :</span>{" "}
                      {parseResult.summary.linesValid}
                    </div>
                    <div>
                      <span className="font-medium">Première date :</span>{" "}
                      {parseResult.summary.firstDate || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Dernière date :</span>{" "}
                      {parseResult.summary.lastDate || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Points conservés :</span>{" "}
                      {parseResult.summary.pointsCount}
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
                  {parseResult.summary.linesRead > 0 && (
                    <div className="mt-3 space-y-1 text-xs text-gray-400">
                      <div>
                        Lignes lues : {parseResult.summary.linesRead}
                      </div>
                      <div>
                        Points valides : {parseResult.summary.pointsCount}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
