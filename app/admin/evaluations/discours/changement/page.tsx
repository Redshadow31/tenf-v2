"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PartKey = "partie-1" | "partie-2" | "partie-3" | "partie-4";

interface PartContent {
  points: string;
  discours: string;
  conseils: string;
  updatedAt?: string;
  updatedBy?: string;
}

const PART_LABELS: Record<PartKey, string> = {
  "partie-1": "Partie 1",
  "partie-2": "Partie 2",
  "partie-3": "Partie 3",
  "partie-4": "Partie 4",
};

const PARTS: PartKey[] = ["partie-1", "partie-2", "partie-3", "partie-4"];

const EMPTY_CONTENT: PartContent = {
  points: "",
  discours: "",
  conseils: "",
};

export default function DiscoursChangementPage() {
  const [selectedPart, setSelectedPart] = useState<PartKey>("partie-1");
  const [allContent, setAllContent] = useState<Record<PartKey, PartContent>>({
    "partie-1": { ...EMPTY_CONTENT },
    "partie-2": { ...EMPTY_CONTENT },
    "partie-3": { ...EMPTY_CONTENT },
    "partie-4": { ...EMPTY_CONTENT },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const current = useMemo(() => allContent[selectedPart] || EMPTY_CONTENT, [allContent, selectedPart]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setFeedback(null);
        const res = await fetch("/api/admin/evaluations/discours-content", { cache: "no-store" });
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload?.error || "Impossible de charger le contenu.");
        }
        if (payload?.content) {
          setAllContent(payload.content);
        }
      } catch (error: any) {
        setFeedback(error?.message || "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const onChangeField = (field: keyof PartContent, value: string) => {
    setAllContent((prev) => ({
      ...prev,
      [selectedPart]: {
        ...prev[selectedPart],
        [field]: value,
      },
    }));
  };

  const saveCurrentPart = async () => {
    try {
      setSaving(true);
      setFeedback(null);
      const res = await fetch("/api/admin/evaluations/discours-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          part: selectedPart,
          points: current.points || "",
          discours: current.discours || "",
          conseils: current.conseils || "",
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Impossible de sauvegarder.");
      }

      setAllContent((prev) => ({
        ...prev,
        [selectedPart]: payload.content,
      }));
      setFeedback("Texte sauvegardé avec succès.");
    } catch (error: any) {
      setFeedback(error?.message || "Erreur de sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="text-white">
      <div className="mb-8">
        <Link href="/admin/integration/discours" className="text-gray-400 hover:text-white transition-colors mb-4 inline-block">
          ← Retour aux discours
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Module de changement - Discours</h1>
        <p className="text-gray-400">
          Modifie les blocs “Points Clés”, “Discours Suggéré” et “Conseils” pour les parties 1 à 4.
        </p>
      </div>

      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold text-[#9146ff] mb-3">💡 Conseils et astuces de mise en page</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-300 text-sm">
          <li>Une ligne = un point (pour “Points Clés” et “Conseils”).</li>
          <li>Laisse une ligne vide pour créer un nouveau paragraphe dans “Discours Suggéré”.</li>
          <li>Tu peux commencer une ligne par “-” ou “•”, cela sera nettoyé automatiquement.</li>
          <li>Les textes vides conservent le contenu actuel déjà affiché sur la page de la partie.</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {PARTS.map((part) => (
          <button
            key={part}
            type="button"
            onClick={() => {
              setSelectedPart(part);
              setFeedback(null);
            }}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              selectedPart === part
                ? "bg-[#9146ff] border-[#9146ff] text-white"
                : "bg-[#1a1a1d] border-gray-700 text-gray-300 hover:border-[#9146ff]"
            }`}
          >
            {PART_LABELS[part]}
          </button>
        ))}
      </div>

      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 space-y-5">
        <h3 className="text-xl font-semibold text-white">{PART_LABELS[selectedPart]}</h3>

        <div>
          <label className="block text-cyan-400 font-semibold mb-2">📌 Points Clés à Aborder</label>
          <textarea
            value={current.points}
            onChange={(e) => onChangeField("points", e.target.value)}
            rows={8}
            disabled={loading}
            placeholder="Un point par ligne..."
            className="w-full rounded-lg border border-gray-700 bg-[#0f0f11] p-3 text-gray-200 focus:outline-none focus:border-[#9146ff]"
          />
        </div>

        <div>
          <label className="block text-amber-400 font-semibold mb-2">🎤 Discours Suggéré</label>
          <textarea
            value={current.discours}
            onChange={(e) => onChangeField("discours", e.target.value)}
            rows={14}
            disabled={loading}
            placeholder="Rédige ton discours avec des paragraphes..."
            className="w-full rounded-lg border border-gray-700 bg-[#0f0f11] p-3 text-gray-200 focus:outline-none focus:border-[#9146ff]"
          />
        </div>

        <div>
          <label className="block text-green-400 font-semibold mb-2">💡 Conseils pour les Modérateurs</label>
          <textarea
            value={current.conseils}
            onChange={(e) => onChangeField("conseils", e.target.value)}
            rows={8}
            disabled={loading}
            placeholder="Un conseil par ligne..."
            className="w-full rounded-lg border border-gray-700 bg-[#0f0f11] p-3 text-gray-200 focus:outline-none focus:border-[#9146ff]"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={saveCurrentPart}
            disabled={loading || saving}
            className="px-5 py-2.5 rounded-lg bg-[#9146ff] hover:bg-[#7c3aed] disabled:opacity-50 transition-colors"
          >
            {saving ? "Sauvegarde..." : "Enregistrer cette partie"}
          </button>
          {current.updatedAt ? (
            <p className="text-xs text-gray-400">
              Dernière mise à jour : {new Date(current.updatedAt).toLocaleString("fr-FR")}
            </p>
          ) : null}
        </div>
      </div>

      {feedback ? (
        <div className={`mt-4 p-3 rounded-lg border ${feedback.includes("succès") ? "bg-green-900/20 border-green-700 text-green-300" : "bg-red-900/20 border-red-700 text-red-300"}`}>
          {feedback}
        </div>
      ) : null}
    </div>
  );
}
