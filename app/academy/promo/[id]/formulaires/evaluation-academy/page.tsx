"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";

export default function EvaluationAcademyPage() {
  const params = useParams();
  const router = useRouter();
  const promoId =
    params && typeof params.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : "";
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    formatUtile: "",
    outilsClairs: "",
    duree: "",
    entraide: "",
    respecte: "",
    detailsRespecte: "",
    plusBenefique: "",
    pointsAmeliorer: "",
    participerFutur: "",
    suggestion: "",
  });

  useEffect(() => {
    async function checkAccess() {
      try {
        const discordUser = await getDiscordUser();
        setUser(discordUser);
        
        const response = await fetch("/api/academy/check-access", {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.hasAccess && data.activePromoId === promoId) {
            setHasAccess(true);
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
      const response = await fetch(`/api/academy/promo/${promoId}/formulaires/evaluation-academy`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.formData) {
          setFormData(prev => ({ ...prev, ...data.formData }));
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
      const response = await fetch(`/api/academy/promo/${promoId}/formulaires/evaluation-academy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData }),
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="mb-8">
        <Link
          href={`/academy/promo/${promoId}/formulaires`}
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour aux formulaires
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-5xl">📊</span>
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">
              Évaluation du dispositif TENF Academy
            </h1>
            <p className="text-purple-400 font-semibold">Facultatif & anonyme 🎓</p>
          </div>
        </div>
        
        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-500/10 p-4 mt-6">
          <p className="text-white text-sm leading-relaxed mb-2">
            <span className="font-semibold">📨</span> Ce questionnaire sert uniquement à <span className="font-semibold text-blue-300">améliorer la TENF Academy</span>.
            <br />
            Tu peux le remplir <span className="font-semibold">en message privé à un admin</span> ou via ce formulaire dédié.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Question 1 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">🧠</span>
            <span>Le format de la TENF Academy (15 jours) t'a-t-il été utile ?</span>
          </h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="formatUtile"
                value="oui-enormement"
                checked={formData.formatUtile === "oui-enormement"}
                onChange={(e) => setFormData({ ...formData, formatUtile: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Oui, énormément</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="formatUtile"
                value="oui-plutot"
                checked={formData.formatUtile === "oui-plutot"}
                onChange={(e) => setFormData({ ...formData, formatUtile: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Oui, plutôt</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="formatUtile"
                value="moyennement"
                checked={formData.formatUtile === "moyennement"}
                onChange={(e) => setFormData({ ...formData, formatUtile: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Moyennement</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="formatUtile"
                value="non-pas-du-tout"
                checked={formData.formatUtile === "non-pas-du-tout"}
                onChange={(e) => setFormData({ ...formData, formatUtile: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Non, pas du tout</span>
            </label>
          </div>
        </div>

        {/* Question 2 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">🔁</span>
            <span>Les outils mis à disposition étaient-ils clairs et adaptés ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> (salons, vocaux, questionnaires, organisation)
            </p>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="outilsClairs"
                value="tres-clairs"
                checked={formData.outilsClairs === "tres-clairs"}
                onChange={(e) => setFormData({ ...formData, outilsClairs: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Très clairs</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="outilsClairs"
                value="clairs"
                checked={formData.outilsClairs === "clairs"}
                onChange={(e) => setFormData({ ...formData, outilsClairs: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Clairs</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="outilsClairs"
                value="peu-clairs"
                checked={formData.outilsClairs === "peu-clairs"}
                onChange={(e) => setFormData({ ...formData, outilsClairs: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Peu clairs</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="outilsClairs"
                value="confus"
                checked={formData.outilsClairs === "confus"}
                onChange={(e) => setFormData({ ...formData, outilsClairs: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Confus</span>
            </label>
          </div>
        </div>

        {/* Question 3 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">📅</span>
            <span>La durée du parcours t'a semblé :</span>
          </h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="duree"
                value="parfaite"
                checked={formData.duree === "parfaite"}
                onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Parfaite</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="duree"
                value="un-peu-courte"
                checked={formData.duree === "un-peu-courte"}
                onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Un peu courte</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="duree"
                value="un-peu-longue"
                checked={formData.duree === "un-peu-longue"}
                onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Un peu longue</span>
            </label>
          </div>
        </div>

        {/* Question 4 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">🤝</span>
            <span>As-tu ressenti une vraie entraide dans ton groupe ? Pourquoi ?</span>
          </h2>
          <textarea
            value={formData.entraide}
            onChange={(e) => setFormData({ ...formData, entraide: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="As-tu ressenti une vraie entraide dans ton groupe ? Explique pourquoi..."
            required
          />
        </div>

        {/* Question 5 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">💬</span>
            <span>T'es-tu senti respecté et écouté durant le parcours ?</span>
          </h2>
          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="respecte"
                value="oui"
                checked={formData.respecte === "oui"}
                onChange={(e) => setFormData({ ...formData, respecte: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Oui</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="respecte"
                value="non"
                checked={formData.respecte === "non"}
                onChange={(e) => setFormData({ ...formData, respecte: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Non</span>
            </label>
          </div>
          {formData.respecte === "non" && (
            <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
              <p className="text-purple-200 text-sm mb-2">
                <span className="font-semibold">👉</span> Si non, n'hésite pas à préciser
              </p>
              <textarea
                value={formData.detailsRespecte}
                onChange={(e) => setFormData({ ...formData, detailsRespecte: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                placeholder="Précise ta réponse..."
              />
            </div>
          )}
        </div>

        {/* Question 6 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-teal-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">📈</span>
            <span>Qu'est-ce qui a été le plus bénéfique pour toi ?</span>
          </h2>
          <textarea
            value={formData.plusBenefique}
            onChange={(e) => setFormData({ ...formData, plusBenefique: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Qu'est-ce qui a été le plus bénéfique pour toi durant cette Academy ?"
            required
          />
        </div>

        {/* Question 7 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">❌</span>
            <span>Y a-t-il des points à améliorer selon toi ?</span>
          </h2>
          <textarea
            value={formData.pointsAmeliorer}
            onChange={(e) => setFormData({ ...formData, pointsAmeliorer: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Quels points pourraient être améliorés selon toi ?"
            required
          />
        </div>

        {/* Question 8 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">🌟</span>
            <span>Souhaiterais-tu participer à une future TENF Academy ?</span>
          </h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="participerFutur"
                value="oui"
                checked={formData.participerFutur === "oui"}
                onChange={(e) => setFormData({ ...formData, participerFutur: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Oui</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="participerFutur"
                value="non"
                checked={formData.participerFutur === "non"}
                onChange={(e) => setFormData({ ...formData, participerFutur: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Non</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="participerFutur"
                value="a-voir"
                checked={formData.participerFutur === "a-voir"}
                onChange={(e) => setFormData({ ...formData, participerFutur: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">À voir selon mes disponibilités</span>
            </label>
          </div>
        </div>

        {/* Question 9 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">💡</span>
            <span>Une suggestion pour les prochaines éditions ?</span>
          </h2>
          <textarea
            value={formData.suggestion}
            onChange={(e) => setFormData({ ...formData, suggestion: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="As-tu une suggestion pour améliorer les prochaines éditions de la TENF Academy ?"
            required
          />
        </div>

        {/* Message de fin */}
        <div className="rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/10 p-6 backdrop-blur-sm">
          <p className="text-white text-center text-lg">
            🙏 <span className="font-semibold">Merci pour ton temps et ton honnêteté !</span>
          </p>
          <p className="text-gray-300 text-center text-sm mt-2">
            Ton feedback anonyme nous aide à <span className="font-semibold text-green-300">améliorer la TENF Academy</span> pour les prochaines éditions 💙
          </p>
        </div>

        {/* Boutons */}
        <div className="flex gap-4 pt-4">
          <Link
            href={`/academy/promo/${promoId}/formulaires`}
            className="px-6 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Enregistrement..." : "✅ Envoyer l'évaluation (anonyme)"}
          </button>
        </div>
      </form>
    </div>
  );
}
