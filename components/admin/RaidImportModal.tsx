"use client";

import { useState } from "react";

interface DetectedRaid {
  raider: string;
  target: string;
  lineNumber: number;
  originalText: string;
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

  // Regex pour détecter les raids : @Raider a raid @Cible ou @Raider à raid @Cible
  // Support Unicode, tolère emojis et texte après
  // \S+ accepte tous les caractères non-whitespace (y compris Unicode, emojis)
  // Tolère les espaces multiples et le texte après la cible
  const RAID_PATTERN = /@([^\s@]+)\s+(?:a|à)\s+raid\s+@([^\s@]+)/giu;

  function analyzeText() {
    if (!inputText.trim()) {
      setError("Veuillez coller du texte à analyser");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setDetectedRaids([]);

    try {
      const lines = inputText.split("\n");
      const raids: DetectedRaid[] = [];
      let lineNumber = 0;

      for (const line of lines) {
        lineNumber++;
        const trimmedLine = line.trim();
        if (!trimmedLine) continue; // Ignorer les lignes vides

        // Chercher toutes les occurrences de raids dans la ligne
        // Réinitialiser lastIndex pour éviter les problèmes avec exec en boucle
        RAID_PATTERN.lastIndex = 0;
        let match;
        while ((match = RAID_PATTERN.exec(trimmedLine)) !== null) {
          const raider = match[1].trim();
          const target = match[2].trim();

          // Ignorer si les noms sont vides ou trop courts
          // Support Unicode : vérifier la longueur en caractères (pas en bytes)
          if (!raider || !target || raider.length < 1 || target.length < 1) continue;

          // Ignorer si raider et target sont identiques
          if (raider.toLowerCase() === target.toLowerCase()) continue;

          raids.push({
            raider,
            target,
            lineNumber,
            originalText: trimmedLine,
          });
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

  async function saveRaids() {
    if (detectedRaids.length === 0) {
      setError("Aucun raid à enregistrer");
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
          raids: detectedRaids.map(r => ({
            raider: r.raider,
            target: r.target,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      setSuccess(`${detectedRaids.length} raid(s) enregistré(s) avec succès !`);
      
      // Réinitialiser le formulaire après un court délai
      setTimeout(() => {
        setInputText("");
        setDetectedRaids([]);
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
      setError(null);
      setSuccess(null);
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
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
              <strong>Format attendu :</strong> @Raider a raid @Cible ou @Raider à raid @Cible
            </p>
            <p className="text-xs text-blue-400">
              Vous pouvez coller plusieurs messages. Chaque ligne sera analysée pour détecter les raids.
            </p>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Messages à analyser :
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="@membre1 a raid @membre2&#10;@membre3 à raid @membre4&#10;..."
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
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800/50 sticky top-0">
                      <tr>
                        <th className="text-left py-2 px-4 text-gray-300 font-semibold">Ligne</th>
                        <th className="text-left py-2 px-4 text-gray-300 font-semibold">Raider</th>
                        <th className="text-left py-2 px-4 text-gray-300 font-semibold">Cible</th>
                        <th className="text-left py-2 px-4 text-gray-300 font-semibold">Texte original</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detectedRaids.map((raid, idx) => (
                        <tr
                          key={idx}
                          className="border-t border-gray-700 hover:bg-gray-800/30"
                        >
                          <td className="py-2 px-4 text-gray-400">{raid.lineNumber}</td>
                          <td className="py-2 px-4 text-white font-semibold">
                            {getMemberDisplayName(raid.raider)}
                            <span className="text-gray-500 text-xs ml-2">({raid.raider})</span>
                          </td>
                          <td className="py-2 px-4 text-white font-semibold">
                            {getMemberDisplayName(raid.target)}
                            <span className="text-gray-500 text-xs ml-2">({raid.target})</span>
                          </td>
                          <td className="py-2 px-4 text-gray-400 text-xs font-mono truncate max-w-xs">
                            {raid.originalText}
                          </td>
                        </tr>
                      ))}
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

