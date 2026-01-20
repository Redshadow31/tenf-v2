"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function AutoEvaluationDebutPage() {
  const params = useParams();
  const router = useRouter();
  const promoId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    objectifs: "",
    attentes: "",
    niveauActuel: "",
    freins: "",
    ressources: "",
  });

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch("/api/academy/check-access", {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.hasAccess && data.activePromoId === promoId) {
            setHasAccess(true);
            // Charger les données existantes si disponibles
            loadExistingData();
          } else {
            router.push("/academy/access");
          }
        } else {
          router.push("/academy/access");
        }
      } catch (error) {
        console.error("Erreur vérification accès:", error);
        router.push("/academy/access");
      } finally {
        setLoading(false);
      }
    }
    checkAccess();
  }, [promoId, router]);

  const loadExistingData = async () => {
    try {
      const response = await fetch(`/api/academy/promo/${promoId}/formulaires/auto-evaluation-debut`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.formData) {
          setFormData(data.formData);
        }
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/academy/promo/${promoId}/formulaires/auto-evaluation-debut`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push(`/academy/promo/${promoId}/formulaires`);
      } else {
        alert("Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff]"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Redirection en cours
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="mb-8">
        <Link
          href={`/academy/promo/${promoId}/formulaires`}
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour aux formulaires
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">🟣 Auto-évaluation (début)</h1>
        <p className="text-gray-400">Définissez vos objectifs et votre point de départ</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <label className="block mb-2 font-semibold text-white">
            Quels sont vos objectifs pour cette promo ?
          </label>
          <textarea
            value={formData.objectifs}
            onChange={(e) => setFormData({ ...formData, objectifs: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 rounded-lg bg-[#0e0e10] border border-gray-700 text-white placeholder-gray-400"
            placeholder="Décrivez vos objectifs..."
            required
          />
        </div>

        <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <label className="block mb-2 font-semibold text-white">
            Quelles sont vos attentes vis-à-vis de l'Academy ?
          </label>
          <textarea
            value={formData.attentes}
            onChange={(e) => setFormData({ ...formData, attentes: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 rounded-lg bg-[#0e0e10] border border-gray-700 text-white placeholder-gray-400"
            placeholder="Décrivez vos attentes..."
            required
          />
        </div>

        <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <label className="block mb-2 font-semibold text-white">
            Comment évaluez-vous votre niveau actuel ?
          </label>
          <textarea
            value={formData.niveauActuel}
            onChange={(e) => setFormData({ ...formData, niveauActuel: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 rounded-lg bg-[#0e0e10] border border-gray-700 text-white placeholder-gray-400"
            placeholder="Décrivez votre niveau actuel..."
            required
          />
        </div>

        <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <label className="block mb-2 font-semibold text-white">
            Quels sont vos freins ou difficultés actuelles ?
          </label>
          <textarea
            value={formData.freins}
            onChange={(e) => setFormData({ ...formData, freins: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 rounded-lg bg-[#0e0e10] border border-gray-700 text-white placeholder-gray-400"
            placeholder="Identifiez vos freins..."
            required
          />
        </div>

        <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <label className="block mb-2 font-semibold text-white">
            Quelles ressources ou compétences souhaitez-vous acquérir ?
          </label>
          <textarea
            value={formData.ressources}
            onChange={(e) => setFormData({ ...formData, ressources: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 rounded-lg bg-[#0e0e10] border border-gray-700 text-white placeholder-gray-400"
            placeholder="Listez les ressources souhaitées..."
            required
          />
        </div>

        <div className="flex gap-4">
          <Link
            href={`/academy/promo/${promoId}/formulaires`}
            className="px-6 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 rounded-lg bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
