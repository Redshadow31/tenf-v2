"use client";

import { useState } from "react";

interface RaidScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: string; // Format YYYY-MM
  onScanComplete?: (results: ScanResults) => void;
}

interface ScanResults {
  newRaidsAdded: number;
  raidsIgnored: number;
  repeatedRaidsDetected: number;
  alertsAdded: number;
  messagesScanned: number;
  errors: string[];
}

export default function RaidScanModal({
  isOpen,
  onClose,
  month,
  onScanComplete,
}: RaidScanModalProps) {
  const [scanMode, setScanMode] = useState<"new" | "rescan">("new");
  const [includeManual, setIncludeManual] = useState(false);
  const [logSkipped, setLogSkipped] = useState(true);
  const [simulateOnly, setSimulateOnly] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("/api/discord/raids/scan-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month,
          scanMode,
          includeManual,
          logSkipped,
          simulateOnly,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        if (onScanComplete) {
          onScanComplete(data);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erreur lors du scan");
      }
    } catch (err) {
      console.error("Erreur lors du scan:", err);
      setError("Erreur lors du scan");
    } finally {
      setScanning(false);
    }
  };

  const handleClose = () => {
    setResults(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Scanner les raids Discord</h2>
            <p className="text-gray-400 text-sm mt-1">Mois: {month}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Options de scan */}
        {!results && (
          <div className="p-6 space-y-4">
            <div>
              <label className="text-white font-semibold mb-2 block">Mode de scan</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scanMode"
                    value="new"
                    checked={scanMode === "new"}
                    onChange={(e) => setScanMode(e.target.value as "new" | "rescan")}
                    className="w-4 h-4 text-[#9146ff]"
                  />
                  <span className="text-gray-300">Scanner uniquement les nouveaux messages Discord</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scanMode"
                    value="rescan"
                    checked={scanMode === "rescan"}
                    onChange={(e) => setScanMode(e.target.value as "new" | "rescan")}
                    className="w-4 h-4 text-[#9146ff]"
                  />
                  <span className="text-gray-300">Rescanner tout le mois</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeManual}
                  onChange={(e) => setIncludeManual(e.target.checked)}
                  className="w-4 h-4 text-[#9146ff] rounded"
                />
                <span className="text-gray-300">Inclure les entrées manuelles</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={logSkipped}
                  onChange={(e) => setLogSkipped(e.target.checked)}
                  className="w-4 h-4 text-[#9146ff] rounded"
                />
                <span className="text-gray-300">Logger les overrides manuels ignorés</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateOnly}
                  onChange={(e) => setSimulateOnly(e.target.checked)}
                  className="w-4 h-4 text-[#9146ff] rounded"
                />
                <span className="text-gray-300">Simuler le scan (dry run, pas d'écriture)</span>
              </label>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                <p className="text-red-300">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleScan}
                disabled={scanning}
                className="flex-1 bg-[#9146ff] hover:bg-[#5a32b4] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                {scanning ? "Scan en cours..." : simulateOnly ? "Simuler le scan" : "Scanner maintenant"}
              </button>
              <button
                onClick={handleClose}
                className="px-6 py-3 border border-gray-700 hover:border-gray-600 text-gray-300 rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Résultats */}
        {results && (
          <div className="p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">Résultats du scan</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0e0e10] border border-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Nouveaux raids ajoutés</div>
                <div className="text-2xl font-bold text-[#9146ff]">{results.newRaidsAdded}</div>
              </div>
              
              <div className="bg-[#0e0e10] border border-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Raids ignorés (override manuel)</div>
                <div className="text-2xl font-bold text-yellow-400">{results.raidsIgnored}</div>
              </div>
              
              <div className="bg-[#0e0e10] border border-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Raids répétés détectés</div>
                <div className="text-2xl font-bold text-orange-400">{results.repeatedRaidsDetected}</div>
              </div>
              
              <div className="bg-[#0e0e10] border border-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Alertes ajoutées</div>
                <div className="text-2xl font-bold text-red-400">{results.alertsAdded}</div>
              </div>
            </div>

            <div className="bg-[#0e0e10] border border-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Messages scannés</div>
              <div className="text-2xl font-bold text-white">{results.messagesScanned}</div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                <div className="text-red-300 font-semibold mb-2">Erreurs:</div>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-200">
                  {results.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleClose}
                className="flex-1 bg-[#9146ff] hover:bg-[#5a32b4] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

