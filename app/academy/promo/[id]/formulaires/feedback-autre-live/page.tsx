"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";

export default function FeedbackAutreLivePage() {
  const params = useParams();
  const router = useRouter();
  const promoId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    pseudoMembre: "",
    dateLive: "",
    typeContenu: "",
    apprecie: "",
    pointFort: "",
    pisteAmelioration: "",
    connexionChat: "",
    detailsConnexion: "",
    messageEncouragement: "",
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
      const response = await fetch(`/api/academy/promo/${promoId}/formulaires/feedback-autre-live`, {
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
      const response = await fetch(`/api/academy/promo/${promoId}/formulaires/feedback-autre-live`, {
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="mb-8">
        <Link
          href={`/academy/promo/${promoId}/formulaires`}
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour aux formulaires
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-5xl">🤝</span>
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">
              Feedback – Live d'un autre membre
            </h1>
            <p className="text-purple-400 font-semibold">TENF Academy 🎓</p>
          </div>
        </div>
        
        <div className="rounded-lg border-l-4 border-green-500 bg-green-500/10 p-4 mt-6">
          <p className="text-white text-sm leading-relaxed mb-2">
            <span className="font-semibold">👀</span> À poster après avoir vu un live <span className="font-semibold">en direct ou en replay</span> d'un autre participant.
            <br />
            Le feedback doit toujours être <span className="font-semibold text-green-300">respectueux, précis et utile</span>.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informations du live observé */}
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span>📋</span>
              <span>Informations du live observé</span>
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block mb-2 font-semibold text-white text-lg">
                  👤 Pseudo du membre observé :
                </label>
                <input
                  type="text"
                  value={formData.pseudoMembre}
                  onChange={(e) => setFormData({ ...formData, pseudoMembre: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                  placeholder="Le pseudo Twitch du membre dont tu as vu le live"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-white text-lg">
                  📅 Date du live observé :
                </label>
                <input
                  type="text"
                  value={formData.dateLive}
                  onChange={(e) => setFormData({ ...formData, dateLive: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                  placeholder="Ex: 15/02/2026"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-white text-lg">
                  🎮 Type de contenu :
                </label>
                <input
                  type="text"
                  value={formData.typeContenu}
                  onChange={(e) => setFormData({ ...formData, typeContenu: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                  placeholder="Ex: Gaming, Just Chatting, IRL, etc."
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Question 1 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">🌟</span>
            <span>Ce que j'ai particulièrement apprécié dans ce live</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Ambiance, relation au chat, contenu, posture, moment marquant…
            </p>
          </div>
          <textarea
            value={formData.apprecie}
            onChange={(e) => setFormData({ ...formData, apprecie: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Qu'est-ce qui t'a particulièrement plu dans ce live ?"
            required
          />
        </div>

        {/* Question 2 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">💪</span>
            <span>Un point fort clair que j'ai remarqué</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Quelque chose à valoriser.
            </p>
          </div>
          <textarea
            value={formData.pointFort}
            onChange={(e) => setFormData({ ...formData, pointFort: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Quel point fort as-tu remarqué chez ce streamer ?"
            required
          />
        </div>

        {/* Question 3 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">🔍</span>
            <span>Une piste d'amélioration possible (avec bienveillance)</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Une suggestion, pas une critique.
              <br />
              <span className="font-semibold">👉</span> "Tu pourrais tester…" plutôt que "Tu devrais…"
            </p>
          </div>
          <textarea
            value={formData.pisteAmelioration}
            onChange={(e) => setFormData({ ...formData, pisteAmelioration: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Quelle piste d'amélioration aimerais-tu suggérer avec bienveillance ?"
            required
          />
        </div>

        {/* Question 4 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">💬</span>
            <span>As-tu ressenti une vraie connexion avec le chat ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm mb-3">
              <span className="font-semibold">👉</span> Explique si nécessaire.
            </p>
          </div>
          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="connexionChat"
                value="oui"
                checked={formData.connexionChat === "oui"}
                onChange={(e) => setFormData({ ...formData, connexionChat: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Oui</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="connexionChat"
                value="plutot-oui"
                checked={formData.connexionChat === "plutot-oui"}
                onChange={(e) => setFormData({ ...formData, connexionChat: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Plutôt oui</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="connexionChat"
                value="difficile-a-dire"
                checked={formData.connexionChat === "difficile-a-dire"}
                onChange={(e) => setFormData({ ...formData, connexionChat: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Difficile à dire</span>
            </label>
          </div>
          <textarea
            value={formData.detailsConnexion}
            onChange={(e) => setFormData({ ...formData, detailsConnexion: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Explique si nécessaire..."
          />
        </div>

        {/* Question 5 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">💙</span>
            <span>Un message d'encouragement ou de soutien</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Ce que tu aimerais lui dire pour la suite.
            </p>
          </div>
          <textarea
            value={formData.messageEncouragement}
            onChange={(e) => setFormData({ ...formData, messageEncouragement: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Un message bienveillant pour encourager ce membre..."
            required
          />
        </div>

        {/* Message de fin */}
        <div className="rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/10 p-6 backdrop-blur-sm">
          <p className="text-white text-center text-lg mb-4">
            🙏 <span className="font-semibold">Merci de contribuer à un mentorat sain et respectueux.</span>
          </p>
          <p className="text-gray-300 text-center text-sm">
            Chaque retour est une <span className="font-semibold text-green-300">pierre à l'évolution du groupe</span>.
          </p>
        </div>

        {/* Règles implicites */}
        <div className="rounded-xl border-2 border-blue-500/30 bg-blue-500/10 p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>🧠</span>
            <span>Règles implicites (tu peux les dire à l'oral)</span>
          </h3>
          <ul className="space-y-2 text-white text-sm">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>on ne débat pas pour "avoir raison"</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>on ne juge jamais la personne</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>on parle d'actions, de ressentis, de pistes</span>
            </li>
          </ul>
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
            {saving ? "Enregistrement..." : "✅ Valider et enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
